import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioPlayerProps {
  previewUrl: string | null;
  isLoading: boolean;
}

const BAR_COUNT = 40;

export const AudioPlayer = ({ previewUrl, isLoading }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [playing, setPlaying] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.1));
  const [hasPlayed, setHasPlayed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);

  // Idle animation — slow sine wave when not playing
  useEffect(() => {
    if (playing) return;
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.04;
      const idleBars = Array.from({ length: BAR_COUNT }, (_, i) =>
        0.04 + 0.06 * Math.sin(t + i * 0.4) + 0.02 * Math.sin(t * 1.7 + i * 0.9)
      );
      setBars(idleBars);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // Real analyser animation when playing
  const startAnalyser = (audio: HTMLAudioElement) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyserRef.current = analyser;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const index = Math.floor(i * dataArray.length / BAR_COUNT);
        return dataArray[index] / 255;
      });
      setBars(newBars);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const handlePlay = () => {
    if (!previewUrl || !audioRef.current) return;
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (!analyserRef.current) {
      startAnalyser(audioRef.current);
    }
    audioRef.current.play();
    setPlaying(true);
    setHasPlayed(true);
  };

  const handleStop = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    handlePlay();
  };

  useEffect(() => {
    return () => {
      handleStop();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 30);
    };
    const onEnded = () => {
      setPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const timeLeft = Math.max(0, Math.floor(duration - progress));

  return (
    <div className="w-full max-w-2xl mt-8 mb-4">
      {/* Hidden audio element */}
      {previewUrl && (
        <audio ref={audioRef} src={previewUrl} crossOrigin="anonymous" preload="auto" />
      )}

      {/* Waveform display */}
      <div className="relative bg-[#0a0a0a] border border-white/5 p-6 flex flex-col gap-6">

        {/* Top label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-tertiary-container"
              animate={playing ? { opacity: [1, 0, 1] } : { opacity: 0.3 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <span className="font-mono text-[10px] tracking-widest text-white/30 uppercase">
              {isLoading ? 'FETCHING_AUDIO...' : playing ? 'TRANSMITTING_SIGNAL' : hasPlayed ? 'SIGNAL_COMPLETE' : 'SIGNAL_READY'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-white/20">
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>

        {/* Waveform bars */}
        <div className="flex items-center justify-center gap-[3px] h-24">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-[3px]"
              >
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[4px] bg-white/10 rounded-full"
                    animate={{ height: [4, 16, 4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.03 }}
                  />
                ))}
              </motion.div>
            ) : !previewUrl ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/20 font-mono text-xs tracking-widest uppercase"
              >
                NO_AUDIO_DATA_FOUND
              </motion.div>
            ) : (
              <motion.div 
                key="waveform"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-[3px]"
              >
                {bars.map((val, i) => {
                  const height = Math.max(4, val * 96);
                  const isActive = playing && val > 0.15;
                  return (
                    <motion.div
                      key={i}
                      className="w-[4px] rounded-full"
                      style={{
                        height,
                        backgroundColor: isActive
                          ? `rgba(254, 0, 0, ${0.4 + val * 0.6})`
                          : 'rgba(255,255,255,0.12)',
                      }}
                      transition={{ duration: 0.05 }}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-px bg-white/10">
          <motion.div
            className="absolute left-0 top-0 h-full bg-tertiary-container shadow-[0_0_10px_rgba(254,0,0,0.5)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {!hasPlayed ? (
            <motion.button
              onClick={handlePlay}
              disabled={isLoading || !previewUrl}
              className="flex items-center gap-4 bg-tertiary-container text-black font-display font-black text-sm tracking-widest uppercase px-12 py-4 disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
              whileHover={{ scale: 1.02, x: -2, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center gap-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                PLAY SIGNAL
              </div>
            </motion.button>
          ) : (
            <div className="flex items-center gap-4">
              {playing ? (
                <motion.button
                  onClick={handleStop}
                  className="flex items-center gap-3 border border-white/20 text-white/60 font-display font-bold text-xs tracking-widest uppercase px-8 py-3 hover:border-white/40 hover:text-white transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  CANCEL
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleReplay}
                  className="flex items-center gap-3 border border-tertiary-container/40 text-tertiary-container font-display font-bold text-xs tracking-widest uppercase px-8 py-3 hover:bg-tertiary-container hover:text-black transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  </svg>
                  REBOOT SIGNAL
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
