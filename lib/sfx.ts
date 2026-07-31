/**
 * Procedurally synthesize a short "pop" blip for UI feedback.
 * Uses an oscillator with a quick pitch sweep and exponential gain decay.
 */
export function playPopSound(): void {
  if (typeof window === 'undefined') return;

  const AudioContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.12);

    // Close the AudioContext after the sound finishes to free resources.
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 150);
  } catch {
    // Ignore audio errors (e.g. autoplay policies, unsupported APIs).
  }
}

/**
 * Procedurally synthesize a short "meow" for Kermit's Simon Says buttons.
 * Pitched-up sawtooth with a quick attack/decay to sound cat-like.
 */
/**
 * Simple Web Audio engine for the Dino mini-game.
 * Produces a pulsing synthwave drone whose pitch and pulse rate
 * increase with the dinosaur's running speed.
 */
export class DinoAudioEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private lfoGain: GainNode | null = null;

  start() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.osc) return; // Already playing

    this.osc = this.ctx.createOscillator();
    this.lfo = this.ctx.createOscillator();
    this.masterGain = this.ctx.createGain();
    this.lfoGain = this.ctx.createGain();

    // Retro triangle drone (softer than sawtooth)
    this.osc.type = 'triangle';
    this.osc.frequency.value = 80;

    // LFO creates rhythmic pulsing / footstep feel (sine instead of square for smooth tremolo)
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 4;

    // Tremolo: LFO modulates master volume
    this.masterGain.gain.value = 0.08;
    this.lfoGain.gain.value = 0.06;

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.masterGain.gain);

    this.osc.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.osc.start();
    this.lfo.start();
  }

  setSpeed(speed: number) {
    if (!this.ctx || !this.osc || !this.lfo) return;
    const now = this.ctx.currentTime;

    // Map speed (4 -> 12) to LFO pulse rate
    this.lfo.frequency.setTargetAtTime(speed, now, 0.1);

    // Map speed to oscillator pitch (80Hz -> 140Hz)
    const pitch = 80 + (speed - 4) * 7.5;
    this.osc.frequency.setTargetAtTime(pitch, now, 0.1);
  }

  stop() {
    if (!this.ctx) return;
    if (this.osc) {
      this.osc.stop();
      this.osc.disconnect();
      this.osc = null;
    }
    if (this.lfo) {
      this.lfo.stop();
      this.lfo.disconnect();
      this.lfo = null;
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
      this.lfoGain = null;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
  }
}

export function playMeowSound(): void {
  if (typeof window === 'undefined') return;

  const AudioContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sawtooth';
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(420, now);
    oscillator.frequency.exponentialRampToValueAtTime(760, now + 0.12);
    oscillator.frequency.exponentialRampToValueAtTime(380, now + 0.32);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.38);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 420);
  } catch {
    // Ignore audio errors (e.g. autoplay policies, unsupported APIs).
  }
}
