import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  spin: number;
  angle: number;
  color: string;
}

/**
 * Canvas particle burst for celebrations. Isolated from React state: every
 * frame is drawn in requestAnimationFrame against refs only.
 */
export function Confetti({
  active,
  className,
  count = 90,
}: {
  active: boolean;
  className?: string | undefined;
  count?: number | undefined;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("tt-reduced-motion");
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["var(--tt-yellow)", "var(--tt-coral)", "var(--tt-forest)", "var(--tt-sky-deep)"].map((v) =>
      getComputedStyle(document.documentElement).getPropertyValue(v.slice(4, -1)).trim(),
    );

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: canvas.width * (0.3 + Math.random() * 0.4),
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 9 * dpr,
      vy: (Math.random() * -11 - 3) * dpr,
      r: (4 + Math.random() * 5) * dpr,
      spin: (Math.random() - 0.5) * 0.3,
      angle: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#e9b949",
    }));

    let raf = 0;
    let life = 0;
    const tick = () => {
      life++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += 0.32 * dpr;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - life / 150);
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
      });
      if (life < 150) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active, count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
