import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { TinyTraceLogo } from "@/components/branding/TinyTraceLogo";
import { LionMascot } from "@/components/animals/LionMascot";
import { TTButton } from "@/components/ui-tt/TTButton";
import { useAppState } from "@/state/app-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tiny Trace — Learn to Write in the Air" },
      {
        name: "description",
        content:
          "Tiny Trace is a jungle learning adventure where children trace strokes, shapes, numbers and letters with their finger in the air.",
      },
      { property: "og:title", content: "Tiny Trace — Learn to Write in the Air" },
      {
        property: "og:description",
        content: "Follow the trail with Rumi the lion cub and learn to write, one stroke at a time.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { progress, hydrated } = useAppState();
  const destination = progress.onboarded ? "/home" : "/onboarding";

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => navigate({ to: destination }), 2200);
    return () => window.clearTimeout(timer);
  }, [hydrated, destination, navigate]);

  return (
    <main className="paper relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* the trace motif enters from the edge of the screen */}
      <svg
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full"
        aria-hidden="true"
      >
        <path
          d="M-40 300 C 220 180, 380 360, 620 260 S 980 120, 1240 220"
          fill="none"
          stroke="var(--tt-forest-soft)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d="M-40 300 C 220 180, 380 360, 620 260 S 980 120, 1240 220"
          fill="none"
          stroke="var(--tt-forest)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="4 26"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center animate-rise-in">
        <LionMascot pose="welcome" className="h-52 w-52 sm:h-64 sm:w-64" />
        <TinyTraceLogo size="lg" className="mt-6" />
        <p className="mt-8 max-w-sm text-center text-lg text-text-soft">
          Trace in the air. Learn to write. Explore the jungle.
        </p>
        <TTButton
          size="lg"
          className="mt-8"
          onClick={() => navigate({ to: destination })}
        >
          START
        </TTButton>
      </div>
    </main>
  );
}
