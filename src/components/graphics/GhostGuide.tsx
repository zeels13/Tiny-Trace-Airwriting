import { toSvgPath } from "@/lib/geometry";
import type { StrokeTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * GhostGuide — the translucent reference layer.
 *
 * Layer order (back to front): full ghost -> completed strokes -> active
 * stroke highlight -> start marker. Driven entirely by stroke-coordinate data,
 * so real template data from the backend renders without changes.
 */
export function GhostGuide({
  template,
  activeStroke = 0,
  completed = 0,
  opacity = 1,
  className,
  showStartMarker = true,
}: {
  template: StrokeTemplate;
  activeStroke?: number | undefined;
  completed?: number | undefined;
  opacity?: number | undefined;
  className?: string | undefined;
  showStartMarker?: boolean | undefined;
}) {
  const active = template.strokes[activeStroke];
  const start = active?.points[0];

  return (
    <svg viewBox="0 0 100 100" className={cn("h-full w-full", className)} aria-hidden="true">
      {/* full translucent reference */}
      <g opacity={0.22 * opacity}>
        {template.strokes.map((s) => (
          <path
            key={`ghost-${s.id}`}
            d={toSvgPath(s.points.map((p) => ({ x: p.x * 100, y: p.y * 100 })))}
            fill="none"
            stroke="var(--tt-text)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* strokes already traced */}
      {template.strokes.slice(0, completed).map((s) => (
        <path
          key={`done-${s.id}`}
          d={toSvgPath(s.points.map((p) => ({ x: p.x * 100, y: p.y * 100 })))}
          fill="none"
          stroke="var(--tt-forest-soft)"
          strokeWidth={6.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* the stroke to trace right now */}
      {active && (
        <path
          d={toSvgPath(active.points.map((p) => ({ x: p.x * 100, y: p.y * 100 })))}
          fill="none"
          stroke="var(--tt-yellow-deep)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1.5 5"
          opacity={0.9 * opacity}
        />
      )}

      {showStartMarker && start && (
        <g>
          <circle
            cx={start.x * 100}
            cy={start.y * 100}
            r={4.4}
            fill="var(--tt-coral)"
            className="origin-center animate-pulse-dot"
            style={{ transformBox: "fill-box" }}
          />
          <circle cx={start.x * 100} cy={start.y * 100} r={3.2} fill="var(--tt-coral)" />
        </g>
      )}
    </svg>
  );
}
