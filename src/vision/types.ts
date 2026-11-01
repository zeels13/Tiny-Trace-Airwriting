import type { Point } from "@/lib/types";

/**
 * VisionProvider is the single boundary between the UI and hand tracking.
 *
 * Implementations:
 *  - MockVisionProvider      (demo only — a scripted path player)
 *  - CameraVisionProvider    (shipped now — live webcam preview, no tracking yet)
 *  - MediaPipeVisionProvider (live webcam hand landmarks + pinch pen)
 *
 * Nothing in the UI may assume which one it is talking to, and the mock must
 * never be presented to the user as real hand tracking.
 */

export type VisionStatus =
  | "idle"
  | "starting"
  | "ready"
  | "no-hand"
  | "too-far"
  | "permission-denied"
  | "unavailable";

export interface HandLandmark extends Point {
  /** normalized depth, if the provider supplies it */
  z?: number | undefined;
}

export interface VisionSample {
  /** Index fingertip in normalized 0..1 space. */
  point: Point;
  /** True while the child is intentionally drawing. */
  isWriting: boolean;
}

export type VisionProviderKind = "mock" | "webcam" | "mediapipe";

export interface VisionProvider {
  readonly kind: VisionProviderKind;
  startCamera(video?: HTMLVideoElement | null): Promise<VisionStatus>;
  stopCamera(): void;
  getStatus(): VisionStatus;
  getHandLandmarks(): HandLandmark[] | null;
  getIndexFinger(): Point | null;
  getWritingState(): boolean;
  /** Returns an unsubscribe function. */
  subscribeToPoints(listener: (sample: VisionSample) => void): () => void;
  subscribeToStatus(listener: (status: VisionStatus) => void): () => void;
}

/**
 * Optional capability for providers that replay a scripted path (demo only).
 * Generic vision consumers must use `hasScriptedPlayback` before calling it,
 * so real camera providers never need to implement these methods.
 */
export interface ScriptedPlayback {
  play(): void;
  stopPlayback(): void;
}

export function hasScriptedPlayback(
  provider: VisionProvider,
): provider is VisionProvider & ScriptedPlayback {
  const candidate = provider as Partial<ScriptedPlayback>;
  return typeof candidate.play === "function" && typeof candidate.stopPlayback === "function";
}
