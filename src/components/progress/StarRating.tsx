import { cn } from "@/lib/utils";

export function StarRating({
  value,
  total = 5,
  size = 28,
  animate = false,
  className,
}: {
  value: number;
  total?: number | undefined;
  size?: number | undefined;
  animate?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} role="img" aria-label={`${value} out of ${total} stars`}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < value;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={cn(animate && filled && "animate-pop-in")}
            style={animate && filled ? { animationDelay: `${i * 120}ms` } : undefined}
            aria-hidden="true"
          >
            <path
              d="M12 2.6l2.9 6.1 6.6.8-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.8z"
              fill={filled ? "var(--tt-yellow-deep)" : "var(--tt-cream-deep)"}
              stroke={filled ? "var(--tt-bark)" : "var(--tt-cream-deep)"}
              strokeWidth="1.2"
            />
          </svg>
        );
      })}
    </div>
  );
}
