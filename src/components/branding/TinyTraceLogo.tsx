import { cn } from "@/lib/utils";

/**
 * Tiny Trace wordmark: the trace motif starts under "TINY", loops through the
 * baseline of "TRACE" and ends in a fingertip dot.
 */
export function TinyTraceLogo({
  className,
  size = "md",
  animated = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}) {
  const scale = { sm: "text-xl", md: "text-3xl", lg: "text-5xl sm:text-6xl" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <TraceMark className={{ sm: "h-7 w-7", md: "h-9 w-9", lg: "h-14 w-14" }[size]} />
      <span className="relative inline-block leading-none">
        <span className={cn("font-display block font-extrabold tracking-tight text-forest-deep", scale)}>
          <span className="text-forest">TINY</span> TRACE
        </span>
        <svg
          viewBox="0 0 200 16"
          preserveAspectRatio="none"
          className="absolute -bottom-1.5 left-0 h-2.5 w-full"
          aria-hidden="true"
        >
          <path
            d="M2 11 C 40 2, 62 15, 96 9 S 150 2, 186 8"
            fill="none"
            stroke="var(--tt-yellow-deep)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={animated ? "26 10" : undefined}
            className={animated ? "animate-trace-dash" : undefined}
          />
          <circle cx="192" cy="8" r="4" fill="var(--tt-coral)" />
        </svg>
      </span>
    </span>
  );
}

/** Small icon form: a lion silhouette drawn from a single trace line. */
export function TraceMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Tiny Trace">
      <circle cx="24" cy="24" r="22" fill="var(--tt-yellow)" />
      <path
        d="M24 6c-3 0-4.5 2-4.5 4.5 0 1.2.4 2 .4 2C15 14 12 18 12 23c0 7 5.4 12 12 12s12-5 12-12c0-5-3-9-7.9-10.5 0 0 .4-.8.4-2C28.5 8 27 6 24 6Z"
        fill="var(--tt-coral)"
      />
      <circle cx="24" cy="26" r="8.5" fill="var(--tt-cream)" />
      <circle cx="21" cy="24" r="1.5" fill="var(--tt-text)" />
      <circle cx="27" cy="24" r="1.5" fill="var(--tt-text)" />
      <path
        d="M20.5 29c1 1.4 2.1 2 3.5 2s2.5-.6 3.5-2"
        fill="none"
        stroke="var(--tt-text)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 38c6-4 10 2 16-1s10 3 20-3"
        fill="none"
        stroke="var(--tt-forest)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="5 5"
      />
    </svg>
  );
}
