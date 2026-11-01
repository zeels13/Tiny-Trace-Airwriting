import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Counts up to `value` with requestAnimationFrame — no React state per frame. */
export function XPAnimation({
  value,
  prefix = "+",
  suffix = " XP",
  duration = 900,
  className,
}: {
  value: number;
  prefix?: string | undefined;
  suffix?: string | undefined;
  duration?: number | undefined;
  className?: string | undefined;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced =
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.classList.contains("tt-reduced-motion"));
    if (reduced) {
      node.textContent = `${prefix}${value}${suffix}`;
      setDone(true);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = `${prefix}${Math.round(value * eased)}${suffix}`;
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, prefix, suffix, duration]);

  return (
    <span
      ref={ref}
      className={cn("font-display font-extrabold transition-transform", done && "scale-105", className)}
    >
      {prefix}0{suffix}
    </span>
  );
}

export function XPBar({ into, span, className }: { into: number; span: number; className?: string | undefined }) {
  const pct = Math.max(4, Math.min(100, Math.round((into / span) * 100)));
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-cream-deep", className)}>
      <div
        className="h-full rounded-full bg-forest transition-[width] duration-[var(--tt-dur-slow)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
