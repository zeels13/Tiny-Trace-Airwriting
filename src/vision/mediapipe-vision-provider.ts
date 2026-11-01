/**
 * MediaPipeVisionProvider — real hand landmarks for the air-writing lesson.
 *
 * Extends CameraVisionProvider so the webcam stream and preview are created
 * once and shared: this provider never calls getUserMedia a second time.
 *
 * HandLandmarker runs in VIDEO mode with a single hand. Frames are pulled from
 * the existing <video> element inside requestAnimationFrame, skipping frames
 * the model has already seen and throttling inference below display rate.
 *
 * Pen control is pinch based: thumb tip (4) to index tip (8), normalized by
 * palm size, with hysteresis and a two-frame debounce. Samples are emitted
 * every tracked frame with `isWriting` reflecting the pinch state, so the
 * canvas commits one stroke per pinch.
 *
 * Mirroring happens exactly once in the whole pipeline: when landmarks are
 * extracted (`toHandLandmark`, x -> 1 - x), because the preview <video> is
 * CSS-mirrored. Everything downstream — landmarks, pinch geometry, the
 * fingertip pointer, the ink and the ghost guide — therefore lives in the
 * same mirrored, screen-facing coordinate space. `projectToSurface` must NOT
 * flip x again; it only undoes the preview's `object-cover` crop and the
 * canvas's drawing inset.
 */

