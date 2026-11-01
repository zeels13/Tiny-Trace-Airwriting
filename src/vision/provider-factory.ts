import type { Stroke } from "@/lib/types";
import { CameraVisionProvider } from "./camera-vision-provider";
import { MediaPipeVisionProvider } from "./mediapipe-vision-provider";
import { MockVisionProvider } from "./mock-vision-provider";
import type { VisionProvider, VisionProviderKind } from "./types";

/**
 * The UI never constructs a concrete provider itself — it asks this factory.
 * - "mock"      explicit demo mode (scripted fingertip)
 * - "webcam"    live camera preview only, no tracking
 * - "mediapipe" live hand landmarks driving the canvas
 */
export type { VisionProviderKind };

export interface VisionProviderConfig {
  /** Reference strokes the demo path follows (normalized space). */
  strokes: Stroke[];
  /** Demo-only: how sloppy the simulated hand is. */
  wobble?: number;
  samplesPerStroke?: number;
  interval?: number;
  /** Demo-only: fired after each scripted stroke completes. */
  onStrokeEnd?: (index: number) => void;
  /** Demo-only: fired when the scripted path finishes. */
  onFinished?: () => void;
}

export interface CreateVisionProviderOptions extends VisionProviderConfig {
  kind?: VisionProviderKind;
}

export function createVisionProvider({
  kind = "mock",
  ...config
}: CreateVisionProviderOptions): VisionProvider {
  switch (kind) {
    case "mock":
      return new MockVisionProvider({ ...config });
    case "webcam":
      return new CameraVisionProvider();
    case "mediapipe":
      return new MediaPipeVisionProvider();
  }
}
