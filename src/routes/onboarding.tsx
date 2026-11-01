import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { LionMascot, type MascotPose } from "@/components/animals/LionMascot";
import { StrokeAnimator } from "@/components/graphics/StrokeAnimator";
import { TinyTraceLogo } from "@/components/branding/TinyTraceLogo";
import { TTButton } from "@/components/ui-tt/TTButton";
import { STROKE_GLYPHS } from "@/data/strokes";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Meet Rumi — Tiny Trace" },
      {
        name: "description",
        content: "A three-step welcome that shows children how air tracing works before their first trail.",
      },
      { property: "og:title", content: "Meet Rumi — Tiny Trace" },
      { property: "og:description", content: "Say hello to your Tiny Trace friend and start tracing." },
    ],
  }),
  component: Onboarding,
});

interface Step {
  pose: MascotPose;
  headline: string;
  body: string;
  cta: string;
  visual: "lion" | "trace" | "camera";
}

const STEPS: Step[] = [
  {
    pose: "welcome",
    headline: "Hi! I'm your Tiny Trace friend.",
    body: "My name is Rumi. We're going to learn to write together.",
    cta: "NEXT",
    visual: "lion",
  },
  {
    pose: "teaching",
    headline: "Move your finger in the air.",
    body: "Point one finger and follow my trail. No pencil needed.",
    cta: "NEXT",
    visual: "trace",
  },
  {
    pose: "pointing",
    headline: "I'll watch your finger and help you trace.",
    body: "The camera looks at your hand so I can cheer you on.",
    cta: "NEXT",
    visual: "camera",
  },
  {
    pose: "encouraging",
    headline: "Ready for your first trail?",
    body: "We start in Stroke Forest with one straight line.",
    cta: "LET'S GO",
    visual: "lion",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const { finishOnboarding } = useAppState();
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;

  const advance = () => {
    if (index < STEPS.length - 1) {
      setIndex(index + 1);
      return;
    }
    finishOnboarding();
    navigate({ to: "/home" });
  };

  return (
    <main className="paper flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <TinyTraceLogo size="sm" />
        <button
          onClick={() => {
            finishOnboarding();
            navigate({ to: "/home" });
          }}
          className="font-display text-sm font-extrabold text-text-soft hover:text-forest-deep"
        >
          Skip
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-6 pb-10 sm:grid-cols-2 sm:px-10">
        <div key={index} className="animate-rise-in">
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-text-soft">
            Step {index + 1} of {STEPS.length}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.1] sm:text-5xl">{step.headline}</h1>
          <p className="mt-4 max-w-md text-lg text-text-soft">{step.body}</p>
          <TTButton size="lg" className="mt-8" onClick={advance}>
            {step.cta}
          </TTButton>
          <div className="mt-8 flex gap-2" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  i === index ? "w-10 bg-forest" : "w-2.5 bg-cream-deep",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          {step.visual === "trace" ? (
            <div className="relative aspect-square w-full max-w-sm rounded-3xl bg-card p-6">
              <StrokeAnimator template={STROKE_GLYPHS["zigzag"]!} />
              <LionMascot pose="teaching" className="absolute -bottom-6 -left-6 h-28 w-28" />
            </div>
          ) : step.visual === "camera" ? (
            <CameraIllustration />
          ) : (
            <LionMascot pose={step.pose} className="h-72 w-72 sm:h-80 sm:w-80" />
          )}
        </div>
      </div>
    </main>
  );
}

function CameraIllustration() {
  return (
    <div className="relative w-full max-w-sm">
      <svg viewBox="0 0 320 240" className="w-full" role="img" aria-label="A camera watching a raised hand">
        <rect x="20" y="30" width="280" height="180" rx="26" fill="var(--tt-sky)" />
        <rect x="40" y="50" width="240" height="140" rx="18" fill="var(--tt-cream)" />
        <circle cx="160" cy="26" r="9" fill="var(--tt-text)" />
        {/* raised hand, drawn as trace lines */}
        <g stroke="var(--tt-forest)" strokeWidth="10" strokeLinecap="round" fill="none">
          <path d="M150 175v-52" />
          <path d="M132 175v-34" />
          <path d="M168 175v-40" />
          <path d="M186 175v-28" />
        </g>
        <circle cx="150" cy="118" r="10" fill="var(--tt-coral)" />
        <path
          d="M150 118c22-16 42 12 62-4"
          fill="none"
          stroke="var(--tt-coral)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="3 10"
        />
      </svg>
    </div>
  );
}
