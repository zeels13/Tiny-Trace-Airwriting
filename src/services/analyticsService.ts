/**
 * analyticsService — derives parent-dashboard metrics from local progress.
 * Replace the internals with backend aggregates later; the shapes stay.
 */

import { LESSONS, getLesson } from "@/data/curriculum";
import type { Progress } from "@/lib/types";

export interface DailyPoint {
  label: string;
  accuracy: number;
  minutes: number;
}

export const analyticsService = {
  overallAccuracy(progress: Progress) {
    const values = progress.attempts.map((a) => a.accuracy.overall);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  },

  practiceTime(progress: Progress) {
    const total = progress.practiceSeconds;
    const h = Math.floor(total / 3600);
    const m = Math.round((total % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
  },

  charactersLearned(progress: Progress) {
    return { learned: Object.keys(progress.lessons).length, total: LESSONS.length };
  },

  completion(progress: Progress) {
    return Math.round((Object.keys(progress.lessons).length / LESSONS.length) * 100);
  },

  dailyAccuracy(progress: Progress): DailyPoint[] {
    const days = 7;
    const out: DailyPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const attempts = progress.attempts.filter((a) => a.at.slice(0, 10) === key);
      const accuracy = attempts.length
        ? Math.round(attempts.reduce((s, a) => s + a.accuracy.overall, 0) / attempts.length)
        : 0;
      const minutes = Math.round(attempts.reduce((s, a) => s + a.seconds, 0) / 60);
      out.push({ label: date.toLocaleDateString(undefined, { weekday: "short" }), accuracy, minutes });
    }
    return out;
  },

  weeklyAccuracy(progress: Progress): DailyPoint[] {
    const weeks = 4;
    const out: DailyPoint[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const attempts = progress.attempts.filter((a) => {
        const at = new Date(a.at);
        return at >= start && at < end;
      });
      out.push({
        label: i === 0 ? "This week" : `${i + 1}w ago`,
        accuracy: attempts.length
          ? Math.round(attempts.reduce((s, a) => s + a.accuracy.overall, 0) / attempts.length)
          : 0,
        minutes: Math.round(attempts.reduce((s, a) => s + a.seconds, 0) / 60),
      });
    }
    return out;
  },

  weakAreas(progress: Progress) {
    const byLesson = new Map<string, number[]>();
    progress.attempts.forEach((a) => {
      const list = byLesson.get(a.lessonId) ?? [];
      list.push(a.accuracy.overall);
      byLesson.set(a.lessonId, list);
    });
    return [...byLesson.entries()]
      .map(([lessonId, values]) => ({
        lessonId,
        label: getLesson(lessonId)?.template.character ?? lessonId,
        title: getLesson(lessonId)?.title ?? lessonId,
        accuracy: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      }))
      .filter((r) => r.accuracy < 80)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
  },

  recentAttempts(progress: Progress, limit = 6) {
    return [...progress.attempts]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, limit)
      .map((a) => ({ ...a, title: getLesson(a.lessonId)?.title ?? a.lessonId }));
  },
};
