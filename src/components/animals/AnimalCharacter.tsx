import { cn } from "@/lib/utils";
import type { AnimalId } from "@/lib/types";
import { LionMascot } from "./LionMascot";

/**
 * Jungle friends. Each animal is an original vector character built from the
 * same palette tokens, so illustrated artwork can replace a single case later.
 */
export function AnimalCharacter({
  id,
  className,
  silhouette = false,
}: {
  id: AnimalId;
  className?: string;
  silhouette?: boolean;
}) {
  if (id === "lion" && !silhouette) return <LionMascot pose="welcome" idle={false} className={className} />;

  const fill = silhouette ? "var(--tt-cream-deep)" : undefined;
  const c = (token: string) => (silhouette ? "var(--tt-cream-deep)" : token);
  const ink = silhouette ? "var(--tt-cream-deep)" : "var(--tt-text)";

  return (
    <svg viewBox="0 0 120 120" className={cn(className)} role="img" aria-label={id}>
      {id === "lion" && (
        <g>
          <circle cx="60" cy="60" r="42" fill={c("var(--tt-yellow-deep)")} />
          <circle cx="60" cy="60" r="30" fill={c("var(--tt-yellow)")} />
          <circle cx="50" cy="56" r="4" fill={ink} />
          <circle cx="70" cy="56" r="4" fill={ink} />
          <path d="M52 72q8 6 16 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {id === "caterpillar" && (
        <g>
          {[26, 44, 62, 80].map((x, i) => (
            <circle key={x} cx={x} cy={72 - i * 4} r={13} fill={c(i % 2 ? "var(--tt-forest)" : "var(--tt-forest-soft)")} />
          ))}
          <circle cx="96" cy="56" r="16" fill={c("var(--tt-forest)")} />
          <circle cx="92" cy="52" r="3.4" fill={ink} />
          <circle cx="102" cy="52" r="3.4" fill={ink} />
          <path d="M92 34l4 8M106 34l-4 8" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {id === "turtle" && (
        <g>
          <ellipse cx="58" cy="66" rx="38" ry="28" fill={c("var(--tt-forest)")} />
          <path d="M34 66h48M58 44v44" stroke={c("var(--tt-forest-soft)")} strokeWidth="5" />
          <circle cx="100" cy="54" r="14" fill={c("var(--tt-forest-soft)")} />
          <circle cx="104" cy="52" r="3" fill={ink} />
          <path d="M30 90l-8 10M78 90l8 10" stroke={c("var(--tt-forest-soft)")} strokeWidth="9" strokeLinecap="round" />
        </g>
      )}
      {id === "monkey" && (
        <g>
          <circle cx="26" cy="52" r="12" fill={c("var(--tt-bark)")} />
          <circle cx="94" cy="52" r="12" fill={c("var(--tt-bark)")} />
          <circle cx="60" cy="58" r="34" fill={c("var(--tt-bark)")} />
          <ellipse cx="60" cy="68" rx="24" ry="20" fill={c("var(--tt-cream-deep)")} />
          <circle cx="50" cy="54" r="4" fill={ink} />
          <circle cx="70" cy="54" r="4" fill={ink} />
          <path d="M50 74q10 8 20 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {id === "giraffe" && (
        <g>
          <path d="M52 108V56c0-16 12-26 26-26" stroke={c("var(--tt-yellow-deep)")} strokeWidth="20" fill="none" strokeLinecap="round" />
          <circle cx="86" cy="34" r="18" fill={c("var(--tt-yellow)")} />
          <circle cx="80" cy="30" r="3.4" fill={ink} />
          <circle cx="92" cy="30" r="3.4" fill={ink} />
          <path d="M76 18v-8M96 18v-8" stroke={c("var(--tt-bark)")} strokeWidth="5" strokeLinecap="round" />
          <circle cx="46" cy="72" r="6" fill={c("var(--tt-bark)")} />
          <circle cx="58" cy="90" r="5" fill={c("var(--tt-bark)")} />
        </g>
      )}
      {id === "parrot" && (
        <g>
          <ellipse cx="58" cy="64" rx="26" ry="32" fill={c("var(--tt-coral)")} />
          <path d="M60 40q26 6 22 34-18 4-26-12" fill={c("var(--tt-sky-deep)")} />
          <circle cx="50" cy="44" r="4" fill={ink} />
          <path d="M36 50l-14 6 14 8z" fill={c("var(--tt-yellow-deep)")} />
          <path d="M58 96v14" stroke={c("var(--tt-yellow-deep)")} strokeWidth="5" strokeLinecap="round" />
        </g>
      )}
      {id === "elephant" && (
        <g>
          <circle cx="30" cy="52" r="20" fill={c("var(--tt-sky)")} />
          <circle cx="62" cy="58" r="34" fill={c("var(--tt-sky-deep)")} />
          <path d="M62 88q4 22 22 20" stroke={c("var(--tt-sky-deep)")} strokeWidth="13" fill="none" strokeLinecap="round" />
          <circle cx="54" cy="52" r="4" fill={ink} />
          <circle cx="74" cy="52" r="4" fill={ink} />
        </g>
      )}
      {id === "butterfly" && (
        <g>
          <ellipse cx="42" cy="48" rx="22" ry="18" fill={c("var(--tt-coral)")} />
          <ellipse cx="78" cy="48" rx="22" ry="18" fill={c("var(--tt-yellow)")} />
          <ellipse cx="46" cy="78" rx="17" ry="14" fill={c("var(--tt-coral-soft)")} />
          <ellipse cx="74" cy="78" rx="17" ry="14" fill={c("var(--tt-yellow-deep)")} />
          <rect x="56" y="38" width="8" height="52" rx="4" fill={c("var(--tt-text)")} />
          <path d="M58 34l-6-10M62 34l6-10" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {fill && <rect width="0" height="0" fill={fill} />}
    </svg>
  );
}
