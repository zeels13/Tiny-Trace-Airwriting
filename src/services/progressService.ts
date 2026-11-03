/**
 * progressService — mock persistence layer.
 *
 * Reads/writes localStorage today. Swap the two functions below for real API
 * calls (FastAPI + database) without touching any component.
 */

import type { Progress } from "@/lib/types";
import { ANIMALS, LESSONS, WORLDS } from "@/data/curriculum";

const KEY = "tiny-trace:progress:v1";

export function defaultProgress(): Progress {
  return {
    childName: "Explorer",
    xp: 60,
    streak: 2,
    lastPracticeDay: today(),
    practiceSeconds: 1420,
    lessons: {
      "stroke-horizontal": {
        lessonId: "stroke-horizontal",
        stars: 4,
        bestAccuracy: 91,
        attempts: 2,
        completedAt: daysAgo(2),
      },
      "stroke-vertical": {
        lessonId: "stroke-vertical",
        stars: 3,
        bestAccuracy: 78,
        attempts: 3,
        completedAt: daysAgo(1),
      },
    },
    badges: ["first-trail"],
    animals: ["lion", "caterpillar"],
    attempts: seedAttempts(),
    onboarded: false,
    settings: { sound: true, voiceGuide: true, reducedMotion: false, demoMode: true },
  };
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Progress;
    return { ...defaultProgress(), ...parsed, settings: { ...defaultProgress().settings, ...parsed.settings } };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: Progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable — progress simply is not persisted */
  }
}

export function resetProgress() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

/* ------------------------------- unlocking ------------------------------ */

export function completedCount(progress: Progress) {
  return Object.keys(progress.lessons).length;
}

export function completedInWorld(progress: Progress, worldId: string) {
  return LESSONS.filter((l) => l.worldId === worldId && progress.lessons[l.id]).length;
}

export function isWorldUnlocked(progress: Progress, worldId: string): boolean {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world || world.index === 1) return true;
  const previous = WORLDS.find((w) => w.index === world.index - 1);
  if (!previous) return true;
  return (
    completedInWorld(progress, previous.id) >= previous.lessonsToUnlockNext &&
    isWorldUnlocked(progress, previous.id)
  );
}

/** A lesson opens when its world is open and the previous lesson is done. */
export function isLessonUnlocked(progress: Progress, lessonId: string): boolean {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return false;
  if (!isWorldUnlocked(progress, lesson.worldId)) return false;
  if (lesson.order === 1) return true;
  const prev = LESSONS.find((l) => l.worldId === lesson.worldId && l.order === lesson.order - 1);
  if (!prev) return true;
  const previousProgress = progress.lessons[prev.id];
  return Boolean(previousProgress);
}

export function nextLessonId(progress: Progress): string {
  const next = LESSONS.find((l) => !progress.lessons[l.id] && isLessonUnlocked(progress, l.id));
  return next?.id ?? LESSONS[0]!.id;
}

export function animalsEarned(progress: Progress) {
  const done = completedCount(progress);
  return ANIMALS.filter((a) => done >= a.unlockAtLessons).map((a) => a.id);
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 150) + 1);
}

export function xpIntoLevel(xp: number) {
  return { into: xp % 150, span: 150 };
}

/* --------------------------------- utils -------------------------------- */

export function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedAttempts() {
  const base = [
    { lessonId: "stroke-horizontal", accuracy: 84, stars: 3, day: 4, seconds: 96 },
    { lessonId: "stroke-horizontal", accuracy: 91, stars: 4, day: 2, seconds: 88 },
    { lessonId: "stroke-vertical", accuracy: 66, stars: 2, day: 2, seconds: 120 },
    { lessonId: "stroke-vertical", accuracy: 71, stars: 2, day: 1, seconds: 104 },
    { lessonId: "stroke-vertical", accuracy: 78, stars: 3, day: 1, seconds: 92 },
    { lessonId: "shape-circle", accuracy: 62, stars: 2, day: 0, seconds: 133 },
  ];
  return base.map((a, i) => ({
    id: `seed-${i}`,
    lessonId: a.lessonId,
    at: daysAgo(a.day),
    accuracy: { overall: a.accuracy, shapeSimilarity: a.accuracy - 3, direction: a.accuracy + 4 },
    stars: a.stars,
    seconds: a.seconds,
  }));
}
