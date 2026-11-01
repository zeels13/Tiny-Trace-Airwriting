import { Flame, Leaf, PawPrint, Star, Sun, Waves } from "lucide-react";

import type { Achievement } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOTIFS = {
  leaf: Leaf,
  star: Star,
  flame: Flame,
  paw: PawPrint,
  river: Waves,
  sun: Sun,
};

export function RewardCard({
  achievement,
  earned,
  className,
}: {
  achievement: Achievement;
  earned: boolean;
  className?: string | undefined;
}) {
  const Icon = MOTIFS[achievement.motif];
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span
        className={cn(
          "grid h-16 w-16 shrink-0 place-items-center rounded-2xl",
          earned ? "bg-yellow text-text" : "bg-cream-deep text-text-soft/60",
        )}
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={cn("font-display text-lg leading-tight", !earned && "text-text-soft")}>
          {achievement.name}
        </p>
        <p className="truncate text-sm text-text-soft">
          {earned ? achievement.description : "Not earned yet"}
        </p>
      </div>
    </div>
  );
}
