import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
}

const DEFAULT_METADATA: TrackMetadata = {
  title: 'I Really Want to Stay at Your House',
  artist: 'Rosa Walton & Hallie Coggins',
  album: 'Cyberpunk 2077: Radio, Vol. 2',
  coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/1b/41/2b/1b412bef-ba81-3173-6d26-41128c0f366c/780163581720.jpg/600x600bb.jpg',
  audioUrl: '/i-really-want-to-stay-at-your-house.mp3',
};

export const CyberpunkFloatingPlayer: React.FC = () => {
  const [metadata] = useState<TrackMetadata>(DEFAULT_METADATA);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jeparty_bgm_volume');
      return saved !== null ? parseFloat(saved) : 0.60;
    } catch {
      return 0.60;
    }
  });
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
    audio.loop = isLooping;
    audio.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn('[FloatingPlayer] Autoplay waiting for user gesture:', err);
      });
  };

  // Auto-play attempt on mount and global interaction listener
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
    audio.loop = isLooping;

    // Attempt playback immediately
    playAudio();

    // Universal unlock: on first interaction anywhere in the window
    const handleGlobalInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        playAudio();
      }
    };

    window.addEventListener('click', handleGlobalInteraction);
    window.addEventListener('pointerdown', handleGlobalInteraction);
    window.addEventListener('keydown', handleGlobalInteraction);

    return () => {
      window.removeEventListener('click', handleGlobalInteraction);
      window.removeEventListener('pointerdown', handleGlobalInteraction);
      window.removeEventListener('keydown', handleGlobalInteraction);
    };
  }, [volume, isMuted, isLooping]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = isMuted ? 0 : volume;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('[FloatingPlayer] Audio play interrupted:', err);
      });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : val;
    }
    try {
      localStorage.setItem('jeparty_bgm_volume', val.toString());
    } catch {}
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume;
      }
      return next;
    });
  };

  const toggleLoop = () => {
    setIsLooping(prev => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.loop = next;
      }
      return next;
    });
  };

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <>
      {/* Hidden native audio element for background soundtrack */}
      <audio
        ref={audioRef}
        src={metadata.audioUrl}
        preload="auto"
        autoPlay
        playsInline
        loop={isLooping}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
          }
        }}
        onCanPlay={() => {
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Persistent Floating Cyberpunk Music Player Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-[66px] sm:bottom-6 sm:right-[74px] z-50 select-none pointer-events-auto"
      >
        <div className="relative bg-[#0a0a0c]/90 backdrop-blur-md border border-[#222222] rounded-xl p-2.5 px-3 sm:px-3.5 flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.8)] min-w-[280px] sm:min-w-[360px] max-w-[90vw]">
          
          {/* Left: Normal Square Album Art / CD Cover */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-[#141414] border border-white/10 flex-shrink-0">
            <img
              src={metadata.coverUrl}
              alt={metadata.title}
              className="w-full h-full object-cover select-none pointer-events-none"
              loading="eager"
            />
          </div>

          {/* Center-Left: Song Title & Artist */}
          <div className="flex flex-col min-w-0 flex-1 pr-1">
            <span 
              className="font-display font-light text-white text-xs sm:text-sm tracking-wide truncate block leading-tight"
              title={metadata.title}
            >
              {metadata.title}
            </span>
            <span 
              className="font-mono font-light text-[#888888] text-[10px] sm:text-xs tracking-wider truncate block leading-tight mt-1"
              title={metadata.artist}
            >
              {metadata.artist}
            </span>
          </div>

          {/* Right Controls Area: Volume + Play/Pause + Repeat (No Green, No Hover Zoom) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            
            {/* Volume Icon & Minimal Slider */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={toggleMute}
                className="text-white/50 hover:text-white transition-colors p-1 focus:outline-none"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label="Volume control"
              >
                {effectiveVolume === 0 ? (
                  /* Muted Speaker */
                  <svg className="w-3.5 h-3.5 text-[#ff0055]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                ) : (
                  /* Active Speaker */
                  <svg className="w-3.5 h-3.5 text-white/70 hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  </svg>
                )}
              </button>

              {/* Minimal Acid-Yellow Volume Slider */}
              <div className="relative flex items-center w-12 sm:w-14 h-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effectiveVolume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-[#1f1f1f] rounded-full appearance-none cursor-pointer accent-[#fcee0a] transition-all"
                  style={{
                    background: `linear-gradient(to right, #fcee0a ${effectiveVolume * 100}%, #1f1f1f ${effectiveVolume * 100}%)`,
                  }}
                  title={`Volume: ${Math.round(effectiveVolume * 100)}%`}
                />
              </div>
            </div>

            {/* Play / Pause Circular Button */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 bg-white hover:bg-[#fcee0a] text-black rounded-full flex items-center justify-center transition-colors focus:outline-none flex-shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
            >
              {isPlaying ? (
                /* Pause Icon */
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                /* Play Icon */
                <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Repeat / Loop Toggle Button */}
            <button
              onClick={toggleLoop}
              className={`p-1 rounded-md transition-colors focus:outline-none flex items-center justify-center ${
                isLooping
                  ? 'text-[#fcee0a]'
                  : 'text-white/30 hover:text-white/60'
              }`}
              title={isLooping ? 'Loop: ON' : 'Loop: OFF'}
              aria-label="Toggle loop"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default CyberpunkFloatingPlayer;



