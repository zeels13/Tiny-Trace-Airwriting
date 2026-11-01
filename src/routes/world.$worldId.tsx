import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";

import { AnimalCharacter } from "@/components/animals/AnimalCharacter";
import { ChildTopBar } from "@/components/navigation/ChildTopBar";
import { GhostGuide } from "@/components/graphics/GhostGuide";
import { StarRating } from "@/components/progress/StarRating";
import { ttButton } from "@/components/ui-tt/TTButton";
import { lessonService } from "@/services/lessonService";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/world/$worldId")({
  loader: ({ params }) => {
    const world = lessonService.getWorld(params.worldId);
    if (!world) throw notFound();
    return { world };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "World unavailable — Tiny Trace" }, { name: "robots", content: "noindex" }] };
    }
    const { world } = loaderData;
    return {
      meta: [
        { title: `${world.name} — Tiny Trace` },
        { name: "description", content: `${world.name}: ${world.tagline}. Pick a trail and start tracing.` },
        { property: "og:title", content: `${world.name} — Tiny Trace` },
        { property: "og:description", content: world.tagline },
      ],
    };
  },
  component: WorldScreen,
});

function WorldScreen() {
  const { world } = Route.useLoaderData();
  const { progress, helpers } = useAppState();
  const lessons = lessonService.listLessons(world.id);
  const nextInWorld = lessons.find((l) => !progress.lessons[l.id] && helpers.isLessonUnlocked(l.id));

  return (
    <main className="paper min-h-screen pb-20">
      <ChildTopBar />

      <section className={cn("mx-auto w-full max-w-6xl rounded-4xl px-6 py-10 sm:px-10", world.theme.surface)}>
        <div className="flex flex-wrap items-center gap-8">
          <AnimalCharacter id={world.guide} className="h-28 w-28 animate-sway" />
          <div className="min-w-[240px] flex-1">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-text-soft">
              World {world.index}
            </p>
            <h1 className="font-display text-5xl leading-none">{world.name}</h1>
            <p className="mt-3 text-lg text-text-soft">{world.tagline}</p>
          </div>
          {nextInWorld ? (
            <Link className={ttButton({ size: "lg" })} to="/lesson/$lessonId" params={{ lessonId: nextInWorld.id }}>
              {progress.lessons[lessons[0]!.id] ? "KEEP GOING" : "START"}
            </Link>
          ) : (
            <Link className={ttButton({ variant: "sun", size: "lg" })} to="/journey">
              WORLD COMPLETE
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pt-10 sm:px-10">
        <h2 className="font-display text-2xl">Trails here</h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => {
            const record = progress.lessons[lesson.id];
            const unlocked = helpers.isLessonUnlocked(lesson.id);
            const content = (
              <div
                className={cn(
                  "flex h-full items-center gap-4 rounded-2xl bg-card p-4 transition-transform",
                  unlocked ? "hover:-translate-y-1" : "opacity-60",
                )}
              >
                <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-cream">
                  <GhostGuide
                    template={lesson.template}
                    showStartMarker={false}
                    opacity={unlocked ? 1 : 0.4}
                    className="p-2"
                  />
                  {!unlocked && (
                    <span className="absolute grid h-9 w-9 place-items-center rounded-full bg-bark text-primary-foreground">
                      <Lock className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-text-soft">
                    Trail {lesson.order}
                  </p>
                  <p className="truncate font-display text-xl leading-tight">{lesson.title}</p>
                  {record ? (
                    <div className="mt-2 flex items-center gap-2">
                      <StarRating value={record.stars} size={18} />
                      <span className="font-display text-sm font-extrabold text-forest">
                        <Check className="mr-0.5 inline h-4 w-4" aria-hidden="true" />
                        {record.bestAccuracy}%
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 truncate text-sm text-text-soft">
                      {unlocked ? lesson.hint : "Finish the trail before this one"}
                    </p>
                  )}
                </div>
              </div>
            );

            return (
              <li key={lesson.id}>
                {unlocked ? (
                  <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} className="block h-full">
                    {content}
                  </Link>
                ) : (
                  <div aria-disabled="true">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
