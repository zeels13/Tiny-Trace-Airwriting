/**
 * Stroke-template authoring helpers plus the glyph skeletons used by every
 * lesson. Everything is expressed in normalized unit space (0..1).
 */

import type { Point, Stroke, StrokeTemplate } from "@/lib/types";
import { scaleStroke, translateStroke } from "@/lib/geometry";

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function line(x1: number, y1: number, x2: number, y2: number, n = 12): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
  });
}

export function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  n = 24,
): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((from + (to - from) * (i / (n - 1))) * Math.PI) / 180;
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  });
}

export function poly(...pts: [number, number][]): Point[] {
  const out: Point[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const seg = line(a[0], a[1], b[0], b[1], 10);
    out.push(...(i === 1 ? seg : seg.slice(1)));
  }
  return out;
}

function cubicBezier(
  start: [number, number],
  control1: [number, number],
  control2: [number, number],
  end: [number, number],
  n = 24,
): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const u = 1 - t;
    return {
      x: u ** 3 * start[0] + 3 * u ** 2 * t * control1[0] + 3 * u * t ** 2 * control2[0] + t ** 3 * end[0],
      y: u ** 3 * start[1] + 3 * u ** 2 * t * control1[1] + 3 * u * t ** 2 * control2[1] + t ** 3 * end[1],
    };
  });
}

export function stroke(points: Point[], direction?: string): Stroke {
  return { id: nextId("s"), points, direction };
}

export function template(character: string, strokes: Stroke[]): StrokeTemplate {
  return { character, strokes };
}

/* ---------------------------- strokes level --------------------------- */

export const STROKE_GLYPHS: Record<string, StrokeTemplate> = {
  horizontal: template("horizontal", [stroke(line(0.12, 0.5, 0.88, 0.5), "left to right")]),
  vertical: template("vertical", [stroke(line(0.5, 0.12, 0.5, 0.88), "top to bottom")]),
  diagonal: template("diagonal", [stroke(line(0.16, 0.84, 0.84, 0.16), "bottom-left to top-right")]),
  curve: template("curve", [stroke(arc(0.5, 0.5, 0.36, 0.36, 200, 340), "sweep up like a hill")]),
  zigzag: template("zigzag", [
    stroke(poly([0.12, 0.7], [0.35, 0.3], [0.58, 0.7], [0.82, 0.3]), "up, down, up"),
  ]),
};

/* ---------------------------- shapes level ---------------------------- */

export const SHAPE_GLYPHS: Record<string, StrokeTemplate> = {
  circle: template("circle", [stroke(arc(0.5, 0.5, 0.34, 0.34, -90, 270), "start at the top, go around")]),
  square: template("square", [
    stroke(line(0.2, 0.2, 0.8, 0.2), "across the top"),
    stroke(line(0.8, 0.2, 0.8, 0.8), "down the side"),
    stroke(line(0.8, 0.8, 0.2, 0.8), "back along the bottom"),
    stroke(line(0.2, 0.8, 0.2, 0.2), "up to the start"),
  ]),
  triangle: template("triangle", [
    stroke(line(0.5, 0.16, 0.85, 0.82), "down to the right"),
    stroke(line(0.85, 0.82, 0.15, 0.82), "across the bottom"),
    stroke(line(0.15, 0.82, 0.5, 0.16), "back up to the top"),
  ]),
  rectangle: template("rectangle", [
    stroke(line(0.12, 0.3, 0.88, 0.3), "a long line across"),
    stroke(line(0.88, 0.3, 0.88, 0.7), "short line down"),
    stroke(line(0.88, 0.7, 0.12, 0.7), "long line back"),
    stroke(line(0.12, 0.7, 0.12, 0.3), "short line up"),
  ]),
  oval: template("oval", [stroke(arc(0.5, 0.5, 0.36, 0.26, -90, 270), "a stretched circle")]),
  star: template("star", [
    stroke(
      poly([0.5, 0.14], [0.62, 0.43], [0.9, 0.46], [0.68, 0.63], [0.78, 0.9]),
      "point to point",
    ),
    stroke(poly([0.78, 0.9], [0.5, 0.72], [0.22, 0.9], [0.32, 0.63], [0.1, 0.46], [0.38, 0.43], [0.5, 0.14])),
  ]),
  heart: template("heart", [
    stroke(
      [
        ...cubicBezier([0.5, 0.34], [0.34, 0.12], [0.13, 0.22], [0.17, 0.44]),
        ...cubicBezier([0.17, 0.44], [0.19, 0.63], [0.38, 0.78], [0.5, 0.86]).slice(1),
      ],
      "left hump down to the point",
    ),
    stroke(
      [
        ...cubicBezier([0.5, 0.34], [0.66, 0.12], [0.87, 0.22], [0.83, 0.44]),
        ...cubicBezier([0.83, 0.44], [0.81, 0.63], [0.62, 0.78], [0.5, 0.86]).slice(1),
      ],
      "right hump down to the point",
    ),
  ]),
};

