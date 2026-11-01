import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, RotateCcw, Volume2, Wind } from "lucide-react";
import type { ReactNode } from "react";

import { ChildTopBar } from "@/components/navigation/ChildTopBar";
import { TTButton } from "@/components/ui-tt/TTButton";
import { useAppState } from "@/state/app-state";
import { VOICE_LINES, voiceService } from "@/services/voiceService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Tiny Trace" },
      {
        name: "description",
        content: "Turn sound, voice guidance, reduced motion and demo mode on or off, and reset progress.",
      },
      { property: "og:title", content: "Settings — Tiny Trace" },
      { property: "og:description", content: "Accessibility and practice options for Tiny Trace." },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const { progress, updateSettings, setChildName, restart } = useAppState();
  const s = progress.settings;

  return (
    <main className="paper min-h-screen pb-20">
      <ChildTopBar />

      <div className="mx-auto w-full max-w-2xl px-6 sm:px-10">
        <h1 className="font-display text-5xl leading-none">Settings</h1>
        <p className="mt-3 text-lg text-text-soft">Grown-ups can change how Tiny Trace looks and sounds.</p>

        <div className="mt-10">
          <label className="font-display text-sm font-extrabold uppercase tracking-[0.18em] text-text-soft">
            Child's name
          </label>
          <input
            value={progress.childName}
            onChange={(event) => setChildName(event.target.value)}
            className="mt-2 h-14 w-full rounded-2xl border-[3px] border-border bg-card px-5 font-display text-xl font-extrabold text-forest-deep focus:border-forest focus:outline-none"
            aria-label="Child's name"
          />
        </div>

        <ul className="mt-10 divide-y divide-border">
          <ToggleRow
            icon={<Volume2 className="h-5 w-5" aria-hidden="true" />}
            title="Sound effects"
            description="Cheers and gentle clicks during lessons."
            checked={s.sound}
            onChange={(sound) => updateSettings({ sound })}
          />
          <ToggleRow
            icon={<Wind className="h-5 w-5" aria-hidden="true" />}
            title="Voice guidance"
            description="Rumi reads instructions aloud using your browser's voice."
            checked={s.voiceGuide}
            onChange={(voiceGuide) => {
              updateSettings({ voiceGuide });
              if (voiceGuide) voiceService.speak(VOICE_LINES.followTrail);
            }}
          />
          <ToggleRow
            icon={<Eye className="h-5 w-5" aria-hidden="true" />}
            title="Reduced motion"
            description="Removes celebration animations and moving trails."
            checked={s.reducedMotion}
            onChange={(reducedMotion) => updateSettings({ reducedMotion })}
          />
          <ToggleRow
            icon={<Eye className="h-5 w-5" aria-hidden="true" />}
            title="Demo mode"
            description="Practice runs with a simulated fingertip instead of the camera."
            checked={s.demoMode}
            onChange={(demoMode) => updateSettings({ demoMode })}
          />
        </ul>

        <div className="mt-12">
          <h2 className="font-display text-2xl">Start over</h2>
          <p className="mt-2 text-text-soft">
            Clears XP, stars, badges, friends and every trail on this device.
          </p>
          <TTButton variant="outline" size="md" className="mt-4" onClick={restart}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset progress
          </TTButton>
        </div>

        <Link to="/parent" className="mt-12 inline-block font-display text-sm font-extrabold text-forest">
          Open the parent dashboard
        </Link>
      </div>
    </main>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-start gap-4 py-5">
      <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-card text-forest">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-tight">{title}</p>
        <p className="text-sm text-text-soft">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-1 h-9 w-16 shrink-0 rounded-full transition-colors",
          checked ? "bg-forest" : "bg-cream-deep",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-7 w-7 rounded-full bg-card transition-[left]",
            checked ? "left-8" : "left-1",
          )}
        />
      </button>
    </li>
  );
}
