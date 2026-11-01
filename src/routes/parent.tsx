import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Clock, GraduationCap, Target } from "lucide-react";

import { AccuracyTrendChart, PracticeMinutesChart } from "@/components/dashboard/ProgressChart";
import { ParentMetricCard } from "@/components/dashboard/ParentMetricCard";
import { TraceMark } from "@/components/branding/TinyTraceLogo";
import { WORLDS } from "@/data/curriculum";
import { analyticsService } from "@/services/analyticsService";
import { useAppState } from "@/state/app-state";
import { lessonService } from "@/services/lessonService";

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — Tiny Trace" },
      {
        name: "description",
        content:
          "Accuracy trends, practice time, characters learned and weak areas for your child's air-writing practice.",
      },
      { property: "og:title", content: "Parent Dashboard — Tiny Trace" },
      { property: "og:description", content: "Track handwriting progress across strokes, shapes, numbers and letters." },
    ],
  }),
  component: ParentDashboard,
});

function ParentDashboard() {
  const { progress, helpers } = useAppState();
  const characters = analyticsService.charactersLearned(progress);
  const weak = analyticsService.weakAreas(progress);
  const recent = analyticsService.recentAttempts(progress);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <TraceMark className="h-8 w-8" />
            <div>
              <p className="font-display text-lg font-extrabold leading-none text-forest-deep">
                Tiny Trace · Parent view
              </p>
              <p className="text-sm text-muted-foreground">
                {progress.childName} · streak {progress.streak} day{progress.streak === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm font-bold">
            <Link to="/settings" className="text-muted-foreground hover:text-forest-deep">
              Settings
            </Link>
            <Link to="/home" className="text-forest hover:underline">
              Back to child mode
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
        <h1 className="font-display text-3xl font-extrabold">Progress overview</h1>
        <p className="mt-1 text-muted-foreground">
          Figures are calculated locally from this device's practice history.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ParentMetricCard
            label="Overall accuracy"
            value={`${analyticsService.overallAccuracy(progress)}%`}
            sub="Mean across all attempts"
            tone="good"
            icon={<Target className="h-4 w-4" />}
          />
          <ParentMetricCard
            label="Practice time"
            value={analyticsService.practiceTime(progress)}
            sub="Total tracing time"
            icon={<Clock className="h-4 w-4" />}
          />
          <ParentMetricCard
            label="Characters learned"
            value={`${characters.learned} / ${characters.total}`}
            sub="Strokes, shapes, numbers, letters, words"
            icon={<GraduationCap className="h-4 w-4" />}
          />
          <ParentMetricCard
            label="Completion"
            value={`${analyticsService.completion(progress)}%`}
            sub="Of the full curriculum"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-extrabold">Daily accuracy</h2>
            <p className="mb-4 text-sm text-muted-foreground">Last 7 days</p>
            <AccuracyTrendChart data={analyticsService.dailyAccuracy(progress)} />
          </section>
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-extrabold">Weekly practice</h2>
            <p className="mb-4 text-sm text-muted-foreground">Minutes traced per week</p>
            <PracticeMinutesChart data={analyticsService.weeklyAccuracy(progress)} />
          </section>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-extrabold">Areas to revisit</h2>
            <p className="mb-4 text-sm text-muted-foreground">Below 80% average accuracy</p>
            {weak.length ? (
              <ul className="space-y-3">
                {weak.map((item) => (
                  <li key={item.lessonId} className="flex items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-muted font-display text-lg font-extrabold uppercase">
                      {item.label.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{item.title}</p>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-coral" style={{ width: `${item.accuracy}%` }} />
                      </div>
                    </div>
                    <span className="font-display font-extrabold text-coral">{item.accuracy}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No weak areas yet — every attempt so far is above 80%.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-extrabold">Recent attempts</h2>
            <p className="mb-4 text-sm text-muted-foreground">Most recent first</p>
            {recent.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-bold">Trail</th>
                    <th className="pb-2 font-bold">Date</th>
                    <th className="pb-2 text-right font-bold">Accuracy</th>
                    <th className="pb-2 text-right font-bold">Stars</th>
                    <th className="pb-2 text-right font-bold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 font-bold">{attempt.title}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(attempt.at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-right font-bold">{attempt.accuracy.overall}%</td>
                      <td className="py-2.5 text-right text-muted-foreground">{attempt.stars}/5</td>
                      <td className="py-2.5 text-right text-muted-foreground">{attempt.seconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No practice recorded yet.</p>
            )}
          </section>
        </div>

        <section className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-extrabold">Curriculum completion</h2>
          <ul className="mt-4 space-y-4">
            {WORLDS.map((world) => {
              const total = lessonService.listLessons(world.id).length;
              const done = helpers.completedInWorld(world.id);
              return (
                <li key={world.id} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 text-sm font-bold">{world.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${Math.round((done / total) * 100)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm text-muted-foreground">
                    {done}/{total}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          Scores are produced by on-device geometric comparison between the
          traced path and the reference stroke (shape deviation, direction,
          start and end position, smoothness). Hand tracking runs on-device in
          the browser, and a simulated fingertip demo is always available.
        </p>
      </div>
    </main>
  );
}
