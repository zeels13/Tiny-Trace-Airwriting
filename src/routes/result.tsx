import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { LionMascot } from "@/components/animals/LionMascot";
import { Confetti } from "@/components/graphics/Confetti";
import { StarRating } from "@/components/progress/StarRating";
import { XPAnimation } from "@/components/progress/XPAnimation";
import { TTButton, ttButton } from "@/components/ui-tt/TTButton";
import type { AccuracyResult } from "@/lib/types";
import { lessonService } from "@/services/lessonService";
import { VOICE_LINES, voiceService } from "@/services/voiceService";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "You did it! — Tiny Trace" },
      { name: "description", content: "See how your trail went, collect your stars and head to the next one." },
      { property: "og:title", content: "You did it! — Tiny Trace" },
      { property: "og:description", content: "Stars, XP and a cheer from Rumi after every trail." },
    ],
  }),
  component: ResultScreen,
});

function ResultScreen() {
  const navigate = useNavigate();
  const { lastResult } = useAppState();

  useEffect(() => {
    if (!lastResult) navigate({ to: "/home" });
  }, [lastResult, navigate]);

  useEffect(() => {
    if (!lastResult) return;
    voiceService.cancel();
    voiceService.speak(VOICE_LINES.result(lastResult.accuracy.overall, resultPraise(lastResult.accuracy.overall)));
  }, [lastResult]);

  if (!lastResult) return null;

  const lesson = lessonService.getLesson(lastResult.lessonId);
  const good = lastResult.accuracy.overall >= 74;
  const next = lesson ? lessonService.nextInWorld(lesson) ?? lessonService.firstOfNextWorld(lesson) : undefined;
  const hasUnlock = Boolean(lastResult.unlockedWorldId || lastResult.unlockedAnimalId || lastResult.newBadges.length);

  return (
    <main className="paper relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <Confetti active={good} />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <LionMascot
          pose={good ? "celebrating" : "try-again"}
          className="mx-auto h-56 w-56 animate-pop-in sm:h-64 sm:w-64"
        />
        <h1 className="mt-2 font-display text-6xl leading-none sm:text-7xl">
          {good ? "YOU DID IT!" : "ALMOST THERE!"}
        </h1>
        <p className="mt-4 text-xl text-text-soft">
          {resultPraise(lastResult.accuracy.overall)} Your accuracy is {lastResult.accuracy.overall}%.
        </p>

        {!good && (
          <p className="mx-auto mt-3 max-w-md font-display text-sm font-extrabold uppercase tracking-[0.12em] text-coral">
            {improvementTip(lastResult.accuracy)}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-text-soft">Score</p>
            <p className="font-display text-6xl leading-none text-forest">{lastResult.accuracy.overall}%</p>
          </div>
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-text-soft">Stars</p>
            <StarRating value={lastResult.stars} animate size={34} className="mt-2 justify-center" />
          </div>
          <div>
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-text-soft">Earned</p>
            <XPAnimation value={lastResult.xpEarned} className="text-6xl leading-none text-coral" />
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {hasUnlock ? (
            <Link className={ttButton({ size: "xl" })} to="/rewards">
              SEE WHAT'S NEW
            </Link>
          ) : next ? (
            <Link className={ttButton({ size: "xl" })} to="/lesson/$lessonId" params={{ lessonId: next.id }}>
              NEXT TRAIL
            </Link>
          ) : (
            <Link className={ttButton({ size: "xl" })} to="/journey">
              BACK TO MY TRAIL
            </Link>
          )}
          <TTButton
            variant="outline"
            size="lg"
            onClick={() => navigate({ to: "/lesson/$lessonId", params: { lessonId: lastResult.lessonId } })}
          >
            TRY AGAIN
          </TTButton>
        </div>

        <Link to="/home" className="mt-8 inline-block font-display text-sm font-extrabold text-text-soft">
          Back home
        </Link>
      </div>
    </main>
  );
}

function resultPraise(accuracy: number): string {
  if (accuracy >= 95) return "Incredible tracing! You followed the trail beautifully.";
  if (accuracy >= 86) return "Fantastic work! Your lines were careful and steady.";
  if (accuracy >= 74) return "Great effort! You stayed close to the trail.";
  if (accuracy >= 60) return "Nice trying! Keep practicing those lines and you’ll get even closer.";
  return "Good try! Let’s follow the guide slowly and give it another go.";
}

/** Points at the weakest scored skill, so "try again" is actionable. */
function improvementTip(accuracy: AccuracyResult): string {
  const checks = [
    { value: accuracy.shapeSimilarity ?? 0, tip: "Stay closer to the faint guide line." },
    { value: accuracy.direction ?? 0, tip: "Follow the guide in the same direction." },
    { value: accuracy.startPoint ?? 0, tip: "Begin at the red dot." },
    { value: accuracy.strokeOrder ?? 0, tip: "Trace the strokes in Rumi's order." },
  ];
  const weakest = checks.reduce((lowest, check) => (check.value < lowest.value ? check : lowest));
  return weakest.value >= 70 ? "So close — slow down and follow the ghost line." : weakest.tip;
}
