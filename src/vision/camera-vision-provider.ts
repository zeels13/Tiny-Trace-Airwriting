/**
 * CameraVisionProvider — live webcam plumbing only.
 *
 * It owns the MediaStream lifecycle and the preview element, and reports the
 * existing VisionStatus vocabulary. It does NOT emit points itself: hand
 * landmarks, index-finger tracking and pinch detection live in
 * MediaPipeVisionProvider, which extends this class and reuses the stream.
 *
 * getUserMedia is only called from startCamera(), which the lesson screen
 * invokes on an explicit Start click — never on page load.
 */

import type { Point } from "@/lib/types";
import type {
  HandLandmark,
  VisionProvider,
  VisionProviderKind,
  VisionSample,
  VisionStatus,
} from "./types";

export interface CameraProviderOptions {
  /** Override the default user-facing video constraints. */
  constraints?: MediaStreamConstraints;
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: "user",
    width: { ideal: 960 },
    height: { ideal: 720 },
  },
};

export class CameraVisionProvider implements VisionProvider {
  readonly kind: VisionProviderKind = "webcam";

  protected status: VisionStatus = "idle";
  private stream: MediaStream | null = null;
  /** Shared with subclasses so the detector reuses this exact stream. */
  protected video: HTMLVideoElement | null = null;
  protected pointListeners = new Set<(s: VisionSample) => void>();
  private statusListeners = new Set<(s: VisionStatus) => void>();
  /** Guards against a permission prompt resolving after stop/unmount. */
  private requestId = 0;
  private constraints: MediaStreamConstraints;

  constructor(options: CameraProviderOptions = {}) {
    this.constraints = options.constraints ?? DEFAULT_CONSTRAINTS;
  }

  async startCamera(video?: HTMLVideoElement | null): Promise<VisionStatus> {
    if (video !== undefined) this.video = video;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.setStatus("unavailable");
      return this.status;
    }

    const request = ++this.requestId;
    this.setStatus("starting");
    this.releaseStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      if (request !== this.requestId) {
        // Stopped or superseded while the user was deciding.
        stream.getTracks().forEach((track) => track.stop());
        return this.status;
      }

      this.stream = stream;
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (this.stream === stream) {
            this.releaseStream();
            this.setStatus("unavailable");
          }
        });
      });

      const el = this.video;
      if (el) {
        el.srcObject = stream;
        el.muted = true;
        el.playsInline = true;
        try {
          await el.play();
        } catch {
          // Autoplay can be blocked; the muted + playsInline preview retries on
          // the next user gesture and the stream stays live either way.
        }
      }
      this.setStatus("ready");
    } catch (error) {
      if (request !== this.requestId) return this.status;
      this.releaseStream();
      this.setStatus(cameraErrorToStatus(error));
    }

    return this.status;
  }

  stopCamera() {
    this.requestId++;
    this.releaseStream();
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
    this.video = null;
    this.setStatus("idle");
  }

  getStatus() {
    return this.status;
  }

  /** Landmarks are supplied by the MediaPipe subclass only. */
  getHandLandmarks(): HandLandmark[] | null {
    return null;
  }

  getIndexFinger(): Point | null {
    return null;
  }

  getWritingState() {
    return false;
  }

  subscribeToPoints(listener: (sample: VisionSample) => void) {
    this.pointListeners.add(listener);
    return () => {
      this.pointListeners.delete(listener);
    };
  }

  subscribeToStatus(listener: (status: VisionStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Stops every track so the camera indicator turns off. */
  private releaseStream() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  /** Fans a sample out to subscribers (used by tracking subclasses). */
  protected emitPoint(sample: VisionSample) {
    this.pointListeners.forEach((listener) => listener(sample));
  }

  protected setStatus(status: VisionStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }
}

/** Maps getUserMedia failures onto the child-facing status vocabulary. */
function cameraErrorToStatus(error: unknown): VisionStatus {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? (error as { name?: unknown }).name
      : undefined;

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "permission-denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
    case "TypeError":
      return "unavailable";
    default:
      return "unavailable";
  }
}
