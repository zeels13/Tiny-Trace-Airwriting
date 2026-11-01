import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AccuracyResult, Progress, Settings } from "@/lib/types";
import { starsFor } from "@/lib/geometry";
import { getLesson, ACHIEVEMENTS } from "@/data/curriculum";
import {
  animalsEarned,
  completedCount,
  completedInWorld,
  defaultProgress,
  isLessonUnlocked,
  isWorldUnlocked,
  loadProgress,
  nextLessonId,
  resetProgress,
  saveProgress,
  today,
} from "@/services/progressService";
import { voiceService } from "@/services/voiceService";

export interface LastResult {
  lessonId: string;
  accuracy: AccuracyResult;
  stars: number;
  xpEarned: number;
  newBadges: string[];
  unlockedLessonId?: string | undefined;
  unlockedWorldId?: string | undefined;
  unlockedAnimalId?: string | undefined;
}

interface AppStateValue {
  progress: Progress;
  hydrated: boolean;
  lastResult: LastResult | null;
  completeLesson: (lessonId: string, accuracy: AccuracyResult, seconds: number) => LastResult;
  updateSettings: (patch: Partial<Settings>) => void;
  setChildName: (name: string) => void;
  finishOnboarding: () => void;
  restart: () => void;
  helpers: {
    completedCount: number;
    nextLessonId: string;
    isLessonUnlocked: (id: string) => boolean;
    isWorldUnlocked: (id: string) => boolean;
    completedInWorld: (id: string) => number;
  };
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start from defaults, hydrate from storage after mount.
  const [progress, setProgress] = useState<Progress>(() => defaultProgress());
  const [hydrated, setHydrated] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProgress(progress);
  }, [progress, hydrated]);

  useEffect(() => {
    voiceService.configure({ enabled: progress.settings.voiceGuide });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("tt-reduced-motion", progress.settings.reducedMotion);
    }
  }, [progress.settings.voiceGuide, progress.settings.reducedMotion]);

  const completeLesson = useCallback(
    (lessonId: string, accuracy: AccuracyResult, seconds: number): LastResult => {
      const lesson = getLesson(lessonId);
      const stars = starsFor(accuracy.overall);
      const xpEarned = lesson ? Math.round(lesson.xpReward * (0.6 + stars * 0.1)) : 20;

      let result: LastResult = {
        lessonId,
        accuracy,
        stars,
        xpEarned,
        newBadges: [],
      };

      setProgress((prev) => {
        const previousEntry = prev.lessons[lessonId];
        const wasNew = !previousEntry;
        const lessons = {
          ...prev.lessons,
          [lessonId]: {
            lessonId,
            stars: Math.max(stars, previousEntry?.stars ?? 0),
            bestAccuracy: Math.max(accuracy.overall, previousEntry?.bestAccuracy ?? 0),
            attempts: (previousEntry?.attempts ?? 0) + 1,
            completedAt: previousEntry?.completedAt ?? new Date().toISOString(),
          },
        };

        const day = today();
        const streak =
          prev.lastPracticeDay === day
            ? prev.streak
            : prev.lastPracticeDay === yesterday()
              ? prev.streak + 1
              : 1;

        const next: Progress = {
          ...prev,
          xp: prev.xp + xpEarned,
          streak,
          lastPracticeDay: day,
          practiceSeconds: prev.practiceSeconds + seconds,
          lessons,
          attempts: [
            ...prev.attempts,
            {
              id: `a-${Date.now()}`,
              lessonId,
              at: new Date().toISOString(),
              accuracy,
              stars,
              seconds,
            },
          ],
        };

        const done = completedCount(next);
        const badges = new Set(next.badges);
        if (done >= 1) badges.add("first-trail");
        if (done >= 5) badges.add("five-trails");
        if (accuracy.overall >= 95) badges.add("perfect-stroke");
        if (streak >= 3) badges.add("streak-3");
        if (completedInWorld(next, "stroke-forest") >= 5) badges.add("forest-clear");
        if (lesson?.kind === "number") badges.add("river-start");
        const newBadges = [...badges].filter((b) => !prev.badges.includes(b));
        next.badges = [...badges];

        const animals = animalsEarned(next);
        const newAnimal = animals.find((a) => !prev.animals.includes(a));
        next.animals = animals;

        const unlockedLessonId = wasNew ? nextLessonId(next) : undefined;
        const newlyUnlockedWorld = ["shape-valley", "number-river", "alphabet-jungle", "word-safari"].find(
          (w) => isWorldUnlocked(next, w) && !isWorldUnlocked(prev, w),
        );

        result = {
          lessonId,
          accuracy,
          stars,
          xpEarned,
          newBadges: newBadges
            .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.id)
            .filter((v): v is string => Boolean(v)),
          unlockedLessonId,
          unlockedWorldId: newlyUnlockedWorld,
          unlockedAnimalId: newAnimal,
        };
        return next;
      });

      setLastResult(result);
      return result;
    },
    [],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setProgress((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const setChildName = useCallback((childName: string) => {
    setProgress((prev) => ({ ...prev, childName: childName.trim() || "Explorer" }));
  }, []);

  const finishOnboarding = useCallback(() => {
    setProgress((prev) => ({ ...prev, onboarded: true }));
  }, []);

  const restart = useCallback(() => {
    resetProgress();
    setProgress(defaultProgress());
    setLastResult(null);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      progress,
      hydrated,
      lastResult,
      completeLesson,
      updateSettings,
      setChildName,
      finishOnboarding,
      restart,
      helpers: {
        completedCount: completedCount(progress),
        nextLessonId: nextLessonId(progress),
        isLessonUnlocked: (id: string) => isLessonUnlocked(progress, id),
        isWorldUnlocked: (id: string) => isWorldUnlocked(progress, id),
        completedInWorld: (id: string) => completedInWorld(progress, id),
      },
    }),
    [progress, hydrated, lastResult, completeLesson, updateSettings, setChildName, finishOnboarding, restart],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
