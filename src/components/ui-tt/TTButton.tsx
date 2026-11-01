import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const ttButton = cva(
  "inline-flex items-center justify-center gap-2 font-display font-extrabold tracking-wide transition-[transform,background-color,box-shadow] duration-[var(--tt-dur-fast)] active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-forest text-primary-foreground shadow-[0_5px_0_0_var(--tt-forest-deep)] hover:bg-forest-deep active:shadow-[0_2px_0_0_var(--tt-forest-deep)]",
        sun: "bg-yellow text-text shadow-[0_5px_0_0_var(--tt-yellow-deep)] hover:bg-yellow-deep active:shadow-[0_2px_0_0_var(--tt-yellow-deep)]",
        coral:
          "bg-coral text-accent-foreground shadow-[0_5px_0_0_color-mix(in_oklab,var(--tt-coral)_70%,black)] hover:brightness-95",
        quiet: "bg-transparent text-text-soft hover:bg-cream-deep",
        outline: "border-[3px] border-forest/25 bg-card text-forest-deep hover:border-forest/50",
      },
      size: {
        sm: "h-10 rounded-lg px-4 text-sm",
        md: "h-12 rounded-xl px-6 text-base",
        lg: "h-16 rounded-2xl px-10 text-xl",
        xl: "h-20 rounded-3xl px-14 text-2xl",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Variants = VariantProps<typeof ttButton>;

export function TTButton({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & Variants) {
  return <button className={cn(ttButton({ variant, size }), className)} {...props} />;
}
