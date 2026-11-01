import { cn } from "@/lib/utils";

/** Tiny Trace loading state: a trail being traced, never a generic spinner. */
export function TraceLoader({ label = "Getting your trail ready…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-10", className)}>
      <svg viewBox="0 0 160 40" className="h-10 w-40" aria-hidden="true">
        <path
          d="M6 30 C 32 4, 56 34, 80 20 S 128 6, 154 24"
          fill="none"
          stroke="var(--tt-cream-deep)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M6 30 C 32 4, 56 34, 80 20 S 128 6, 154 24"
          fill="none"
          stroke="var(--tt-forest)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="40 180"
          className="animate-trace-dash"
        />
      </svg>
      <p className="font-display text-sm font-bold text-text-soft">{label}</p>
    </div>
  );
}