/* ---------------------------- numbers level --------------------------- */

export const NUMBER_GLYPHS: Record<string, StrokeTemplate> = {
  "0": template("0", [stroke(arc(0.5, 0.5, 0.24, 0.36, -90, 270), "around like an egg")]),
  "1": template("1", [
    stroke(line(0.38, 0.34, 0.52, 0.22), "little flag first"),
    stroke(line(0.52, 0.22, 0.52, 0.78), "straight down"),
  ]),
  "2": template("2", [
    stroke([...arc(0.5, 0.32, 0.22, 0.2, 180, 360), ...line(0.72, 0.32, 0.28, 0.84, 10)], "curve over the top, then slide down"),
    stroke(line(0.28, 0.84, 0.74, 0.84), "across the bottom"),
  ]),
  "3": template("3", [
    stroke(
      [
        ...cubicBezier([0.3, 0.18], [0.78, 0.08], [0.78, 0.48], [0.5, 0.5]),
        ...cubicBezier([0.5, 0.5], [0.78, 0.52], [0.78, 0.9], [0.3, 0.8]).slice(1),
      ],
      "curve around the top, then around the bottom",
    ),
  ]),
  "4": template("4", [
    stroke(poly([0.62, 0.14], [0.26, 0.62], [0.78, 0.62]), "down and across"),
    stroke(line(0.62, 0.32, 0.62, 0.88), "long line down"),
  ]),
  "5": template("5", [
    stroke(poly([0.72, 0.16], [0.34, 0.16], [0.32, 0.5]), "across then down"),
    stroke(arc(0.5, 0.63, 0.22, 0.23, -145, 120), "big belly curve"),
  ]),
  "6": template("6", [
    stroke(
      [...cubicBezier([0.7, 0.16], [0.38, 0.22], [0.26, 0.46], [0.3, 0.68]), ...arc(0.5, 0.68, 0.2, 0.2, 180, 540).slice(1)],
      "curve down and loop around",
    ),
  ]),
  "7": template("7", [
    stroke(line(0.24, 0.16, 0.78, 0.16), "across the top"),
    stroke(line(0.78, 0.16, 0.4, 0.86), "slide down"),
  ]),
  "8": template("8", [
    stroke([...arc(0.5, 0.32, 0.19, 0.18, 90, 450), ...arc(0.5, 0.68, 0.22, 0.2, -90, 270)], "loop around the top, then around the bottom"),
  ]),
  "9": template("9", [
    stroke(arc(0.52, 0.34, 0.2, 0.2, -90, 270), "circle on top"),
    stroke(line(0.72, 0.34, 0.66, 0.88), "tail down"),
  ]),
};

/* --------------------------- alphabet level --------------------------- */

