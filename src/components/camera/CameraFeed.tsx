import type { RefObject } from "react";

import { TTButton } from "@/components/ui-tt/TTButton";
import { cn } from "@/lib/utils";
import { VISION_MESSAGES, type VisionStatus } from "@/vision";

/**
 * Live webcam preview for the writing card.
 *
 * Purely presentational: the provider owns getUserMedia and points the video
 * element at the stream. The preview is mirrored so it reads like a selfie.
 */
export function CameraFeed({
  videoRef,
  status,
  onUseDemo,
  className,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: VisionStatus;
  /** Shown when the camera is blocked or missing — never a silent fallback. */
  onUseDemo?: (() => void) | undefined;
  className?: string | undefined;
}) {
  const message = VISION_MESSAGES[status];
  const failed = status === "permission-denied" || status === "unavailable";

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <video
        ref={videoRef}
        className="h-full w-full -scale-x-100 object-cover"
        autoPlay
        muted
        playsInline
        aria-label="Live camera preview"
      />

      {status === "starting" && message && (
        <div className="absolute inset-0 grid place-items-center bg-forest-deep/70 px-6 text-center">
          <p className="font-display text-lg font-extrabold text-cream">{message.title}</p>
        </div>
      )}

      {failed && message && (
        <div className="absolute inset-0 grid place-items-center bg-forest-deep/85 px-6 text-center">
          <div>
            <p className="font-display text-2xl text-cream">{message.title}</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-cream/80">{message.hint}</p>
            {onUseDemo && (
              <TTButton variant="sun" size="sm" className="mt-5" onClick={onUseDemo}>
                Use demo mode
              </TTButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
