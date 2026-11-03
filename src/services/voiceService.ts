/**
 * VoiceGuideService — browser-safe voice guidance.
 *
 * Uses the Web Speech API when it exists and the setting is on; otherwise it
 * silently no-ops and the caption UI carries the message. No audio files, no
 * autoplay loops. A backend TTS implementation can replace `speak()` later.
 */

export interface VoiceGuideOptions {
  enabled: boolean;
}

class VoiceGuideService {
  private enabled = true;
  private lastPhrase = "";

  configure(options: VoiceGuideOptions) {
    this.enabled = options.enabled;
    if (!options.enabled) this.cancel();
  }

  get supported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /** Speaks once; repeated identical phrases are ignored to avoid nagging. */
  speak(phrase: string) {
    if (!this.enabled || !this.supported) return;
    if (phrase === this.lastPhrase) return;
    this.lastPhrase = phrase;
    try {
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.95;
      utterance.pitch = 1.15;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      /* speech unavailable — captions still show the phrase */
    }
  }

  cancel() {
    this.lastPhrase = "";
    if (this.supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }
}

export const voiceService = new VoiceGuideService();

export const VOICE_LINES = {
  lessonStart: (character: string) => `Let's write ${character}.`,
  startPoint: (direction = "follow the trail") => `Start at the glowing dot, then ${direction}.`,
  followTrail: "Follow the trail.",
  lineComplete: (n: number, nextDirection: string) =>
    `Great, line ${n} is done. Now start at the glowing dot and ${nextDirection}.`,
  allLinesComplete: "You finished every line. Tap I'm done to see your accuracy.",
  result: (accuracy: number, message: string) => `Your accuracy is ${accuracy} percent. ${message}`,
};
