import { useEffect, useMemo, useRef, useState } from "react";

import { resample, strokeLength, toSvgPath } from "@/lib/geometry";
import type { StrokeTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Animated stroke-order demonstration: draws stroke 1, then 2, then 3, with a
 * start-point pulse and a directional arrow that rides the path.
 */
export function StrokeAnimator({
  template,
  className,
  speed = 1,
  loop = true,
  onStrokeChange,
}: {
  template: StrokeTemplate;
  className?: string | undefined;
  speed?: number | undefined;
  loop?: boolean | undefined;
  onStrokeChange?: ((index: number) => void) | undefined;
}) {
  const strokes = useMemo(
    () =>
      template.strokes.map((s) => {
        const pts = resample(s.points, 60).map((p) => ({ x: p.x * 100, y: p.y * 100 }));
        return { id: s.id, pts, d: toSvgPath(pts), len: strokeLength(pts) };
      }),
    [template],
  );

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    setIndex(0);
    setProgress(0);
  }, [template]);

  useEffect(() => {
    const current = strokes[index];
    if (!current) return;
    const duration = Math.max(650, current.len * 22) / speed;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      setProgress(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        const next = index + 1;
        if (next < strokes.length) {
          window.setTimeout(() => {
            setProgress(0);
            setIndex(next);
            onStrokeChange?.(next);
          }, 320);
        } else if (loop) {
          window.setTimeout(() => {
            setProgress(0);
            setIndex(0);
            onStrokeChange?.(0);
          }, 900);
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [index, strokes, speed, loop, onStrokeChange]);

  const current = strokes[index];
  const head = current?.pts[Math.min(current.pts.length - 1, Math.floor(progress * (current.pts.length - 1)))];
  const prevHead = current?.pts[Math.max(0, Math.floor(progress * (current.pts.length - 1)) - 3)];
  const angle =
    head && prevHead ? (Math.atan2(head.y - prevHead.y, head.x - prevHead.x) * 180) / Math.PI : 0;

  return (
    <svg viewBox="0 0 100 100" className={cn("h-full w-full", className)} aria-hidden="true">
      {strokes.map((s, i) => (
        <path
          key={s.id}
          d={s.d}
          fill="none"
          stroke={i < index ? "var(--tt-forest-soft)" : "var(--tt-cream-deep)"}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {current && (
        <path
          d={current.d}
          fill="none"
          stroke="var(--tt-forest)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${current.len} ${current.len}`}
          strokeDashoffset={current.len * (1 - progress)}
        />
      )}

      {current?.pts[0] && progress < 0.12 && (
        <circle
          cx={current.pts[0].x}
          cy={current.pts[0].y}
          r={4}
          fill="var(--tt-coral)"
          className="origin-center animate-pulse-dot"
          style={{ transformBox: "fill-box" }}
        />
      )}

      {head && (
        <g transform={`translate(${head.x} ${head.y}) rotate(${angle})`}>
          <path d="M-3.4 -3.6 L4.4 0 L-3.4 3.6 Z" fill="var(--tt-coral)" />
        </g>
      )}

      {/* stroke number badge at the start of the active stroke */}
      {current?.pts[0] && (
        <g transform={`translate(${current.pts[0].x - 9} ${current.pts[0].y - 9})`}>
          <circle r="5" cx="0" cy="0" fill="var(--tt-text)" />
          <text
            x="0"
            y="1.9"
            textAnchor="middle"
            fill="var(--tt-cream)"
            fontSize="6"
            fontWeight="800"
            fontFamily="var(--font-display)"
          >
            {index + 1}
          </text>
        </g>
      )}
    </svg>
  );
}