import type {
  HandLandmarker,
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

import { DRAWING_SURFACE_PADDING } from "@/lib/drawing-surface";
import type { Point } from "@/lib/types";
import { CameraVisionProvider, type CameraProviderOptions } from "./camera-vision-provider";
import type { HandLandmark, VisionStatus } from "./types";

export interface MediaPipeProviderOptions extends CameraProviderOptions {
  /** Directory containing the locally vendored MediaPipe WASM assets. */
  wasmBasePath?: string;
  /** Locally served .task model. No remote model URL is used. */
  modelAssetPath?: string;
  /** Normalized wrist→middle-MCP span below which the hand counts as "too far". */
  minHandSpan?: number;
  /** Minimum ms between inferences; caps work below the display refresh rate. */
  minDetectionIntervalMs?: number;
}

const DEFAULT_WASM_PATH = "/mediapipe/wasm";
const DEFAULT_MODEL_PATH = "/models/hand_landmarker.task";
const INDEX_FINGER_TIP = 8;
const THUMB_TIP = 4;
const WRIST = 0;
const MIDDLE_FINGER_MCP = 9;

/**
 * Pinch pen tuning. Distances are normalized by palm size (wrist → middle
 * MCP), so they work regardless of camera distance. Separate start/release
 * ratios give hysteresis; consecutive stable frames debounce accidental
 * pinches and stray releases.
 */
const PINCH_START_RATIO = 0.32;
const PINCH_RELEASE_RATIO = 0.5;
const PINCH_START_FRAMES = 2;
const PINCH_RELEASE_FRAMES = 2;

export class MediaPipeVisionProvider extends CameraVisionProvider {
  override readonly kind = "mediapipe" as const;

  private landmarker: HandLandmarker | null = null;
  private loadingPromise: Promise<HandLandmarker> | null = null;
  private rafId: number | null = null;
  private lastVideoTime = -1;
  private lastTimestamp = 0;
  private lastInferenceAt = 0;
  private finger: Point | null = null;
  private landmarks: HandLandmark[] | null = null;
  private pinching = false;
  private pinchOnFrames = 0;
  private pinchOffFrames = 0;

  private wasmBasePath: string;
  private modelAssetPath: string;
  private minHandSpan: number;
  private minDetectionIntervalMs: number;

  constructor(options: MediaPipeProviderOptions = {}) {
    super(options);
    this.wasmBasePath = options.wasmBasePath ?? DEFAULT_WASM_PATH;
    this.modelAssetPath = options.modelAssetPath ?? DEFAULT_MODEL_PATH;
    this.minHandSpan = options.minHandSpan ?? 0.08;
    this.minDetectionIntervalMs = options.minDetectionIntervalMs ?? 32;
  }

  override async startCamera(video?: HTMLVideoElement | null): Promise<VisionStatus> {
    const status = await super.startCamera(video);
    if (status !== "ready") return status;

    this.setStatus("starting");
    let landmarker: HandLandmarker;
    try {
      landmarker = await this.ensureLandmarker();
    } catch {
      this.setStatus("unavailable");
      return this.getStatus();
    }

    // The camera (or the detector) may have been stopped while loading.
    if (!this.video || this.landmarker !== landmarker) return this.getStatus();

    this.startDetection();
    this.setStatus("no-hand");
    return this.getStatus();
  }

  override stopCamera() {
    this.stopDetection();
    this.closeLandmarker();
    this.finger = null;
    this.landmarks = null;
    this.resetGesture();
    super.stopCamera();
  }

  override getHandLandmarks(): HandLandmark[] | null {
    return this.landmarks;
  }

  override getIndexFinger(): Point | null {
    return this.finger;
  }

  override getWritingState() {
    return this.pinching;
  }

  /**
   * Ends an in-progress stroke when the camera stops or fails, so no
   * unfinished ink survives a shutdown (released hand, revoked track, error).
   */
  protected override setStatus(status: VisionStatus) {
    if (status === "idle" || status === "unavailable" || status === "permission-denied") {
      this.endStroke();
    }
    super.setStatus(status);
  }

  /** Stops the inference loop but leaves the webcam stream untouched. */
  stopDetection() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.lastVideoTime = -1;
    this.resetGesture();
  }

  /** Releases the model; the webcam stream is untouched. */
  closeLandmarker() {
    this.stopDetection();
    this.landmarker?.close();
    this.landmarker = null;
    this.loadingPromise = null;
  }

  private startDetection() {
    if (this.rafId !== null) return;
    const tick = () => {
      this.rafId = requestAnimationFrame(tick);
      this.detectFrame();
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private detectFrame() {
    const landmarker = this.landmarker;
    const video = this.video;
    if (!landmarker || !video) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    // Never hand the same video frame to the model twice.
    if (video.currentTime === this.lastVideoTime) return;

    const now = performance.now();
    if (now - this.lastInferenceAt < this.minDetectionIntervalMs) return;

    // VIDEO mode requires strictly increasing timestamps.
    const timestamp = now > this.lastTimestamp ? now : this.lastTimestamp + 1;
    this.lastTimestamp = timestamp;
    this.lastInferenceAt = now;
    this.lastVideoTime = video.currentTime;

    let result: HandLandmarkerResult;
    try {
      result = landmarker.detectForVideo(video, timestamp);
    } catch {
      // A transient WASM/frame error should not kill the loop.
      return;
    }

    this.handleResult(result);
  }

  private handleResult(result: HandLandmarkerResult) {
    const hand = result.landmarks[0];
    if (!hand || hand.length <= INDEX_FINGER_TIP) {
      this.endStroke();
      this.landmarks = null;
      this.finger = null;
      this.setStatus("no-hand");
      return;
    }

    // Mirror exactly once; the CSS preview is the only other mirror.
    this.landmarks = hand.map(toHandLandmark);

    const wrist = this.landmarks[WRIST];
    const middleMcp = this.landmarks[MIDDLE_FINGER_MCP];
    const span =
      wrist && middleMcp ? Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y) : 0;

    if (span < this.minHandSpan) {
      this.endStroke();
      this.finger = null;
      this.setStatus("too-far");
      return;
    }

    const tip = this.landmarks[INDEX_FINGER_TIP];
    const thumb = this.landmarks[THUMB_TIP];
    if (!tip || !thumb) {
      this.endStroke();
      this.finger = null;
      this.setStatus("no-hand");
      return;
    }

    // Surface-space point: already mirrored (see toHandLandmark), then mapped
    // through the object-cover crop and the canvas drawing inset.
    const point = this.video ? projectToSurface(this.video, tip) : { x: tip.x, y: tip.y };
    this.finger = point;

    const pinchDistance = Math.hypot(thumb.x - tip.x, thumb.y - tip.y);
    this.updatePinch(pinchDistance / span);

    this.setStatus("ready");
    this.emitPoint({ point, isWriting: this.pinching });
  }

  /** Hysteresis + frame debounce for the pinch pen. */
  private updatePinch(ratio: number) {
    if (this.pinching) {
      if (ratio > PINCH_RELEASE_RATIO) {
        this.pinchOffFrames += 1;
        if (this.pinchOffFrames >= PINCH_RELEASE_FRAMES) this.releasePinch();
      } else {
        this.pinchOffFrames = 0;
      }
      return;
    }

    if (ratio < PINCH_START_RATIO) {
      this.pinchOnFrames += 1;
      if (this.pinchOnFrames >= PINCH_START_FRAMES) {
        this.pinching = true;
        this.pinchOnFrames = 0;
        this.pinchOffFrames = 0;
      }
    } else {
      this.pinchOnFrames = 0;
    }
  }

  private releasePinch() {
    this.pinching = false;
    this.pinchOffFrames = 0;
  }

  /**
   * Commits an in-progress stroke when the hand is lost or out of range so the
   * next pinch starts a new stroke instead of bridging the gap.
   */
  private endStroke() {
    if (this.pinching) {
      this.pinching = false;
      if (this.finger) this.emitPoint({ point: this.finger, isWriting: false });
    }
    this.pinchOnFrames = 0;
    this.pinchOffFrames = 0;
  }

  private resetGesture() {
    this.pinching = false;
    this.pinchOnFrames = 0;
    this.pinchOffFrames = 0;
  }

  private ensureLandmarker(): Promise<HandLandmarker> {
    if (this.landmarker) return Promise.resolve(this.landmarker);
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.createLandmarker().then(
      (landmarker) => {
        this.loadingPromise = null;
        // Leave no leaked model behind if the camera stopped while loading.
        if (!this.video) {
          landmarker.close();
          return landmarker;
        }
        this.landmarker = landmarker;
        return landmarker;
      },
      (error: unknown) => {
        this.loadingPromise = null;
        throw error;
      },
    );

    return this.loadingPromise;
  }

  private async createLandmarker(): Promise<HandLandmarker> {
    // Loaded on demand so the MediaPipe bundle stays out of SSR and the
    // initial lesson payload.
    const { FilesetResolver, HandLandmarker: HandLandmarkerTask } = await import(
      "@mediapipe/tasks-vision"
    );

    const vision = await FilesetResolver.forVisionTasks(this.wasmBasePath);
    const commonOptions = {
      runningMode: "VIDEO" as const,
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };

    try {
      return await HandLandmarkerTask.createFromOptions(vision, {
        ...commonOptions,
        baseOptions: { modelAssetPath: this.modelAssetPath, delegate: "GPU" },
      });
    } catch {
      // Some devices/browsers have no usable GPU delegate.
      return await HandLandmarkerTask.createFromOptions(vision, {
        ...commonOptions,
        baseOptions: { modelAssetPath: this.modelAssetPath, delegate: "CPU" },
      });
    }
  }
}

/**
 * The single mirror in the pipeline. MediaPipe reports x in raw camera space
 * (0 = camera left); the preview is shown mirrored, so display space is
 * 1 - x. Pinch distances are unaffected because both points flip together.
 */
function toHandLandmark(landmark: NormalizedLandmark): HandLandmark {
  return {
    x: clamp01(1 - landmark.x),
    y: clamp01(landmark.y),
    z: landmark.z,
  };
}

/**
 * Converts an already-mirrored, camera-normalized landmark into the canvas
 * drawing space. Does not mirror.
 *
 * The preview fills the card with `object-cover`, so the frame is uniformly
 * scaled and centre-cropped inside the video's rendered box. The canvas covers
 * that exact same box (both fill the writing card) and insets its drawing rect
 * by DRAWING_SURFACE_PADDING. Undoing cover-crop and inset here keeps the
 * fingertip pointer, the ink and the ghost guide in one coordinate space.
 *
 * Geometry is read from the live rendered element every frame, so layout
 * changes and camera aspect-ratio changes need no hardcoded offsets.
 */
function projectToSurface(video: HTMLVideoElement, point: HandLandmark): Point {
  const rect = video.getBoundingClientRect();
  const width = rect.width || video.clientWidth;
  const height = rect.height || video.clientHeight;
  const frameWidth = video.videoWidth;
  const frameHeight = video.videoHeight;
  const innerWidth = width - DRAWING_SURFACE_PADDING * 2;
  const innerHeight = height - DRAWING_SURFACE_PADDING * 2;

  if (
    width <= 0 ||
    height <= 0 ||
    innerWidth <= 0 ||
    innerHeight <= 0 ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    return { x: clamp01(point.x), y: clamp01(point.y) };
  }

  // object-fit: cover with the default object-position (50% 50%).
  const scale = Math.max(width / frameWidth, height / frameHeight);
  const renderedWidth = frameWidth * scale;
  const renderedHeight = frameHeight * scale;
  const screenX = (width - renderedWidth) / 2 + point.x * renderedWidth;
  const screenY = (height - renderedHeight) / 2 + point.y * renderedHeight;

  return {
    x: clamp01((screenX - DRAWING_SURFACE_PADDING) / innerWidth),
    y: clamp01((screenY - DRAWING_SURFACE_PADDING) / innerHeight),
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
