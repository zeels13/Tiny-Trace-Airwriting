import { Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";

import { AnimalCharacter } from "@/components/animals/AnimalCharacter";
import { WORLDS } from "@/data/curriculum";
import { lessonService } from "@/services/lessonService";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

/**
 * The journey: a gently winding trail of world nodes. The trail itself is the
 * brand motif — a dashed trace line with footprints between worlds.
 */
export function JourneyMap({ compact = false }: { compact?: boolean | undefined }) {
  const { helpers } = useAppState();

  return (
    <ol className={cn("relative mx-auto w-full max-w-3xl", compact ? "space-y-6" : "space-y-10")}>
      {WORLDS.map((world, i) => {
        const unlocked = helpers.isWorldUnlocked(world.id);
        const lessons = lessonService.listLessons(world.id);
        const done = helpers.completedInWorld(world.id);
        const isCurrent = unlocked && done < lessons.length;
        const offset = i % 2 === 0 ? "sm:ml-0 sm:mr-24" : "sm:ml-24 sm:mr-0";

        return (
          <li key={world.id} className={cn("relative", offset)}>
            {i < WORLDS.length - 1 && <TrailSegment flip={i % 2 === 1} />}
            <JourneyNode
              worldId={world.id}
              index={world.index}
              name={world.name}
              tagline={world.tagline}
              guide={world.guide}
              surface={world.theme.surface}
              total={lessons.length}
              done={done}
              unlocked={unlocked}
              current={isCurrent}
              needed={
                i > 0
                  ? `${WORLDS[i - 1]!.lessonsToUnlockNext} trails in ${WORLDS[i - 1]!.name}`
                  : undefined
              }
            />
          </li>
        );
      })}
    </ol>
  );
}

function TrailSegment({ flip }: { flip: boolean }) {
  return (
    <svg
      viewBox="0 0 120 110"
      preserveAspectRatio="none"
      className={cn("absolute -bottom-12 left-1/2 hidden h-14 w-40 -translate-x-1/2 sm:block", flip && "scale-x-[-1]")}
      aria-hidden="true"
    >
      <path
        d="M20 0 C 60 40, 20 70, 100 108"
        fill="none"
        stroke="var(--tt-forest)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 14"
        opacity="0.5"
      />
    </svg>
  );
}

export function JourneyNode({
  worldId,
  index,
  name,
  tagline,
  guide,
  surface,
  total,
  done,
  unlocked,
  current,
  needed,
}: {
  worldId: string;
  index: number;
  name: string;
  tagline: string;
  guide: Parameters<typeof AnimalCharacter>[0]["id"];
  surface: string;
  total: number;
  done: number;
  unlocked: boolean;
  current: boolean;
  needed?: string | undefined;
}) {
  const complete = done >= total;
  const body = (
    <div
      className={cn(
        "flex items-center gap-5 rounded-3xl px-6 py-5 transition-transform duration-[var(--tt-dur-mid)]",
        surface,
        current && "scale-[1.03] shadow-[0_10px_0_-2px_var(--tt-forest)]",
        !unlocked && "opacity-60 saturate-50",
        unlocked && "hover:-translate-y-1",
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            "grid place-items-center rounded-full bg-card",
            current ? "h-24 w-24" : "h-16 w-16",
          )}
        >
          <AnimalCharacter id={guide} silhouette={!unlocked} className={current ? "h-16 w-16" : "h-11 w-11"} />
        </div>
        {complete && (
          <span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-forest text-primary-foreground">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        {!unlocked && (
          <span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-bark text-primary-foreground">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-text-soft">
          World {index}
        </p>
        <h3 className={cn("truncate font-display", current ? "text-3xl" : "text-2xl")}>{name}</h3>
        <p className="mt-0.5 truncate text-sm text-text-soft">
          {unlocked ? tagline : `Opens after ${needed ?? "more practice"}`}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 w-32 overflow-hidden rounded-full bg-card/70">
            <div
              className="h-full rounded-full bg-forest"
              style={{ width: `${Math.max(4, (done / total) * 100)}%` }}
            />
          </div>
          <span className="font-display text-sm font-extrabold text-text-soft">
            {done}/{total}
          </span>
        </div>
      </div>
    </div>
  );

  if (!unlocked) {
    return (
      <div aria-disabled="true" title={`Opens after ${needed ?? "more practice"}`}>
        {body}
      </div>
    );
  }

  return (
    <Link to="/world/$worldId" params={{ worldId }} className="block focus-visible:outline-none">
      {body}
    </Link>
  );
}
