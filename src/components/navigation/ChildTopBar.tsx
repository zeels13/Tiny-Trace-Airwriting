import { Link } from "@tanstack/react-router";
import { Flame, Settings2, Sparkles } from "lucide-react";

import { TinyTraceLogo } from "@/components/branding/TinyTraceLogo";
import { useAppState } from "@/state/app-state";
import { levelFromXp } from "@/services/progressService";

export function ChildTopBar() {
  const { progress } = useAppState();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
      <Link to="/home" aria-label="Tiny Trace home">
        <TinyTraceLogo size="sm" />
      </Link>

      <div className="flex items-center gap-3 sm:gap-4">
        <span className="flex items-center gap-1.5 rounded-full bg-yellow px-3.5 py-1.5 font-display text-sm font-extrabold text-text">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {progress.xp}
          <span className="sr-only"> experience points</span>
          <span className="text-text-soft">XP</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-coral-soft px-3.5 py-1.5 font-display text-sm font-extrabold text-text">
          <Flame className="h-4 w-4 text-coral" aria-hidden="true" />
          {progress.streak}
          <span className="text-text-soft">day{progress.streak === 1 ? "" : "s"}</span>
        </span>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-full border-[3px] border-forest/20 px-3.5 py-1 font-display text-sm font-extrabold text-forest-deep transition-colors hover:border-forest/50"
        >
          Lv {levelFromXp(progress.xp)}
          <span className="hidden sm:inline text-text-soft">{progress.childName}</span>
        </Link>
        <Link
          to="/settings"
          aria-label="Settings"
          className="rounded-full p-2 text-text-soft transition-colors hover:bg-cream-deep hover:text-forest-deep"
        >
          <Settings2 className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
