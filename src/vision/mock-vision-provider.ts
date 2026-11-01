/**
 * MockVisionProvider — DEMO ONLY.
 *
 * This is not hand tracking and contains no computer vision. It replays a
 * scripted path (the lesson's own reference strokes, with human-like wobble)
 * so the interface can be demonstrated before MediaPipe is integrated.
 *
 * Delete this file, or swap the provider registration, once
 * MediaPipeVisionProvider exists. Nothing else needs to change.
 */

import type { Point, Stroke } from "@/lib/types";
import { resample } from "@/lib/geometry";
import type {
  HandLandmark,
  ScriptedPlayback,
  VisionProvider,
  VisionSample,
  VisionStatus,
} from "./types";

export interface MockOptions {
  /** Reference strokes to follow, in normalized space. */
  strokes: Stroke[];
  /** How sloppy the simulated hand is: 0 = exact, 1 = very wobbly. */
  wobble?: number;
  /** Samples per stroke. */
  samplesPerStroke?: number;
  /** Milliseconds between samples. */
  interval?: number;
  onStrokeEnd?: (index: number) => void;
  onFinished?: () => void;
}

export class MockVisionProvider implements VisionProvider, ScriptedPlayback {
  readonly kind = "mock" as const;

  private status: VisionStatus = "idle";
  private pointListeners = new Set<(s: VisionSample) => void>();
  private statusListeners = new Set<(s: VisionStatus) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private finger: Point | null = null;
  private writing = false;
  private opts: MockOptions;

  constructor(opts: MockOptions) {
    this.opts = opts;
  }

  setOptions(opts: MockOptions) {
    this.opts = opts;
  }

  async startCamera(): Promise<VisionStatus> {
    this.setStatus("starting");
    await new Promise((r) => setTimeout(r, 260));
    this.setStatus("ready");
    return this.status;
  }

  stopCamera() {
    this.stopPlayback();
    this.finger = null;
    this.writing = false;
    this.setStatus("idle");
  }

  getStatus() {
    return this.status;
  }

  /** The mock has no landmarks — it only simulates one fingertip. */
  getHandLandmarks(): HandLandmark[] | null {
    return null;
  }

  getIndexFinger() {
    return this.finger;
  }

  getWritingState() {
    return this.writing;
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

  /** Starts replaying the scripted path. */
  play() {
    this.stopPlayback();
    const {
      strokes,
      wobble = 0.35,
      samplesPerStroke = 46,
      interval = 22,
    } = this.opts;

    const script: { point: Point; strokeIndex: number; last: boolean }[] = [];
    strokes.forEach((s, si) => {
      const pts = resample(s.points, samplesPerStroke);
      pts.forEach((p, i) => {
        const amp = 0.014 * wobble;
        const drift = Math.sin((i / samplesPerStroke) * Math.PI * 3 + si) * amp;
        script.push({
          point: {
            x: clamp01(p.x + drift + (Math.random() - 0.5) * amp),
            y: clamp01(p.y + drift * 0.7 + (Math.random() - 0.5) * amp),
          },
          strokeIndex: si,
          last: i === pts.length - 1,
        });
      });
    });

    let i = 0;
    this.setStatus("ready");
    this.timer = setInterval(() => {
      const frame = script[i];
      if (!frame) {
        this.writing = false;
        this.emit({ point: this.finger ?? { x: 0.5, y: 0.5 }, isWriting: false });
        this.stopPlayback();
        this.opts.onFinished?.();
        return;
      }
      this.finger = { ...frame.point, timestamp: performance.now() };
      this.writing = true;
      this.emit({ point: this.finger, isWriting: true });
      if (frame.last) {
        this.writing = false;
        this.emit({ point: this.finger, isWriting: false });
        this.opts.onStrokeEnd?.(frame.strokeIndex);
      }
      i++;
    }, interval);
  }

  stopPlayback() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private emit(sample: VisionSample) {
    this.pointListeners.forEach((l) => l(sample));
  }

  private setStatus(status: VisionStatus) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status));
  }
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