export const LETTER_GLYPHS: Record<string, StrokeTemplate> = {
  A: template("A", [
    stroke(line(0.2, 0.86, 0.5, 0.14), "up the mountain"),
    stroke(line(0.5, 0.14, 0.8, 0.86), "down the other side"),
    stroke(line(0.3, 0.6, 0.7, 0.6), "little bridge"),
  ]),
  B: template("B", [
    stroke(line(0.3, 0.14, 0.3, 0.86), "long line down"),
    stroke(arc(0.3, 0.32, 0.26, 0.18, -90, 90), "top bump"),
    stroke(arc(0.3, 0.68, 0.29, 0.18, -90, 90), "bottom bump"),
  ]),
  C: template("C", [stroke(arc(0.52, 0.5, 0.28, 0.36, -55, -305), "curve like a moon")]),
  D: template("D", [
    stroke(line(0.3, 0.14, 0.3, 0.86), "down the wall"),
    stroke(arc(0.3, 0.5, 0.34, 0.36, -90, 90), "big belly"),
  ]),
  E: template("E", [
    stroke(line(0.32, 0.14, 0.32, 0.86), "down"),
    stroke(line(0.32, 0.14, 0.74, 0.14), "top shelf"),
    stroke(line(0.32, 0.5, 0.68, 0.5), "middle shelf"),
    stroke(line(0.32, 0.86, 0.74, 0.86), "bottom shelf"),
  ]),
  F: template("F", [
    stroke(line(0.32, 0.14, 0.32, 0.86), "down"),
    stroke(line(0.32, 0.14, 0.74, 0.14), "top shelf"),
    stroke(line(0.32, 0.48, 0.66, 0.48), "middle shelf"),
  ]),
  G: template("G", [
    // Start at the upper-right, curve over the top and around the left and
    // bottom, and end at the right midpoint so the crossbar joins the curve.
    stroke(arc(0.52, 0.5, 0.28, 0.36, -45, -360), "start at the top-right, curve over the top and around the left and bottom"),
    stroke(line(0.52, 0.5, 0.8, 0.5), "from the middle, draw the short bar across to the right"),
  ]),
  H: template("H", [
    stroke(line(0.28, 0.14, 0.28, 0.86), "down"),
    stroke(line(0.72, 0.14, 0.72, 0.86), "down again"),
    stroke(line(0.28, 0.5, 0.72, 0.5), "bridge across"),
  ]),
  I: template("I", [
    stroke(line(0.5, 0.14, 0.5, 0.86), "straight down"),
    stroke(line(0.32, 0.14, 0.68, 0.14), "hat on top"),
    stroke(line(0.32, 0.86, 0.68, 0.86), "shoes below"),
  ]),
  J: template("J", [
    stroke([...line(0.62, 0.14, 0.62, 0.66, 8), ...arc(0.44, 0.66, 0.18, 0.2, 0, 140)], "down then curve"),
  ]),
  K: template("K", [
    stroke(line(0.3, 0.14, 0.3, 0.86), "down"),
    stroke(line(0.74, 0.14, 0.32, 0.52), "slide in"),
    stroke(line(0.34, 0.52, 0.76, 0.86), "kick out"),
  ]),
  L: template("L", [
    stroke(line(0.34, 0.14, 0.34, 0.86), "down"),
    stroke(line(0.34, 0.86, 0.74, 0.86), "along the floor"),
  ]),
  M: template("M", [
    stroke(line(0.22, 0.86, 0.22, 0.14), "up"),
    stroke(line(0.22, 0.14, 0.5, 0.56), "down the valley"),
    stroke(line(0.5, 0.56, 0.78, 0.14), "up again"),
    stroke(line(0.78, 0.14, 0.78, 0.86), "down"),
  ]),
  N: template("N", [
    stroke(line(0.28, 0.86, 0.28, 0.14), "up"),
    stroke(line(0.28, 0.14, 0.72, 0.86), "diagonal down"),
    stroke(line(0.72, 0.86, 0.72, 0.14), "up"),
  ]),
  O: template("O", [stroke(arc(0.5, 0.5, 0.3, 0.36, -90, 270), "all the way around")]),
  P: template("P", [
    stroke(line(0.32, 0.14, 0.32, 0.86), "down"),
    stroke(arc(0.32, 0.33, 0.26, 0.19, -90, 90), "one bump"),
  ]),
  Q: template("Q", [
    stroke(arc(0.5, 0.48, 0.28, 0.34, -90, 270), "around"),
    stroke(line(0.7, 0.72, 0.86, 0.9), "little tail"),
  ]),
  R: template("R", [
    stroke(line(0.32, 0.14, 0.32, 0.86), "down"),
    stroke(arc(0.32, 0.33, 0.26, 0.19, -90, 90), "bump"),
    stroke(line(0.34, 0.52, 0.74, 0.86), "kick out"),
  ]),
  S: template("S", [
    stroke(
      [
        ...cubicBezier([0.72, 0.2], [0.3, 0.06], [0.25, 0.48], [0.5, 0.5]),
        ...cubicBezier([0.5, 0.5], [0.75, 0.52], [0.75, 0.94], [0.28, 0.8]).slice(1),
      ],
      "curve left, then sweep right and back left",
    ),
  ]),
  T: template("T", [
    stroke(line(0.26, 0.14, 0.74, 0.14), "across the top"),
    stroke(line(0.5, 0.14, 0.5, 0.86), "straight down"),
  ]),
  U: template("U", [
    stroke([...line(0.28, 0.14, 0.28, 0.6, 6), ...arc(0.5, 0.6, 0.22, 0.26, 180, 0), ...line(0.72, 0.6, 0.72, 0.14, 6)], "down, around, up"),
  ]),
  V: template("V", [
    stroke(line(0.24, 0.14, 0.5, 0.86), "down"),
    stroke(line(0.5, 0.86, 0.76, 0.14), "up"),
  ]),
  W: template("W", [
    stroke(line(0.16, 0.14, 0.34, 0.86), "down"),
    stroke(line(0.34, 0.86, 0.5, 0.34), "up"),
    stroke(line(0.5, 0.34, 0.66, 0.86), "down"),
    stroke(line(0.66, 0.86, 0.84, 0.14), "up"),
  ]),
  X: template("X", [
    stroke(line(0.26, 0.14, 0.74, 0.86), "one cross"),
    stroke(line(0.74, 0.14, 0.26, 0.86), "other cross"),
  ]),
  Y: template("Y", [
    stroke(line(0.26, 0.14, 0.5, 0.52), "down in"),
    stroke(line(0.74, 0.14, 0.5, 0.52), "meet in the middle"),
    stroke(line(0.5, 0.52, 0.5, 0.86), "stem down"),
  ]),
  Z: template("Z", [
    stroke(line(0.26, 0.16, 0.74, 0.16), "across"),
    stroke(line(0.74, 0.16, 0.26, 0.84), "slide down"),
    stroke(line(0.26, 0.84, 0.74, 0.84), "across again"),
  ]),
};

/**
 * Compose a word template out of letter skeletons using scale + translate,
 * so word lessons reuse the same geometry as the alphabet.
 */
export function wordTemplate(word: string): StrokeTemplate {
  const letters = word.toUpperCase().split("");
  const w = 1 / letters.length;
  const strokes: Stroke[] = [];
  letters.forEach((ch, i) => {
    const glyph = LETTER_GLYPHS[ch];
    if (!glyph) return;
    const letterScaleX = w * 1.3;
    const letterScaleY = Math.min(0.86, 1.5 / letters.length);
    const letterOffsetX = i * w + (w - letterScaleX) / 2;
    const letterOffsetY = (1 - letterScaleY) / 2;
    glyph.strokes.forEach((s) => {
      const scaled = scaleStroke(s, letterScaleX, letterScaleY);
      strokes.push({ ...translateStroke(scaled, letterOffsetX, letterOffsetY), id: `${word}-${i}-${s.id}` });
    });
  });
  return { character: word.toUpperCase(), strokes };
}
