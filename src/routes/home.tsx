import { createFileRoute, Link } from "@tanstack/react-router";

import { AnimalCharacter } from "@/components/animals/AnimalCharacter";
import { LionMascot } from "@/components/animals/LionMascot";
import { ChildTopBar } from "@/components/navigation/ChildTopBar";
import { XPBar } from "@/components/progress/XPAnimation";
import { RewardCard } from "@/components/rewards/RewardCard";
import { ttButton } from "@/components/ui-tt/TTButton";
import { ACHIEVEMENTS, WORLDS, getLesson, getWorld } from "@/data/curriculum";
import { xpIntoLevel } from "@/services/progressService";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Your Jungle — Tiny Trace" },
      {
        name: "description",
        content: "Pick up your next trail, check your streak and see which jungle friends you've met.",
      },
      { property: "og:title", content: "Your Jungle — Tiny Trace" },
      { property: "og:description", content: "Continue your air-writing adventure with Rumi the lion cub." },
    ],
  }),
  component: Home,
});

function Home() {
  const { progress, helpers } = useAppState();
  const nextLesson = getLesson(helpers.nextLessonId);
  const nextWorld = nextLesson ? getWorld(nextLesson.worldId) : undefined;
  const { into, span } = xpIntoLevel(progress.xp);
  const latestBadge = [...progress.badges].reverse()[0];
  const achievement = ACHIEVEMENTS.find((a) => a.id === latestBadge);

  return (
    <main className="paper min-h-screen pb-16">
      <ChildTopBar />

      {/* Hero: one obvious action */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 pb-6 pt-2 sm:grid-cols-[1.1fr_0.9fr] sm:px-10">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-text-soft">
            Hi {progress.childName}
          </p>
          <h1 className="mt-2 max-w-md font-display text-5xl leading-[1.05] sm:text-6xl">
            Ready for your next trail?
          </h1>
          {nextLesson && nextWorld && (
            <p className="mt-4 text-lg text-text-soft">
              Up next: <span className="font-bold text-forest-deep">{nextLesson.title}</span> in {nextWorld.name}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {nextLesson ? (
              <Link className={ttButton({ size: "xl" })} to="/lesson/$lessonId" params={{ lessonId: nextLesson.id }}>
                CONTINUE
              </Link>
            ) : (
              <Link className={ttButton({ size: "xl" })} to="/journey">
                SEE MY JOURNEY
              </Link>
            )}
            <Link
              to="/journey"
              className="font-display text-lg font-extrabold text-forest-deep underline decoration-yellow decoration-4 underline-offset-4"
            >
              Journey map
            </Link>
          </div>

          <div className="mt-10 max-w-sm">
            <div className="flex items-baseline justify-between font-display text-sm font-extrabold text-text-soft">
              <span>Level progress</span>
              <span>
                {into}/{span} XP
              </span>
            </div>
            <XPBar into={into} span={span} className="mt-2" />
          </div>
        </div>

        <div className="relative flex justify-center">
          <LionMascot pose="encouraging" className="h-64 w-64 sm:h-80 sm:w-80" />
          <p className="absolute -top-2 right-0 max-w-[190px] rounded-3xl bg-card px-5 py-3 font-display text-base leading-snug text-forest-deep">
            Follow my trail — I'll be right beside you!
          </p>
        </div>
      </section>

      {/* Journey strip — no cards, just the trail */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-10 sm:px-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl">Your Tiny Journey</h2>
          <Link to="/journey" className="font-display text-sm font-extrabold text-forest">
            See the whole map
          </Link>
        </div>

        <ol className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {WORLDS.map((world) => {
            const unlocked = helpers.isWorldUnlocked(world.id);
            const done = helpers.completedInWorld(world.id);
            return (
              <li key={world.id} className="min-w-[210px] flex-1">
                <Link
                  to={unlocked ? "/world/$worldId" : "/journey"}
                  params={{ worldId: world.id }}
                  className={cn(
                    "flex h-full flex-col gap-3 rounded-3xl px-5 py-5 transition-transform hover:-translate-y-1",
                    world.theme.surface,
                    !unlocked && "opacity-55 saturate-50",
                  )}
                >
                  <AnimalCharacter id={world.guide} silhouette={!unlocked} className="h-14 w-14" />
                  <div>
                    <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-text-soft">
                      World {world.index}
                    </p>
                    <p className="font-display text-xl leading-tight">{world.name}</p>
                  </div>
                  <p className="mt-auto font-display text-sm font-extrabold text-text-soft">
                    {unlocked ? `${done} trails done` : "Locked for now"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Streak + achievement + friends */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pt-12 sm:grid-cols-3 sm:px-10">
        <div>
          <h2 className="font-display text-2xl">Your streak</h2>
          <p className="mt-2 font-display text-6xl text-coral">{progress.streak}</p>
          <p className="text-text-soft">
            day{progress.streak === 1 ? "" : "s"} of tracing in a row. Keep it going!
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Newest badge</h2>
          {achievement ? (
            <RewardCard achievement={achievement} earned className="mt-4" />
          ) : (
            <p className="mt-4 text-text-soft">Finish a trail to earn your first badge.</p>
          )}
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Jungle friends</h2>
            <Link to="/profile" className="font-display text-sm font-extrabold text-forest">
              All friends
            </Link>
          </div>
          <ul className="mt-4 flex gap-2">
            {progress.animals.slice(0, 4).map((id) => (
              <li key={id} className="grid h-16 w-16 place-items-center rounded-2xl bg-card">
                <AnimalCharacter id={id} className="h-12 w-12" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto mt-14 w-full max-w-6xl px-6 sm:px-10">
        <Link
          to="/parent"
          className="font-display text-sm font-extrabold text-text-soft underline decoration-border decoration-2 underline-offset-4 hover:text-forest-deep"
        >
          Grown-ups: open the parent dashboard
        </Link>
      </div>
    </main>
  );
}
