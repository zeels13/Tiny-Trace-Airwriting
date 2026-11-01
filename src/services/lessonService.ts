/**
 * lessonService — content access. Mock/local today, HTTP later.
 */

import { LESSONS, WORLDS, getLesson, getWorld, lessonsForWorld } from "@/data/curriculum";
import type { Lesson, World } from "@/lib/types";

export const lessonService = {
  listWorlds(): World[] {
    return WORLDS;
  },
  listLessons(worldId?: string): Lesson[] {
    return worldId ? lessonsForWorld(worldId as World["id"]) : LESSONS;
  },
  getLesson,
  getWorld,
  nextInWorld(lesson: Lesson): Lesson | undefined {
    return lessonsForWorld(lesson.worldId).find((l) => l.order === lesson.order + 1);
  },
  firstOfNextWorld(lesson: Lesson): Lesson | undefined {
    const world = getWorld(lesson.worldId);
    if (!world) return undefined;
    const next = WORLDS.find((w) => w.index === world.index + 1);
    return next ? lessonsForWorld(next.id)[0] : undefined;
  },
};
