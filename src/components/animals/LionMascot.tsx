import { cn } from "@/lib/utils";

export type MascotPose =
  | "welcome"
  | "teaching"
  | "pointing"
  | "encouraging"
  | "celebrating"
  | "thinking"
  | "try-again";

/**
 * Rumi the lion cub — original 2D character drawn as vector primitives so
 * custom Tiny Trace artwork can drop in later behind the same props.
 */
export function LionMascot({
  pose = "welcome",
  className,
  idle = true,
}: {
  pose?: MascotPose | undefined;
  className?: string | undefined;
  idle?: boolean | undefined;
}) {
  const eyes = pose === "thinking" ? "look-up" : pose === "try-again" ? "soft" : "open";
  const mouth = pose === "celebrating" || pose === "encouraging" ? "big" : pose === "try-again" ? "small" : "smile";

  return (
    <svg
      viewBox="0 0 200 210"
      className={cn(idle && "animate-cub-breathe", className)}
      role="img"
      aria-label={`Rumi the lion cub, ${pose.replace("-", " ")}`}
    >
      {/* mane */}
      <g>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={Math.round((100 + Math.cos(a) * 58) * 100) / 100}
              cy={Math.round((92 + Math.sin(a) * 58) * 100) / 100}
              r={22}
              fill={i % 2 ? "var(--tt-yellow-deep)" : "var(--tt-yellow)"}
            />
          );
        })}
      </g>

      {/* body */}
      <path d="M62 150h76c8 0 14 7 14 15v45H48v-45c0-8 6-15 14-15Z" fill="var(--tt-coral)" />
      <path d="M78 176h44v34H78z" fill="var(--tt-coral-soft)" />

      {/* tail with trace motif */}
      <path
        d="M152 195c22-6 26-26 14-38"
        fill="none"
        stroke="var(--tt-coral)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="164" cy="154" r="7" fill="var(--tt-yellow-deep)" />

      {/* arms */}
      {pose === "pointing" || pose === "teaching" ? (
        <path
          d="M140 166c16-6 26-22 26-38"
          fill="none"
          stroke="var(--tt-coral)"
          strokeWidth="14"
          strokeLinecap="round"
        />
      ) : pose === "celebrating" ? (
        <>
          <path d="M58 164c-14-8-20-26-16-42" fill="none" stroke="var(--tt-coral)" strokeWidth="14" strokeLinecap="round" />
          <path d="M142 164c14-8 20-26 16-42" fill="none" stroke="var(--tt-coral)" strokeWidth="14" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M60 168c-8 6-12 16-11 26" fill="none" stroke="var(--tt-coral)" strokeWidth="14" strokeLinecap="round" />
          <path d="M140 168c8 6 12 16 11 26" fill="none" stroke="var(--tt-coral)" strokeWidth="14" strokeLinecap="round" />
        </>
      )}

      {/* head */}
      <circle cx="100" cy="92" r="52" fill="var(--tt-yellow)" />
      <ellipse cx="100" cy="104" rx="34" ry="30" fill="var(--tt-cream)" />

      {/* ears */}
      <circle cx="62" cy="52" r="14" fill="var(--tt-yellow-deep)" />
      <circle cx="138" cy="52" r="14" fill="var(--tt-yellow-deep)" />

      {/* eyes */}
      {eyes === "soft" ? (
        <>
          <path d="M76 88q10 8 20 0" fill="none" stroke="var(--tt-text)" strokeWidth="5" strokeLinecap="round" />
          <path d="M104 88q10 8 20 0" fill="none" stroke="var(--tt-text)" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="85" cy={eyes === "look-up" ? 84 : 88} r="6.5" fill="var(--tt-text)" />
          <circle cx="115" cy={eyes === "look-up" ? 84 : 88} r="6.5" fill="var(--tt-text)" />
          <circle cx="87" cy={eyes === "look-up" ? 81 : 85} r="2.2" fill="var(--tt-cream)" />
          <circle cx="117" cy={eyes === "look-up" ? 81 : 85} r="2.2" fill="var(--tt-cream)" />
        </>
      )}

      {/* nose + mouth */}
      <path d="M100 100l-8 6h16z" fill="var(--tt-coral)" />
      {mouth === "big" ? (
        <path d="M86 112q14 16 28 0q-14 8-28 0Z" fill="var(--tt-coral)" />
      ) : mouth === "small" ? (
        <path d="M92 116q8 4 16 0" fill="none" stroke="var(--tt-text)" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path
          d="M100 108v4m0 0c-3 5-9 5-12 1m12-1c3 5 9 5 12 1"
          fill="none"
          stroke="var(--tt-text)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* cheeks */}
      <circle cx="70" cy="106" r="6" fill="var(--tt-coral-soft)" />
      <circle cx="130" cy="106" r="6" fill="var(--tt-coral-soft)" />

      {pose === "thinking" && (
        <g fill="var(--tt-cream)" stroke="var(--tt-forest)" strokeWidth="3">
          <circle cx="160" cy="42" r="7" />
          <circle cx="176" cy="24" r="10" />
        </g>
      )}
      {pose === "celebrating" && (
        <g stroke="var(--tt-forest)" strokeWidth="4" strokeLinecap="round">
          <path d="M30 40l-10-12M170 40l10-12M100 18v-14" />
        </g>
      )}
    </svg>
  );
}
