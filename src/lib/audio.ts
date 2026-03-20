export function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!(window as any).audioCtx) {
    ;(window as any).audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).audioCtx;
}

export function playTick() {
  const ctx = getAudioCtx();
  if (!ctx || ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(480, ctx.currentTime);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  osc.start(); osc.stop(ctx.currentTime + 0.03);
}

export function playDing() {
  const ctx = getAudioCtx();
  if (!ctx || ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  osc.start(); osc.stop(ctx.currentTime + 0.18);
}

const audioCache: Record<string, AudioBuffer> = {};

async function playAudioFile(url: string, durationSeconds: number) {
  const ctx = getAudioCtx();
  if (!ctx || ctx.state === 'suspended') return;

  if (!audioCache[url]) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioCache[url] = audioBuffer;
    } catch (e) {
      console.error('Failed to load audio', e);
      return;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = audioCache[url];
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.setValueAtTime(1, ctx.currentTime + durationSeconds - 0.2);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSeconds);
  
  source.connect(gain);
  gain.connect(ctx.destination);
  
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + durationSeconds);
}

export function playBell() {
  playAudioFile('/sounds/school-bell.mp3', 3.0);
}

export function playApplause() {
  playAudioFile('/sounds/applause.mp3', 3.0);
}

