import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ParentMetricCard({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  sub?: string | undefined;
  icon?: ReactNode | undefined;
  tone?: "neutral" | "good" | "warn" | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {icon && <span className="text-text-soft">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-extrabold",
          tone === "good" && "text-forest",
          tone === "warn" && "text-coral",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
