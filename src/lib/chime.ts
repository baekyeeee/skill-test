let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}

/**
 * Built-in two-note chime synthesized with Web Audio (no asset to load).
 * Rejects if the browser blocks audio, e.g. before any user interaction;
 * callers treat that as "no sound", never as a timer error.
 */
export async function playChime(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  await ctx.resume();

  const notes = [
    { frequency: 880, offset: 0 },
    { frequency: 1320, offset: 0.18 },
  ];
  for (const { frequency, offset } of notes) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const startAt = ctx.currentTime + offset;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.25, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.6);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.65);
  }
}
