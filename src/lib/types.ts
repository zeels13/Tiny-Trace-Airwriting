/**
 * Core Tiny Trace data model.
 *
 * All stroke geometry lives in a normalized unit space (0..1 on both axes),
 * independent of screen size or camera resolution. Renderers and the future
 * vision pipeline both convert into / out of this space.
 */

export interface Point {
  x: number;
  y: number;
  timestamp?: number | undefined;
}

export interface Stroke {
  id: string;
  points: Point[];
  /** Optional human hint used by the guide panel, e.g. "left to right". */
  direction?: string | undefined;
}

export interface StrokeTemplate {
  /** The character or shape being traced, e.g. "C", "7", "circle". */
  character: string;
  strokes: Stroke[];
}

export type LessonKind = "stroke" | "shape" | "number" | "letter" | "word";

export interface Lesson {
  id: string;
  worldId: WorldId;
  order: number;
  title: string;
  /** Short child-facing instruction, e.g. "Left to right, nice and slow." */
  hint: string;
  kind: LessonKind;
  template: StrokeTemplate;
  xpReward: number;
}

export type WorldId =
  | "stroke-forest"
  | "shape-valley"
  | "number-river"
  | "alphabet-jungle"
  | "word-safari";

export interface World {
  id: WorldId;
  index: number;
  name: string;
  tagline: string;
  kind: LessonKind;
  /** Animal that guides this world. */
  guide: AnimalId;
  /** Design-token driven environment identity. */
  theme: {
    surface: string;
    ink: string;
    accent: string;
    path: string;
  };
  /** Lessons the child must finish before the next world opens. */
  lessonsToUnlockNext: number;
}

export interface Level {
  id: WorldId;
  name: string;
  lessons: Lesson[];
}

export interface AccuracyResult {
  overall: number;
  shapeSimilarity?: number;
  direction?: number;
  startPoint?: number;
  endPoint?: number;
  smoothness?: number;
  strokeOrder?: number;
}

export interface LessonAttempt {
  id: string;
  lessonId: string;
  at: string;
  accuracy: AccuracyResult;
  stars: number;
  seconds: number;
}

export interface LessonProgress {
  lessonId: string;
  stars: number;
  bestAccuracy: number;
  attempts: number;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Named icon in the badge component's own vocabulary. */
  motif: "leaf" | "star" | "flame" | "paw" | "river" | "sun";
}

export type AnimalId =
  | "lion"
  | "caterpillar"
  | "turtle"
  | "monkey"
  | "giraffe"
  | "parrot"
  | "elephant"
  | "butterfly";

export interface AnimalFriend {
  id: AnimalId;
  name: string;
  role: string;
  unlockHint: string;
  /** Lesson count across the whole journey required to befriend it. */
  unlockAtLessons: number;
}

export interface Progress {
  childName: string;
  xp: number;
  streak: number;
  lastPracticeDay: string | null;
  practiceSeconds: number;
  lessons: Record<string, LessonProgress>;
  badges: string[];
  animals: AnimalId[];
  attempts: LessonAttempt[];
  onboarded: boolean;
  settings: Settings;
}

export interface Settings {
  sound: boolean;
  voiceGuide: boolean;
  reducedMotion: boolean;
  /** Demo mode replaces the (not yet built) camera pipeline with a simulator. */
  demoMode: boolean;
}
