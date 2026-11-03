import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Play, RotateCcw } from "lucide-react";

import { AirWritingCanvas } from "@/components/air-writing/AirWritingCanvas";
import { CameraFeed } from "@/components/camera/CameraFeed";
import { GuidePanel } from "@/components/lessons/GuidePanel";
import { LessonHeader } from "@/components/lessons/LessonHeader";
import { LionMascot } from "@/components/animals/LionMascot";
import { TTButton } from "@/components/ui-tt/TTButton";
import { evaluateTemplate } from "@/lib/geometry";
import type { Stroke } from "@/lib/types";
import { lessonService } from "@/services/lessonService";
import { VOICE_LINES, voiceService } from "@/services/voiceService";
import { useAppState } from "@/state/app-state";
import {
  createVisionProvider,
  hasScriptedPlayback,
  VISION_MESSAGES,
  type VisionStatus,
} from "@/vision";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lesson/$lessonId")({
  loader: ({ params }) => {
    const lesson = lessonService.getLesson(params.lessonId);
    const world = lesson ? lessonService.getWorld(lesson.worldId) : undefined;
    if (!lesson || !world) throw notFound();
    return { lesson, world };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Trail unavailable — Tiny Trace" }, { name: "robots", content: "noindex" }] };
    }
    const { lesson, world } = loaderData;
    return {
      meta: [
        { title: `${lesson.title} — ${world.name} — Tiny Trace` },
        { name: "description", content: `Trace ${lesson.template.character}. ${lesson.hint}` },
        { property: "og:title", content: `${lesson.title} — Tiny Trace` },
        { property: "og:description", content: lesson.hint },
      ],
    };
  },
  component: LessonScreen,
});

type Phase = "watch" | "tracing" | "scoring";
type VisionMode = "camera" | "demo";

