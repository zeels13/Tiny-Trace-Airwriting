import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AnimalCharacter } from "@/components/animals/AnimalCharacter";
import { LionMascot } from "@/components/animals/LionMascot";
import { Confetti } from "@/components/graphics/Confetti";
import { RewardCard } from "@/components/rewards/RewardCard";
import { ttButton } from "@/components/ui-tt/TTButton";
import { ACHIEVEMENTS, ANIMALS, getWorld } from "@/data/curriculum";
import { lessonService } from "@/services/lessonService";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "New Trail Unlocked — Tiny Trace" },
      { name: "description", content: "Celebrate a new badge, a new jungle friend or a whole new world." },
      { property: "og:title", content: "New Trail Unlocked — Tiny Trace" },
      { property: "og:description", content: "Something exciting just opened up on your trail." },
    ],
  }),
  component: RewardsScreen,
});

function RewardsScreen() {
  const navigate = useNavigate();
  const { lastResult } = useAppState();

  useEffect(() => {
    if (!lastResult) navigate({ to: "/home" });
  }, [lastResult, navigate]);

  if (!lastResult) return null;

  const world = lastResult.unlockedWorldId ? getWorld(lastResult.unlockedWorldId) : undefined;
  const animal = ANIMALS.find((a) => a.id === lastResult.unlockedAnimalId);
  const badges = ACHIEVEMENTS.filter((a) => lastResult.newBadges.includes(a.id));
  const lesson = lessonService.getLesson(lastResult.lessonId);
  const next = lesson ? lessonService.nextInWorld(lesson) ?? lessonService.firstOfNextWorld(lesson) : undefined;

  return (
    <main className="paper relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-14">
      <Confetti active />
      <div className="relative z-10 w-full max-w-2xl text-center">
        <p className="font-display text-sm font-extrabold uppercase tracking-[0.28em] text-coral">
          New trail unlocked
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">
          {world ? world.name.toUpperCase() : animal ? `MEET ${animal.name.toUpperCase()}` : "GREAT WORK!"}
        </h1>

        <div className="mt-8 flex items-center justify-center gap-6">
          {world ? (
            <AnimalCharacter id={world.guide} className="h-40 w-40 animate-pop-in" />
          ) : animal ? (
            <AnimalCharacter id={animal.id} className="h-40 w-40 animate-pop-in" />
          ) : (
            <LionMascot pose="celebrating" className="h-44 w-44" />
          )}
        </div>

        <p className="mx-auto mt-6 max-w-md text-lg text-text-soft">
          {world
            ? `${world.tagline}. Your guide is waiting at the start of the trail.`
            : animal
              ? `${animal.name} joined your jungle friends — ${animal.role.toLowerCase()}.`
              : "Your trail is getting longer every day."}
        </p>

        {badges.length > 0 && (
          <ul className="mx-auto mt-10 grid max-w-md gap-5 text-left">
            {badges.map((badge) => (
              <li key={badge.id}>
                <RewardCard achievement={badge} earned />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {world ? (
            <Link className={ttButton({ size: "xl" })} to="/world/$worldId" params={{ worldId: world.id }}>
              EXPLORE
            </Link>
          ) : next ? (
            <Link className={ttButton({ size: "xl" })} to="/lesson/$lessonId" params={{ lessonId: next.id }}>
              NEXT TRAIL
            </Link>
          ) : (
            <Link className={ttButton({ size: "xl" })} to="/journey">
              SEE MY TRAIL
            </Link>
          )}
          <Link className={ttButton({ variant: "outline", size: "lg" })} to="/profile">
            MY FRIENDS
          </Link>
        </div>
      </div>
    </main>
  );
}
