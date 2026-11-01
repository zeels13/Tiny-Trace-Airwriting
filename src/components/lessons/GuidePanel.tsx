import { LionMascot } from "@/components/animals/LionMascot";
import { GhostGuide } from "@/components/graphics/GhostGuide";
import { StrokeAnimator } from "@/components/graphics/StrokeAnimator";
import type { Lesson } from "@/lib/types";

/**
 * Left-hand guide: shows what to draw, where to start and in which order.
 * Toggles between the animated demonstration and the ghost reference.
 */
export function GuidePanel({
  lesson,
  mode,
  activeStroke,
  completedStrokes,
}: {
  lesson: Lesson;
  mode: "demo" | "trace";
  activeStroke: number;
  completedStrokes: number;
}) {
  const stroke = lesson.template.strokes[activeStroke];
  const totalStrokes = lesson.template.strokes.length;

  return (
    <section className="flex h-full flex-col gap-4" aria-label="Trail guide">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl">{mode === "demo" ? "Watch me first" : "Follow the trail"}</h2>
        <p className="font-display text-sm font-extrabold text-text-soft">
          Stroke {Math.min(activeStroke + 1, totalStrokes)} of {totalStrokes}
        </p>
      </div>

      <div className="relative aspect-square w-full max-w-[460px] self-center rounded-3xl bg-card p-4">
        {/* faint guide rules — a writing line, not a card border */}
        <svg viewBox="0 0 100 100" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]" aria-hidden="true">
          <line x1="0" y1="14" x2="100" y2="14" stroke="var(--tt-cream-deep)" strokeWidth="1.2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="var(--tt-cream-deep)" strokeWidth="1.2" strokeDasharray="3 4" />
          <line x1="0" y1="86" x2="100" y2="86" stroke="var(--tt-cream-deep)" strokeWidth="1.2" />
        </svg>
        <div className="absolute inset-4">
          {mode === "demo" ? (
            <StrokeAnimator template={lesson.template} />
          ) : (
            <GhostGuide
              template={lesson.template}
              activeStroke={activeStroke}
              completed={completedStrokes}
            />
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 px-1">
        <LionMascot pose={mode === "demo" ? "teaching" : "pointing"} className="h-20 w-20 shrink-0" />
        <p className="pt-3 font-display text-lg leading-snug text-forest-deep">
          {mode === "demo" ? lesson.hint : (stroke?.direction ?? "Start at the red dot and follow the trail.")}
        </p>
      </div>
    </section>
  );
}
