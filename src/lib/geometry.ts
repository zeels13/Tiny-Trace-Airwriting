/**
 * Geometry utilities for stroke templates, rendering and evaluation.
 *
 * Coordinate pipeline:
 *   camera space (pixels, mirrored) -> normalized space (0..1) -> canvas space (px)
 *
 * Nothing here is AI. Scoring is deterministic geometry over point lists.
 */

import type { AccuracyResult, Point, Stroke, StrokeTemplate } from "./types";

export interface Size {
  width: number;
  height: number;
}

/** camera/video pixel coordinates -> normalized 0..1 (optionally mirrored). */
export function normalizePoint(p: Point, source: Size, mirrored = true): Point {
  const x = source.width ? p.x / source.width : 0;
  return {
    x: mirrored ? 1 - x : x,
    y: source.height ? p.y / source.height : 0,
    timestamp: p.timestamp,
  };
}

/** normalized 0..1 -> canvas pixels, with optional uniform padding. */
export function transformPoint(p: Point, target: Size, padding = 0): Point {
  return {
    x: padding + p.x * (target.width - padding * 2),
    y: padding + p.y * (target.height - padding * 2),
    timestamp: p.timestamp,
  };
}

export function scaleStroke(stroke: Stroke, sx: number, sy = sx): Stroke {
  return { ...stroke, points: stroke.points.map((p) => ({ ...p, x: p.x * sx, y: p.y * sy })) };
}

export function translateStroke(stroke: Stroke, dx: number, dy: number): Stroke {
  return { ...stroke, points: stroke.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })) };
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function strokeLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1]!, points[i]!);
  return total;
}

/** Resample a polyline into `count` evenly spaced points. */
export function resample(points: Point[], count = 48): Point[] {
  const first = points[0];
  if (!first) return [];
  if (points.length === 1) return Array.from({ length: count }, () => ({ ...first }));
  const total = strokeLength(points);
  const step = total / (count - 1);
  const out: Point[] = [{ ...first }];
  let prev: Point = first;
  let acc = 0;
  let i = 1;
  while (out.length < count && i < points.length) {
    const target = points[i]!;
    const d = dist(prev, target);
    if (acc + d >= step && d > 0) {
      const t = (step - acc) / d;
      const next: Point = {
        x: prev.x + (target.x - prev.x) * t,
        y: prev.y + (target.y - prev.y) * t,
      };
      out.push(next);
      prev = next;
      acc = 0;
    } else {
      acc += d;
      prev = target;
      i++;
    }
  }
  const last = points[points.length - 1]!;
  while (out.length < count) out.push({ ...last });
  return out;
}

/** Chaikin-style smoothing, used for the live finger trail. */
export function smooth(points: Point[], iterations = 1): Point[] {
  let pts = points;
  for (let it = 0; it < iterations; it++) {
    if (pts.length < 3) return pts;
    const next: Point[] = [pts[0]!];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    next.push(pts[pts.length - 1]!);
    pts = next;
  }
  return pts;
}

/** Exponential smoothing for a single incoming sample (jitter reduction). */
export function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, timestamp: b.timestamp };
}

