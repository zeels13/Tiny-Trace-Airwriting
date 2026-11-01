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
      poly([0.5, 0.14], [0.65, 0.55], [0.9, 0.55], [0.7, 0.75], [0.78, 0.9]),
      "point to point",
    ),
    stroke(poly([0.78, 0.9], [0.5, 0.72], [0.22, 0.9], [0.3, 0.75], [0.1, 0.55], [0.35, 0.55], [0.5, 0.14])),
  ]),
  heart: template("heart", [
    stroke([...arc(0.35, 0.36, 0.18, 0.18, 160, -20), ...line(0.53, 0.36, 0.5, 0.86, 8)], "left hump then down"),
    stroke([...arc(0.65, 0.36, 0.18, 0.18, -160, 20).reverse(), ...line(0.47, 0.36, 0.5, 0.86, 8)]),
  ]),
};

/* ---------------------------- numbers level --------------------------- */

export const NUMBER_GLYPHS: Record<string, StrokeTemplate> = {
  "0": template("0", [stroke(arc(0.5, 0.5, 0.24, 0.36, -90, 270), "around like an egg")]),
  "1": template("1", [
    stroke(line(0.36, 0.28, 0.52, 0.14), "little flag first"),
    stroke(line(0.52, 0.14, 0.52, 0.86), "straight down"),
  ]),
  "2": template("2", [
    stroke([...arc(0.5, 0.32, 0.22, 0.2, 190, 20), ...line(0.7, 0.42, 0.28, 0.84, 10)], "curve then slide down"),
    stroke(line(0.28, 0.84, 0.74, 0.84), "across the bottom"),
  ]),
  "3": template("3", [
    stroke(arc(0.48, 0.32, 0.22, 0.19, 190, 90), "top curve"),
    stroke(arc(0.48, 0.68, 0.24, 0.2, -90, 110), "bottom curve"),
  ]),
  "4": template("4", [
    stroke(poly([0.62, 0.14], [0.26, 0.62], [0.78, 0.62]), "down and across"),
    stroke(line(0.62, 0.32, 0.62, 0.88), "long line down"),
  ]),
  "5": template("5", [
    stroke(poly([0.72, 0.16], [0.34, 0.16], [0.32, 0.46]), "across then down"),
    stroke(arc(0.5, 0.63, 0.22, 0.23, -110, 120), "big belly curve"),
  ]),
  "6": template("6", [
    stroke([...arc(0.52, 0.4, 0.22, 0.26, -20, -140), ...arc(0.5, 0.66, 0.22, 0.22, 180, 540, 28)], "slide down and loop"),
  ]),
  "7": template("7", [
    stroke(line(0.24, 0.16, 0.78, 0.16), "across the top"),
    stroke(line(0.78, 0.16, 0.4, 0.86), "slide down"),
  ]),
  "8": template("8", [
    stroke([...arc(0.5, 0.32, 0.19, 0.18, -90, 270), ...arc(0.5, 0.68, 0.22, 0.2, 90, -270)], "two loops"),
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
  C: template("C", [stroke(arc(0.52, 0.5, 0.28, 0.36, -55, 235), "curve like a moon")]),
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
    stroke(arc(0.52, 0.5, 0.28, 0.36, -55, 250), "curve around"),
    stroke(line(0.68, 0.5, 0.68, 0.66), "little hook"),
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
    stroke(line(0.62, 0.68, 0.8, 0.9), "little tail"),
  ]),
  R: template("R", [
    stroke(line(0.32, 0.14, 0.32, 0.86), "down"),
    stroke(arc(0.32, 0.33, 0.26, 0.19, -90, 90), "bump"),
    stroke(line(0.34, 0.52, 0.74, 0.86), "kick out"),
  ]),
  S: template("S", [
    stroke([...arc(0.5, 0.32, 0.2, 0.18, 20, 200), ...arc(0.5, 0.68, 0.2, 0.18, -160, 20)], "wiggle like a snake"),
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
    glyph.strokes.forEach((s) => {
      const scaled = scaleStroke(s, w * 0.92, 0.86);
      strokes.push({ ...translateStroke(scaled, i * w + w * 0.04, 0.07), id: `${word}-${i}-${s.id}` });
    });
  });
  return { character: word.toUpperCase(), strokes };
}
