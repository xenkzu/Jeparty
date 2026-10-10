/**
 * Audio Preloader & Playback Engine for Cyberpunk Edgerunners Intro & Sfx
 * Pre-caches audio buffers in memory with Web Audio API and pre-warmed HTML5 Audio.
 */

let audioCtx: AudioContext | null = null;
let glitchAudioBuffer: AudioBuffer | null = null;
let glitchPreloadPromise: Promise<AudioBuffer | null> | null = null;
let preloadedAudio: HTMLAudioElement | null = null;

export function getAudioContext(): AudioContext | null {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Pre-warms both HTML5 Audio element and Web Audio API buffer immediately
 */
export function preloadGlitchAudio(): Promise<AudioBuffer | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  // Pre-warm HTML5 Audio element with instant load
  if (!preloadedAudio) {
    try {
      preloadedAudio = new Audio('/glitch-intro.mp3');
      preloadedAudio.preload = 'auto';
      preloadedAudio.load();
    } catch {}
  }

  if (glitchAudioBuffer) return Promise.resolve(glitchAudioBuffer);
  if (glitchPreloadPromise) return glitchPreloadPromise;

  glitchPreloadPromise = (async () => {
    try {
      const res = await fetch('/glitch-intro.mp3');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const ctx = getAudioContext();
      if (ctx) {
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        glitchAudioBuffer = decoded;
        return decoded;
      }
    } catch (err) {
      console.warn('[AudioPreloader] Web Audio buffer decode note:', err);
    }
    return null;
  })();

  return glitchPreloadPromise;
}

// Automatically initiate preload on module evaluation
if (typeof window !== 'undefined') {
  preloadGlitchAudio();
}

// Recommended subtle glitch SFX volume (3.5% of max to prevent harsh white-noise spikes)
export const GLITCH_SFX_VOLUME = 0.035;

/**
 * Play glitch intro sound effect once.
 * Default volume set to GLITCH_SFX_VOLUME (subtle, non-intrusive level).
 */
export async function playGlitchIntro(volume = GLITCH_SFX_VOLUME): Promise<{
  success: boolean;
  duration: number;
}> {
  const ctx = getAudioContext();

  // Try resuming Web Audio context if available
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Autoplay blocked resume
    }
  }

  // 1. Try Web Audio API if running (zero latency)
  if (ctx && ctx.state === 'running') {
    let buffer = glitchAudioBuffer;
    if (!buffer) {
      buffer = await preloadGlitchAudio();
    }
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        return {
          success: true,
          duration: buffer.duration || 1.25,
        };
      } catch (err) {
        console.warn('[AudioPreloader] Web Audio source.start error:', err);
      }
    }
  }

  // 2. Play through preloaded HTML5 Audio element
  try {
    const audio = preloadedAudio || new Audio('/glitch-intro.mp3');
    audio.volume = volume;
    audio.currentTime = 0;
    await audio.play();
    return {
      success: true,
      duration: audio.duration || 1.25,
    };
  } catch (err) {
    console.warn('[AudioPreloader] HTML5 Audio autoplay note:', err);
    return {
      success: false,
      duration: 1.25,
    };
  }
}

/**
 * Play glitch intro sound effect repeatedly in a seamless loop.
 * Default volume set to GLITCH_SFX_VOLUME.
 * Returns a stop controller and the loop period duration.
 */
export async function playLoopingGlitchIntro(volume = GLITCH_SFX_VOLUME): Promise<{
  stop: () => void;
  duration: number;
}> {
  const ctx = getAudioContext();
  let stopFn = () => {};
  let audioDuration = 1.25;

  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {}
  }

  if (ctx && ctx.state === 'running') {
    let buffer = glitchAudioBuffer;
    if (!buffer) {
      buffer = await preloadGlitchAudio();
    }
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);

        audioDuration = buffer.duration || 1.25;
        let isStopped = false;
        stopFn = () => {
          if (!isStopped) {
            isStopped = true;
            try {
              source.stop();
              source.disconnect();
            } catch {}
          }
        };

        return { stop: stopFn, duration: audioDuration };
      } catch (err) {
        console.warn('[AudioPreloader] Web Audio looping error:', err);
      }
    }
  }

  // HTML5 Audio fallback with loop enabled
  try {
    const audio = new Audio('/glitch-intro.mp3');
    audio.volume = volume;
    audio.loop = true;
    await audio.play();
    audioDuration = audio.duration || 1.25;

    let isStopped = false;
    stopFn = () => {
      if (!isStopped) {
        isStopped = true;
        audio.pause();
        audio.currentTime = 0;
      }
    };
    return { stop: stopFn, duration: audioDuration };
  } catch (err) {
    console.warn('[AudioPreloader] Looping audio fallback error:', err);
    return { stop: () => {}, duration: 1.25 };
  }
}