export function boundingBox(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function toSvgPath(points: Point[]): string {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`).join(" ");
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

/* ------------------------------------------------------------------ *
 * Geometric stroke evaluation (local, deterministic — not AI).
 * ------------------------------------------------------------------ */

function score(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/*
 * Scoring model — hand-drawn tolerance, no free points.
 *
 * Per-stroke components (weights sum to 1):
 *   shape      0.55  Symmetric distance between guide and drawing (the drawn
 *                    side trims its worst 12% of points, so one stray point
 *                    cannot dominate; guide coverage is never trimmed, so
 *                    skipped sections cost points), blended 60/40 with how
 *                    much of the guide the child actually reached.
 *   direction  0.17  Tangent agreement measured at the NEAREST reference
 *                    segment, so a closed shape started elsewhere is not
 *                    punished, but a backwards stroke is.
 *   start      0.10  Distance from the guide's first point (anywhere on the
 *                    loop for closed guides).
 *   end        0.08  Distance from the guide's last point.
 *   smoothness 0.10  Extra wobble compared with the reference stroke.
 *
 *   The whole stroke is then gated by completion (half a stroke cannot score
 *   like a full one) and by length fit (a path far longer than the guide is
 *   scribbling, not tracing).
 *
 * Template score = mean of the per-stroke scores, minus:
 *   order     up to 12% for drawing the right strokes in the wrong order.
 *   extras    −6 per substantial unmatched stroke, capped at −15, so a big
 *             stray scribble costs some points but cannot decide the score.
 * A missing stroke scores 0 in the mean, so incomplete work is always
 * penalised. There are no free points: an unmatched guide contributes
 * nothing, and matching a guide without drawing it well does not help.
 *
 * Shape distance maps through exp(−(error / tolerance)²), where tolerance
 * scales with the stroke's own size (25% of it, floor 0.3), keeping small and
 * large templates equally fair. Closed guides let the stroke start anywhere
 * on the loop. Everything is clamped to 0…100; an empty drawing scores 0.
 */

const SCORE_POINTS = 48;
/** Prevents an unreasonably tight tolerance on very small templates. */
const SIZE_FLOOR = 0.3;
/** Error equal to this fraction of the stroke's size maps to ~37% shape. */
const SHAPE_TOLERANCE_RATIO = 0.25;
/** Fraction of the worst drawn points ignored by the shape average. */
const SHAPE_TRIM = 0.12;
/** Shorter strokes (normalized units) are treated as accidental dots. */
const MIN_MARK_LENGTH = 0.025;
const EXTRA_STROKE_PENALTY = 6;
const MAX_EXTRA_PENALTY = 15;

const STROKE_WEIGHTS = {
  shape: 0.55,
  direction: 0.17,
  start: 0.1,
  end: 0.08,
  smoothness: 0.1,
} as const;

/** Weighted score multiplier is 0.5 + 0.5 × how much of the stroke was drawn. */
const COMPLETION_BASE = 0.5;
/** Drawing up to 1.5× the guide's length is normal hand wobble. */
const OVERSHOOT_ALLOWANCE = 1.5;
/** Scribbles still keep this share of their (already low) score. */
const MIN_OVERSHOOT_FACTOR = 0.35;
/** Template-level penalty for drawing the right strokes in the wrong order. */
const ORDER_PENALTY = 0.12;
/** A guide is treated as closed when its ends are within this size fraction. */
const CLOSED_GUIDE_RATIO = 0.35;

function emptyAccuracy(): AccuracyResult {
  return {
    overall: 0,
    shapeSimilarity: 0,
    direction: 0,
    startPoint: 0,
    endPoint: 0,
    smoothness: 0,
  };
}

/** Distance from a point to the closest segment of a polyline. */
function nearestOnPolyline(point: Point, polyline: Point[]): { distance: number; index: number } {
  if (polyline.length === 0) return { distance: Infinity, index: 0 };
  if (polyline.length === 1) return { distance: dist(point, polyline[0]!), index: 0 };

  let bestDistance = Infinity;
  let bestIndex = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i]!;
    const b = polyline[i + 1]!;
    const d = distanceToSegment(point, a, b);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }
  return { distance: bestDistance, index: bestIndex };
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return dist(point, a);
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared),
  );
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/** Mean of the values, ignoring the largest `trim` fraction (outlier guard). */
function trimmedMean(values: number[], trim: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const keep = Math.max(1, Math.ceil(sorted.length * (1 - trim)));
  let sum = 0;
  for (let i = 0; i < keep; i++) sum += sorted[i]!;
  return sum / keep;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

/** Characteristic size of a stroke, used to scale the shape tolerance. */
function strokeSize(points: Point[]): number {
  const box = boundingBox(points);
  return Math.max(box.width, box.height, SIZE_FLOOR);
}

/** Symmetric polyline distance: half drawn→guide, half guide→drawn coverage. */
function shapeError(guide: Point[], drawing: Point[]): number {
  if (guide.length < 2 || drawing.length < 2) return 1;
  const toGuide = trimmedMean(
    drawing.map((p) => nearestOnPolyline(p, guide).distance),
    SHAPE_TRIM,
  );
  const toDrawing = mean(guide.map((p) => nearestOnPolyline(p, drawing).distance));
  return toGuide * 0.45 + toDrawing * 0.55;
}

/**
 * Smooth 0…1 estimate of how much of the guide the drawing reached: each
 * guide point scores 1 when the drawing touches it and 0 a tolerance away.
 * This is what makes a half-finished stroke score like a half-finished stroke.
 */
function guideCoverage(guide: Point[], drawing: Point[], tolerance: number): number {
  const shares = guide.map((p) => {
    const distance = nearestOnPolyline(p, drawing).distance;
    return Math.max(0, 1 - distance / tolerance);
  });
  return Math.min(1, mean(shares));
}

/** Tangent agreement, sampled at the nearest guide segment. */
function directionScore(guide: Point[], drawing: Point[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 1; i < drawing.length; i++) {
    const a = drawing[i - 1]!;
    const b = drawing[i]!;
    const drawnLength = Math.hypot(b.x - a.x, b.y - a.y);
    if (drawnLength < 1e-6) continue;

    const { index } = nearestOnPolyline(b, guide);
    const guideA = guide[index]!;
    const guideB = guide[index + 1] ?? guideA;
    const guideLength = Math.hypot(guideB.x - guideA.x, guideB.y - guideA.y);
    if (guideLength < 1e-6) continue;

    const dot =
      ((b.x - a.x) * (guideB.x - guideA.x) + (b.y - a.y) * (guideB.y - guideA.y)) /
      (drawnLength * guideLength);
    sum += dot;
    count++;
  }
  if (count === 0) return 0;
  return score(((sum / count) * 0.5 + 0.5) * 100);
}

function endpointScore(drawn: Point[], target: Point): number {
  return score(100 - dist(drawn[0]!, target) * 260);
}

function pathEndScore(drawn: Point[], target: Point): number {
  return score(100 - dist(drawn[drawn.length - 1]!, target) * 260);
}

export function evaluateStroke(reference: Point[], drawn: Point[]): AccuracyResult {
  if (drawn.length < 2 || reference.length < 2) return emptyAccuracy();

  const guide = resample(reference, SCORE_POINTS);
  const drawing = resample(drawn, SCORE_POINTS);

  const drawnLength = strokeLength(drawn);
  const tolerance = SHAPE_TOLERANCE_RATIO * strokeSize(reference);
  const error = shapeError(guide, drawing);
  // Shape = distance falloff (60%) blended with guide coverage (40%).
  const coverage = guideCoverage(guide, drawing, tolerance);
  const shapeSimilarity = score(
    100 * Math.exp(-((error / tolerance) ** 2)) * (0.6 + 0.4 * coverage),
  );

  // Closed guides (circles, “O”) may be started anywhere on the loop.
  const size = strokeSize(reference);
  const closed =
    dist(reference[0]!, reference[reference.length - 1]!) <= CLOSED_GUIDE_RATIO * size;
  const startPoint = closed
    ? score(100 - nearestOnPolyline(drawn[0]!, guide).distance * 260)
    : endpointScore(drawn, reference[0]!);
  const endPoint = closed
    ? score(100 - nearestOnPolyline(drawn[drawn.length - 1]!, guide).distance * 260)
    : pathEndScore(drawn, reference[reference.length - 1]!);

  const direction = directionScore(guide, drawing);

  // Smoothness: penalise sharp turns the guide does not have.
  const smoothness = score(100 - Math.max(0, jitter(drawing) - jitter(guide)) * 150);

  // Completion gate: a stroke drawn only part way is worth proportionally less,
  // no matter how neat the part that was drawn looks.
  const guideLength = Math.max(1e-6, strokeLength(reference));
  const lengthRatio = drawnLength / guideLength;
  const completionFactor = COMPLETION_BASE + (1 - COMPLETION_BASE) * Math.min(1, lengthRatio);
  // A much longer path than the guide is scribbling, not tracing.
  const overshootFactor =
    lengthRatio <= OVERSHOOT_ALLOWANCE
      ? 1
      : Math.max(MIN_OVERSHOOT_FACTOR, OVERSHOOT_ALLOWANCE / lengthRatio);

  const overall = score(
    (shapeSimilarity * STROKE_WEIGHTS.shape +
      direction * STROKE_WEIGHTS.direction +
      startPoint * STROKE_WEIGHTS.start +
      endPoint * STROKE_WEIGHTS.end +
      smoothness * STROKE_WEIGHTS.smoothness) *
      completionFactor *
      overshootFactor,
  );

  return { overall, shapeSimilarity, direction, startPoint, endPoint, smoothness };
}

export function evaluateTemplate(template: StrokeTemplate, drawn: Stroke[]): AccuracyResult {
  const references = template.strokes.map((s) => s.points);
  if (references.length === 0) return { ...emptyAccuracy(), strokeOrder: 0 };

  // Accidental dots are ignored entirely: they are far shorter than any guide
  // stroke, so they neither shift stroke matching nor cost the child points.
  const usable = drawn.filter(
    (stroke) => stroke.points.length >= 2 && strokeLength(stroke.points) >= MIN_MARK_LENGTH,
  );

  // Pair every guide stroke with every candidate by shape distance, then take
  // the globally best pairs greedily. This keeps one stray stroke from
  // shifting every later stroke onto the wrong reference.
  const candidates = usable.map((stroke) => resample(stroke.points, SCORE_POINTS));
  const pairs: { refIndex: number; drawnIndex: number; error: number }[] = [];
  references.forEach((reference, refIndex) => {
    const guide = resample(reference, SCORE_POINTS);
    candidates.forEach((drawing, drawnIndex) => {
      pairs.push({ refIndex, drawnIndex, error: shapeError(guide, drawing) });
    });
  });
  pairs.sort((a, b) => a.error - b.error);

  const matchOf = references.map(() => -1);
  const used = new Set<number>();
  for (const pair of pairs) {
    if (matchOf[pair.refIndex] !== -1 || used.has(pair.drawnIndex)) continue;
    matchOf[pair.refIndex] = pair.drawnIndex;
    used.add(pair.drawnIndex);
  }

  const perStroke = references.map((reference, index) => {
    const drawnIndex = matchOf[index]!;
    return evaluateStroke(reference, drawnIndex >= 0 ? usable[drawnIndex]!.points : []);
  });

  const matchedCount = matchOf.filter((index) => index >= 0).length;
  const coverage = matchedCount / references.length;

  // Order: among matched strokes, do drawn indices rise with guide order?
  const drawnIndices = matchOf.filter((index) => index >= 0);
  let increasing = 0;
  let comparisons = 0;
  for (let i = 1; i < drawnIndices.length; i++) {
    comparisons++;
    if (drawnIndices[i]! > drawnIndices[i - 1]!) increasing++;
  }
  const orderRatio = comparisons === 0 ? 1 : increasing / comparisons;
  const strokeOrder = score(coverage * (0.5 + 0.5 * orderRatio) * 100);

  const average = (pick: (r: AccuracyResult) => number | undefined) =>
    score(perStroke.reduce((sum, r) => sum + (pick(r) ?? 0), 0) / references.length);

  const extraStrokes = Math.max(0, usable.length - matchedCount);
  const extraPenalty = Math.min(MAX_EXTRA_PENALTY, extraStrokes * EXTRA_STROKE_PENALTY);

  // No free points for merely matching a guide: the mean stands on its own and
  // order/extras only ever subtract. Missing strokes already score 0 above.
  const meanScore = average((r) => r.overall);
  const orderPenalty = meanScore * ORDER_PENALTY * (1 - orderRatio);
  const overall = score(meanScore - orderPenalty - extraPenalty);

  return {
    overall,
    shapeSimilarity: average((r) => r.shapeSimilarity),
    direction: average((r) => r.direction),
    startPoint: average((r) => r.startPoint),
    endPoint: average((r) => r.endPoint),
    smoothness: average((r) => r.smoothness),
    strokeOrder,
  };
}

function jitter(points: Point[]) {
  let sum = 0;
  for (let i = 2; i < points.length; i++) {
    const a = unit({ x: points[i - 1]!.x - points[i - 2]!.x, y: points[i - 1]!.y - points[i - 2]!.y });
    const b = unit({ x: points[i]!.x - points[i - 1]!.x, y: points[i]!.y - points[i - 1]!.y });
    sum += 1 - (a.x * b.x + a.y * b.y);
  }
  return sum / Math.max(1, points.length - 2);
}

function unit(p: { x: number; y: number }): { x: number; y: number } {
  const m = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / m, y: p.y / m };
}

export function starsFor(accuracy: number): number {
  if (accuracy >= 95) return 5;
  if (accuracy >= 86) return 4;
  if (accuracy >= 74) return 3;
  if (accuracy >= 60) return 2;
  if (accuracy >= 40) return 1;
  return 0;
}
