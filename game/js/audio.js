// WebAudio tones for Night Courier, generated in code — no audio files.
// Soft footsteps, an alert sting, a pickup blip and a success chime.
// The context is created on the first user gesture; M toggles mute.
export const AudioSys = {
  ctx: null,
  muted: false,

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  // One short oscillator note with a fast decay envelope.
  tone(freq, duration, type, gainValue, when = 0) {
    if (this.muted || !this.ctx) return;
    try {
      const start = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    } catch {
      // Audio is decoration; a failure must never break the game.
    }
  },

  // Quiet low thud, alternate feet get a slightly different pitch.
  footstep(alternate) {
    this.tone(alternate ? 82 : 68, 0.09, 'triangle', 0.05);
  },

  // Two rising notes when a guard's meter crosses into suspicion.
  alertSting() {
    this.tone(392, 0.16, 'square', 0.045);
    this.tone(523, 0.22, 'square', 0.045, 0.11);
  },

  // Full-meter alarm: a harsh descending pair.
  alarmSting() {
    this.tone(660, 0.18, 'sawtooth', 0.06);
    this.tone(440, 0.3, 'sawtooth', 0.06, 0.14);
  },

  // Bright blip when the package is grabbed.
  pickup() {
    this.tone(880, 0.12, 'sine', 0.07);
    this.tone(1318, 0.16, 'sine', 0.05, 0.07);
  },

  // Little arpeggio when a level is cleared.
  successChime() {
    [523, 659, 784, 1046].forEach((freq, i) => this.tone(freq, 0.22, 'sine', 0.06, i * 0.09));
  },
};
