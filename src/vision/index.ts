export type {
  VisionProvider,
  VisionSample,
  VisionStatus,
  HandLandmark,
  ScriptedPlayback,
  VisionProviderKind,
} from "./types";
export { hasScriptedPlayback } from "./types";
export { MockVisionProvider } from "./mock-vision-provider";
export type { MockOptions } from "./mock-vision-provider";
export { CameraVisionProvider } from "./camera-vision-provider";
export type { CameraProviderOptions } from "./camera-vision-provider";
export { MediaPipeVisionProvider } from "./mediapipe-vision-provider";
export type { MediaPipeProviderOptions } from "./mediapipe-vision-provider";
export { createVisionProvider } from "./provider-factory";
export type { CreateVisionProviderOptions, VisionProviderConfig } from "./provider-factory";

/**
 * Child-facing copy for every vision state. Technical errors never reach the
 * lesson screen — the lion speaks instead.
 */
export const VISION_MESSAGES: Record<string, { title: string; hint: string }> = {
  idle: { title: "Ready when you are", hint: "Press the big button to begin." },
  starting: { title: "Getting ready…", hint: "One moment." },
  ready: { title: "I can see you!", hint: "Follow the trail with your finger." },
  "no-hand": { title: "I can't see your hand yet.", hint: "Hold your hand up in front of you." },
  "too-far": { title: "You're a little far away.", hint: "Move a bit closer." },
  "permission-denied": { title: "I need to use the camera.", hint: "Ask a grown-up to turn the camera on." },
  unavailable: { title: "No camera here yet.", hint: "You can still try the guided demo." },
};