function LessonScreen() {
  const { lesson, world } = Route.useLoaderData();
  const navigate = useNavigate();
  const { completeLesson } = useAppState();

  const [phase, setPhase] = useState<Phase>("watch");
  const [mode, setMode] = useState<VisionMode>("camera");
  const [status, setStatus] = useState<VisionStatus>("idle");
  const [completedStrokes, setCompletedStrokes] = useState(0);
  const drawnRef = useRef<Stroke[]>([]);
  const startedAtRef = useRef<number>(0);
  const [resetSignal, setResetSignal] = useState(0);
  const finishRef = useRef<() => void>(() => {});
  /** Guards against scoring the same attempt twice (double tap / demo end). */
  const finishingRef = useRef(false);
  const announcedStrokeCountRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const totalStrokes = lesson.template.strokes.length;

  /**
   * Provider selection lives in the factory, not the route: the camera
   * preview is the default, and the demo is an explicit opt-in. MediaPipe
   * plugs in there later without touching this file.
   */
  const provider = useMemo(
    () =>
      createVisionProvider({
        kind: mode === "demo" ? "mock" : "mediapipe",
        strokes: lesson.template.strokes,
        wobble: 0.4,
        samplesPerStroke: 72,
        interval: 50,
        onStrokeEnd: (index) => setCompletedStrokes(index + 1),
        onFinished: () => {
          if (mode === "demo") {
            // The scripted replay is a teaching preview, never a scored attempt.
            drawnRef.current = [];
            setCompletedStrokes(0);
            setResetSignal((n) => n + 1);
            setPhase("watch");
            setMode("camera");
            return;
          }
          finishRef.current();
        },
      }),
    [lesson, mode],
  );

  useEffect(() => provider.subscribeToStatus(setStatus), [provider]);
  useEffect(() => () => provider.stopCamera(), [provider]);

  useEffect(() => {
    voiceService.speak(VOICE_LINES.lessonStart(lesson.template.character));
  }, [lesson]);

  const finish = useCallback(() => {
    // Never score an empty attempt, and keep a second tap from re-scoring.
    if (finishingRef.current || drawnRef.current.length === 0) return;
    finishingRef.current = true;
    const accuracy = evaluateTemplate(lesson.template, drawnRef.current);
    const seconds = Math.max(8, Math.round((performance.now() - startedAtRef.current) / 1000));
    setPhase("scoring");
    const result = completeLesson(lesson.id, accuracy, seconds);
    window.setTimeout(() => {
      navigate({ to: result.unlockedWorldId || result.unlockedAnimalId ? "/result" : "/result" });
    }, 650);
  }, [lesson, completeLesson, navigate]);

  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    if (phase !== "tracing" || mode !== "camera" || completedStrokes <= announcedStrokeCountRef.current) return;
    announcedStrokeCountRef.current = completedStrokes;
    if (completedStrokes >= totalStrokes) {
      voiceService.speak(VOICE_LINES.allLinesComplete);
      return;
    }
    const nextStroke = lesson.template.strokes[completedStrokes];
    voiceService.speak(
      VOICE_LINES.lineComplete(completedStrokes, nextStroke?.direction ?? "follow the next line"),
    );
  }, [completedStrokes, lesson, mode, phase, totalStrokes]);

  // Stable across re-renders so the canvas never re-subscribes or clears.
  // Stroke progress comes from what the child actually drew, for both modes.
  const handleStrokesChange = useCallback((strokes: Stroke[]) => {
    drawnRef.current = strokes;
    setCompletedStrokes(strokes.length);
  }, []);

  const start = useCallback(async () => {
    finishingRef.current = false;
    drawnRef.current = [];
    setCompletedStrokes(0);
    announcedStrokeCountRef.current = 0;
    setResetSignal((n) => n + 1);
    setPhase("tracing");
    startedAtRef.current = performance.now();
    // Camera permission is requested here — an explicit user action — and
    // never during render or on page load.
    await provider.startCamera(videoRef.current);
    voiceService.speak(VOICE_LINES.startPoint(lesson.template.strokes[0]?.direction));
    if (hasScriptedPlayback(provider)) provider.play();
  }, [lesson, provider]);

  const retry = useCallback(() => {
    finishingRef.current = false;
    if (hasScriptedPlayback(provider)) provider.stopPlayback();
    else provider.stopCamera();
    drawnRef.current = [];
    setCompletedStrokes(0);
    setResetSignal((n) => n + 1);
    setPhase("watch");
  }, [provider]);

  /** Explicit demo opt-in; never used as a silent fallback. */
  const switchToDemo = useCallback(() => {
    finishingRef.current = false;
    if (hasScriptedPlayback(provider)) provider.stopPlayback();
    else provider.stopCamera();
    drawnRef.current = [];
    setCompletedStrokes(0);
    setResetSignal((n) => n + 1);
    setPhase("watch");
    setMode("demo");
  }, [provider]);

  const switchToCamera = useCallback(() => {
    finishingRef.current = false;
    if (hasScriptedPlayback(provider)) provider.stopPlayback();
    drawnRef.current = [];
    setCompletedStrokes(0);
    setResetSignal((n) => n + 1);
    setPhase("watch");
    setMode("camera");
  }, [provider]);

  const message = VISION_MESSAGES[phase === "watch" ? "idle" : status] ?? VISION_MESSAGES["idle"]!;

  return (
    <main className="paper flex min-h-screen flex-col">
      <LessonHeader
        lesson={lesson}
        world={world}
        step={phase === "watch" ? completedStrokes : Math.max(completedStrokes, 1)}
        total={totalStrokes}
      />

      <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(320px,40%)_1fr]">
        <GuidePanel
          lesson={lesson}
          mode={phase === "watch" ? "demo" : "trace"}
          activeStroke={Math.min(completedStrokes, totalStrokes - 1)}
          completedStrokes={completedStrokes}
        />

        <section className="flex min-h-[420px] flex-col gap-4" aria-label="Your writing area">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl">Your turn</h2>
            <p className="font-display text-sm font-extrabold text-text-soft">
              {message.title} <span className="font-semibold text-text-soft/80">{message.hint}</span>
            </p>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-3xl bg-forest-deep/95">
            {/* camera/writing surface: dark so the child's bright trail reads clearly */}
            {mode === "camera" ? (
              <CameraFeed videoRef={videoRef} status={status} onUseDemo={switchToDemo} />
            ) : (
              <div className="absolute inset-0 opacity-25">
                <CameraGrid />
              </div>
            )}

            <AirWritingCanvas
              provider={provider}
              resetSignal={resetSignal}
              template={lesson.template}
              ghostOpacity={0.55}
              onStrokesChange={handleStrokesChange}
              className="relative"
            />

            {mode === "camera" && phase === "tracing" && (
              <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-forest-deep/70 px-4 py-2 text-center text-xs font-bold text-cream/80">
                Pinch your thumb and finger together to draw, then let go to
                finish a stroke.
              </p>
            )}

            {phase === "watch" && (
              <div className="absolute inset-0 grid place-items-center bg-forest-deep/70 px-6 text-center">
                <div>
                  <LionMascot pose="teaching" className="mx-auto h-32 w-32" />
                  <p className="mt-3 font-display text-3xl text-cream">
                    {mode === "demo" ? "Watch, then trace!" : "Let’s trace!"}
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-cream/80">{lesson.hint}</p>
                  <TTButton size="lg" variant="sun" className="mt-6" onClick={start}>
                    <Play className="h-6 w-6" aria-hidden="true" />
                    LET'S TRACE
                  </TTButton>
                  {mode === "camera" ? (
                    <div className="mt-4">
                      <p className="mx-auto max-w-xs text-xs font-bold uppercase tracking-[0.14em] text-cream/60">
                        Live hand tracking. Pinch your thumb and finger together
                        to draw.
                      </p>
                      <TTButton variant="outline" size="sm" className="mt-3" onClick={switchToDemo}>
                        Use demo mode
                      </TTButton>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="mx-auto max-w-xs text-xs font-bold uppercase tracking-[0.14em] text-cream/60">
                        Demo mode: the fingertip is simulated. Switch to the
                        camera to trace with your hand.
                      </p>
                      <TTButton variant="outline" size="sm" className="mt-3" onClick={switchToCamera}>
                        Use camera
                      </TTButton>
                    </div>
                  )}
                </div>
              </div>
            )}

            {phase === "scoring" && (
              <div className="absolute inset-0 grid place-items-center bg-forest-deep/80">
                <p className="font-display text-3xl text-cream">Let's see your trail…</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TTButton variant="outline" size="sm" onClick={retry} disabled={phase === "scoring"}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Start over
              </TTButton>
              {mode === "camera" && phase === "tracing" && (
                <TTButton
                  variant="primary"
                  size="sm"
                  onClick={finish}
                  disabled={completedStrokes === 0}
                  title={
                    completedStrokes === 0
                      ? "Pinch your thumb and finger together and draw before finishing."
                      : "Finish and see your score"
                  }
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  I'm done
                </TTButton>
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-display text-xs font-extrabold uppercase tracking-[0.14em]",
                  "bg-cream-deep text-text-soft",
                )}
                title={
                  provider.kind === "mock"
                    ? "Demo mode: the fingertip stream is simulated."
                    : provider.kind === "webcam"
                      ? "Live camera preview. Hand tracking is not connected."
                      : "Live hand tracking from your camera."
                }
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {provider.kind === "mock"
                  ? "Demo mode"
                  : provider.kind === "webcam"
                    ? "Camera preview"
                    : "Camera tracking"}
              </span>
            </div>
            <p className="font-display text-sm font-extrabold text-text-soft">
              {completedStrokes}/{totalStrokes} strokes traced
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/** Subtle grid so the dark writing surface reads as a camera view, not a card. */
function CameraGrid() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={(i + 1) * 10}
          y1="0"
          x2={(i + 1) * 10}
          y2="100"
          stroke="var(--tt-cream)"
          strokeWidth="0.25"
        />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1="0"
          y1={(i + 1) * 10}
          x2="100"
          y2={(i + 1) * 10}
          stroke="var(--tt-cream)"
          strokeWidth="0.25"
        />
      ))}
    </svg>
  );
}
