import { AnimalCharacter } from "@/components/animals/AnimalCharacter";
import { ANIMALS } from "@/data/curriculum";
import type { AnimalId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AnimalCollection({ owned, className }: { owned: AnimalId[]; className?: string | undefined }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4", className)}>
      {ANIMALS.map((animal) => {
        const unlocked = owned.includes(animal.id);
        return (
          <li key={animal.id} className="text-center">
            <div
              className={cn(
                "mx-auto grid h-28 w-28 place-items-center rounded-full",
                unlocked ? "bg-card" : "bg-cream-deep",
              )}
            >
              <AnimalCharacter id={animal.id} silhouette={!unlocked} className="h-20 w-20" />
            </div>
            <p className={cn("mt-3 font-display text-lg leading-tight", !unlocked && "text-text-soft")}>
              {unlocked ? animal.name : "???"}
            </p>
            <p className="text-sm text-text-soft">{unlocked ? animal.role : animal.unlockHint}</p>
          </li>
        );
      })}
    </ul>
  );
}
