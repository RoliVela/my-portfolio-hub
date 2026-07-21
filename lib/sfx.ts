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
