import { createFileRoute } from "@tanstack/react-router";

import { AnimalCollection } from "@/components/rewards/AnimalCollection";
import { ChildTopBar } from "@/components/navigation/ChildTopBar";
import { LionMascot } from "@/components/animals/LionMascot";
import { RewardCard } from "@/components/rewards/RewardCard";
import { StarRating } from "@/components/progress/StarRating";
import { XPBar } from "@/components/progress/XPAnimation";
import { ACHIEVEMENTS } from "@/data/curriculum";
import { levelFromXp, xpIntoLevel } from "@/services/progressService";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Jungle Friends — Tiny Trace" },
      { name: "description", content: "Every animal friend you've met, plus your badges, stars and level." },
      { property: "og:title", content: "My Jungle Friends — Tiny Trace" },
      { property: "og:description", content: "Collect a new jungle friend for every few trails you finish." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { progress } = useAppState();
  const { into, span } = xpIntoLevel(progress.xp);
  const totalStars = Object.values(progress.lessons).reduce((sum, l) => sum + l.stars, 0);

  return (
    <main className="paper min-h-screen pb-20">
      <ChildTopBar />

      <section className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-8 px-6 sm:px-10">
        <LionMascot pose="welcome" className="h-40 w-40" />
        <div className="min-w-[240px] flex-1">
          <h1 className="font-display text-5xl leading-none">{progress.childName}</h1>
          <p className="mt-2 text-lg text-text-soft">
            Level {levelFromXp(progress.xp)} tracer · {Object.keys(progress.lessons).length} trails finished
          </p>
          <XPBar into={into} span={span} className="mt-5 max-w-sm" />
          <div className="mt-5 flex items-center gap-3">
            <StarRating value={Math.min(5, Math.round(totalStars / 5))} />
            <span className="font-display text-sm font-extrabold text-text-soft">{totalStars} stars collected</span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pt-14 sm:px-10">
        <h2 className="font-display text-3xl">My jungle friends</h2>
        <AnimalCollection owned={progress.animals} className="mt-8" />
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pt-16 sm:px-10">
        <h2 className="font-display text-3xl">Badges</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => (
            <li key={achievement.id}>
              <RewardCard achievement={achievement} earned={progress.badges.includes(achievement.id)} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
