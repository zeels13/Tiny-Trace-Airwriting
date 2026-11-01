import { useCallback, useEffect, useRef } from "react";

import { DRAWING_SURFACE_PADDING } from "@/lib/drawing-surface";
import { lerpPoint, smooth, transformPoint } from "@/lib/geometry";
import type { Point, Stroke, StrokeTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { VisionProvider, VisionSample } from "@/vision";

/**
 * AirWritingCanvas — real-time rendering of an abstract point stream.
 *
 * It knows nothing about where points come from: any VisionProvider (mock
 * today, MediaPipe later) can drive it. High-frequency coordinates live in
 * refs and are drawn in requestAnimationFrame; React state is never touched
 * per frame.
 *
 * Reset is explicitly requested: bumping `resetSignal` (or swapping the
 * provider) clears the trail. Re-renders and callback identity changes never
 * do, and the point subscription is independent of the reset.
 */
export function AirWritingCanvas({
  provider,
  template,
  ghostOpacity = 0.18,
  className,
  onStrokesChange,
  resetSignal = 0,
}: {
  provider: VisionProvider;
  template?: StrokeTemplate | undefined;
  ghostOpacity?: number | undefined;
  className?: string | undefined;
  onStrokesChange?: ((strokes: Stroke[]) => void) | undefined;
  /** Bump this value to clear the trail (new attempt, retry, explicit clear). */
  resetSignal?: number | undefined;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Point[]>([]);
  const fingerRef = useRef<Point | null>(null);
  const smoothedRef = useRef<Point | null>(null);
  const writingRef = useRef(false);
  /** When the provider last sent a sample, so a lost hand hides the pointer. */
  const lastSampleAtRef = useRef(0);

  // Keep the latest callback without making the sample handler (and therefore
  // the point subscription) change identity on every parent render.
  const onStrokesChangeRef = useRef(onStrokesChange);
  useEffect(() => {
    onStrokesChangeRef.current = onStrokesChange;
  }, [onStrokesChange]);

  const handleSample = useCallback(
    (sample: VisionSample) => {
      lastSampleAtRef.current = performance.now();
      // A new stroke starts exactly under the fingertip: never interpolate
      // from where the hand was between strokes (or before a re-pinch), which
      // would put the first ink point far from the pointer.
      const startingStroke = sample.isWriting && !writingRef.current;
      const previous = startingStroke ? null : smoothedRef.current;
      const next = previous ? lerpPoint(previous, sample.point, 0.45) : sample.point;
      smoothedRef.current = next;
      fingerRef.current = next;

      if (sample.isWriting) {
        writingRef.current = true;
        const last = currentRef.current[currentRef.current.length - 1];
        if (!last || Math.hypot(last.x - next.x, last.y - next.y) > 0.004) {
          currentRef.current.push({ ...next });
        }
      } else if (writingRef.current) {
        writingRef.current = false;
        if (currentRef.current.length > 3) {
          strokesRef.current = [
            ...strokesRef.current,
            { id: `drawn-${strokesRef.current.length + 1}`, points: currentRef.current },
          ];
          onStrokesChangeRef.current?.(strokesRef.current);
        }
        currentRef.current = [];
      }
    },
    [],
  );

  /** Clears the child's trail (used when retrying). */
  const reset = useCallback(() => {
    strokesRef.current = [];
    currentRef.current = [];
    smoothedRef.current = null;
    fingerRef.current = null;
    writingRef.current = false;
  }, []);

  // Reset only on an explicit request (new attempt / retry) or a new provider.
  useEffect(() => {
    reset();
  }, [provider, resetSignal, reset]);

  // Subscription only: it never clears state on its own.
  useEffect(() => provider.subscribeToPoints(handleSample), [provider, handleSample]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim() || "#333";
    const inkDone = token("--tt-forest");
    const inkLive = token("--tt-coral");
    // Light ghost so the guide reads on the dark camera surface; the child's
    // ink (coral live / forest finished) stays the brightest thing on screen.
    const inkGhost = token("--tt-cream");

    let raf = 0;
    const draw = () => {
      const size = { width: canvas.width, height: canvas.height };
      ctx.clearRect(0, 0, size.width, size.height);

      // layer 1 — ghost of the target, in canvas space
      if (template) {
        ctx.save();
        ctx.strokeStyle = inkGhost;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const traceGuide = () => {
          template.strokes.forEach((s) => {
            ctx.beginPath();
            s.points.forEach((p, i) => {
              const t = transformPoint(p, size, DRAWING_SURFACE_PADDING * dpr);
              if (i === 0) ctx.moveTo(t.x, t.y);
              else ctx.lineTo(t.x, t.y);
            });
            ctx.stroke();
          });
        };

        // Soft halo keeps the guide readable over bright camera content.
        ctx.globalAlpha = ghostOpacity * 0.4;
        ctx.lineWidth = 26 * dpr;
        traceGuide();

        // Crisp guide line, slightly wider than the ink but never covering it.
        ctx.globalAlpha = ghostOpacity;
        ctx.lineWidth = 13 * dpr;
        traceGuide();
        ctx.restore();
      }

      // layer 2 — finished strokes
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 11 * dpr;
      ctx.strokeStyle = inkDone;
      strokesRef.current.forEach((s) => drawPolyline(ctx, smooth(s.points, 1), size, dpr));

      // layer 3 — live stroke
      ctx.strokeStyle = inkLive;
      drawPolyline(ctx, smooth(currentRef.current, 1), size, dpr);

      // layer 4 — fingertip. Providers stop emitting samples when the hand is
      // lost, so a stale pointer is hidden instead of freezing on screen.
      const finger =
        performance.now() - lastSampleAtRef.current < 500 ? fingerRef.current : null;
      if (finger) {
        const t = transformPoint(finger, size, DRAWING_SURFACE_PADDING * dpr);
        ctx.beginPath();
        ctx.fillStyle = inkLive;
        ctx.globalAlpha = 0.25;
        ctx.arc(t.x, t.y, 20 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 8 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [template, ghostOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="Your air writing trail"
    />
  );
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  size: { width: number; height: number },
  dpr: number,
) {
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach((p, i) => {
    const t = transformPoint(p, size, DRAWING_SURFACE_PADDING * dpr);
    if (i === 0) ctx.moveTo(t.x, t.y);
    else ctx.lineTo(t.x, t.y);
  });
  ctx.stroke();
}
