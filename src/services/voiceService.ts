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
  startPoint: "Start at the glowing dot.",
  followTrail: "Follow the trail.",
  greatJob: "Great job!",
  tryAgain: "Try that stroke again.",
  nextStroke: (n: number) => `Now stroke ${n}.`,
};
