import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { LionMascot } from "@/components/animals/LionMascot";
import type { Lesson, World } from "@/lib/types";

export function LessonHeader({
  lesson,
  world,
  step,
  total,
}: {
  lesson: Lesson;
  world: World;
  step: number;
  total: number;
}) {
  return (
    <header className="flex items-center gap-4 border-b border-border/70 px-5 py-3 sm:px-8">
      <Link
        to="/world/$worldId"
        params={{ worldId: world.id }}
        aria-label={`Back to ${world.name}`}
        className="grid h-11 w-11 place-items-center rounded-xl text-text-soft transition-colors hover:bg-cream-deep hover:text-forest-deep"
      >
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </Link>

      <div className="min-w-0">
        <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-text-soft">
          {world.name}
        </p>
        <h1 className="truncate font-display text-2xl leading-tight">{lesson.title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden items-center gap-1.5 sm:flex" aria-label={`Step ${step} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={
                i < step
                  ? "h-2.5 w-8 rounded-full bg-forest"
                  : "h-2.5 w-8 rounded-full bg-cream-deep"
              }
            />
          ))}
        </div>
        <LionMascot pose="encouraging" idle={false} className="h-12 w-12" />
      </div>
    </header>
  );
}
