"use client";

import { useState, useEffect, useRef } from 'react';

// Component-specific styles with keyframes
const componentStyles = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes soundBar {
    0%, 100% { height: 4px; }
    50% { height: 18px; }
  }
`;

// Responsive Image component compatible with both Vite / React and Next.js
const ImageComponent = ({
  src,
  alt,
  width,
  height,
  className,
  onLoad,
  onError,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  unoptimized?: boolean;
}) => (
  <img
    src={src}
    alt={alt}
    width={width}
    height={height}
    className={className}
    onLoad={onLoad}
    onError={onError}
  />
);

export interface MusicArtworkProps {
  artist: string;
  music: string;
  albumArt: string;
  isSong: boolean;
  audioUrl?: string | null; // Direct preview audio stream URL
  isLoading?: boolean;
  showTitle?: boolean; // Set to false to avoid revealing song/artist during trivia questions
  isPlaying?: boolean; // Controlled playback state
  onPlayPause?: () => void; // Controlled playback toggle
}

export default function MusicArtwork({
  artist,
  music,
  albumArt,
  isSong,
  audioUrl,
  isLoading = false,
  showTitle = false,
  isPlaying: externalIsPlaying,
  onPlayPause: externalOnPlayPause,
}: MusicArtworkProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);

  const vinylRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;

  // Calculate spin duration based on type: songs (0.75 rev/sec) vs albums (0.55 rev/sec)
  const spinDuration = isSong ? 1 / 0.75 : 1 / 0.55;

  // Set up audio instance when audioUrl changes
  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setInternalIsPlaying(false);
      setProgress(0);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 30);
    };

    const handleEnded = () => {
      setInternalIsPlaying(false);
      setProgress(0);
      // Capture vinyl position when finished
      if (vinylRef.current) {
        const computedStyle = window.getComputedStyle(vinylRef.current);
        const transform = computedStyle.transform;
        if (transform && transform !== 'none') {
          const matrix = new DOMMatrix(transform);
          const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
          setRotation(angle < 0 ? angle + 360 : angle);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Synchronize controlled isPlaying prop if provided
  useEffect(() => {
    if (externalIsPlaying === undefined || !audioRef.current) return;
    if (externalIsPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [externalIsPlaying]);

  const handlePlayPause = () => {
    if (externalOnPlayPause) {
      externalOnPlayPause();
      return;
    }

    const willPlay = !internalIsPlaying;

    if (audioRef.current) {
      if (willPlay) {
        audioRef.current.play().catch(err => {
          console.warn('[MusicArtwork] Audio play error:', err);
        });
        startTimeRef.current = Date.now();
      } else {
        audioRef.current.pause();
        // Pause: capture current vinyl rotation
        if (vinylRef.current) {
          const computedStyle = window.getComputedStyle(vinylRef.current);
          const transform = computedStyle.transform;
          if (transform && transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            setRotation(angle < 0 ? angle + 360 : angle);
          }
        }
      }
    } else {
      // No audio element: visual toggle only
      if (!willPlay && vinylRef.current) {
        const computedStyle = window.getComputedStyle(vinylRef.current);
        const transform = computedStyle.transform;
        if (transform && transform !== 'none') {
          const matrix = new DOMMatrix(transform);
          const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
          setRotation(angle < 0 ? angle + 360 : angle);
        }
      }
    }

    setInternalIsPlaying(willPlay);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        const tooltipWidth = 300;
        const tooltipHeight = 60;
        const offset = 20;

        let x = e.clientX + offset;
        let y = e.clientY - tooltipHeight - 10;

        if (x + tooltipWidth > window.innerWidth) {
          x = e.clientX - tooltipWidth - offset;
        }

        if (y < 0) {
          y = e.clientY + offset;
        }

        if (y + tooltipHeight > window.innerHeight) {
          y = e.clientY - tooltipHeight - offset;
        }

        setMousePosition({ x, y });
      });
    };

    if (isHovered) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered]);

  if (isLoading) {
    return (
      <div className="relative">
        <div className="relative group">
          <div className="w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-neutral-900 border border-white/10 rounded-lg animate-pulse flex items-center justify-center font-mono text-xs text-white/30 tracking-widest">
            LOADING ARTWORK...
          </div>
        </div>
      </div>
    );
  }

  const showVinylFull = isHovered || isPlaying;

  return (
    <div className="relative select-none">
      {/* Component-specific styles */}
      <style>{componentStyles}</style>

      {/* Enhanced Tooltip that follows cursor - Desktop only (only shown if showTitle is enabled) */}
      {isHovered && showTitle && (
        <div
          className="fixed z-50 pointer-events-none hidden sm:block"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            transform: 'translateZ(0)',
          }}
        >
          <div className="bg-neutral-900/95 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-2xl border border-neutral-700/60 animate-in fade-in zoom-in-95 duration-200">
            <span className="font-bold text-[#fcee0a]">{artist}</span> &nbsp;•&nbsp; <span>{music}</span>
          </div>
        </div>
      )}

      {/* Main container */}
      <div className="relative group">
        {/* Vinyl record: brighter, with grooves visible and smooth slide */}
        <div
          className={`absolute -left-16 sm:-left-24 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
            showVinylFull 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-85 translate-x-10 sm:translate-x-14'
          }`}
        >
          <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80">
            <div
              ref={vinylRef}
              className="w-full h-full relative"
              style={{
                transform: isPlaying ? undefined : `rotate(${rotation}deg)`,
                animation: isPlaying ? `spin ${spinDuration}s linear infinite` : 'none',
                animationDelay: isPlaying ? `${-rotation / (360 / spinDuration)}s` : undefined,
              }}
            >
              {/* Brighter vinyl record with custom filter enhancement */}
              <ImageComponent
                src="https://cdn.21st.dev/assets/mirror/b0/b0288bf1747bf704d2e3a44834fdcca14958fba916c9c6ca35136902babf739e.png"
                alt="Vinyl Record"
                width={80}
                height={80}
                className="w-full h-full object-contain filter brightness-[1.65] contrast-[1.2] drop-shadow-[0_0_28px_rgba(255,255,255,0.25)]"
              />
              
              {/* Radial gloss reflection to make grooves pop */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none opacity-40 mix-blend-screen"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 55%, transparent 70%)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Album artwork sleeve */}
        <div
          className="relative overflow-hidden rounded-lg shadow-2xl transition-all duration-300 ease-out hover:scale-105 hover:shadow-3xl cursor-pointer w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 border-2 border-white/15 bg-black"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handlePlayPause}
        >
          <ImageComponent
            src={albumArt}
            alt={showTitle ? `${music} Cover` : 'Album Clue Cover'}
            width={320}
            height={320}
            className={`w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-105 ${
              !imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />

          {/* Loading state overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center text-xs text-white/40 font-mono tracking-widest">
              LOADING COVER...
            </div>
          )}

          {/* Center Play/Pause button */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
              isHovered || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_0_24px_rgba(0,0,0,0.8)] transition-transform duration-200 group-hover:scale-110">
              {isPlaying ? (
                /* Animated equalizer waves when playing */
                <div className="flex items-center gap-1 h-5">
                  <span className="w-1 bg-[#00f0ff] rounded-full animate-[soundBar_0.8s_ease-in-out_infinite]" />
                  <span className="w-1 bg-[#00f0ff] rounded-full animate-[soundBar_0.8s_ease-in-out_infinite_0.2s]" />
                  <span className="w-1 bg-[#00f0ff] rounded-full animate-[soundBar_0.8s_ease-in-out_infinite_0.4s]" />
                  <span className="w-1 bg-[#00f0ff] rounded-full animate-[soundBar_0.8s_ease-in-out_infinite_0.1s]" />
                </div>
              ) : (
                /* Play triangle */
                <div className="w-0 h-0 border-l-[14px] border-l-[#fcee0a] border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent ml-1 drop-shadow-[0_0_8px_rgba(252,238,10,0.8)]" />
              )}
            </div>
          </div>

          {/* Bottom badge / status pill */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20">
                {isPlaying ? (
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-2.5 bg-[#00f0ff] rounded"></div>
                    <div className="w-0.5 h-2.5 bg-[#00f0ff] rounded"></div>
                  </div>
                ) : (
                  <div className="w-0 h-0 border-l-[6px] border-l-[#fcee0a] border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                )}
              </div>
              <div className="text-white text-[10px] font-mono tracking-wider whitespace-nowrap bg-black/70 backdrop-blur-sm px-2 py-1 rounded border border-white/10 uppercase">
                {showTitle ? (
                  <span>
                    <strong className="text-[#fcee0a]">{artist}</strong> • {music}
                  </span>
                ) : isPlaying ? (
                  <span className="text-[#00f0ff] font-bold">PLAYING AUDIO // CLICK TO PAUSE</span>
                ) : (
                  <span className="text-white/80">CLICK TO PLAY AUDIO</span>
                )}
              </div>
            </div>
          </div>

          {/* Audio progress bar at bottom edge */}
          {audioUrl && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/80 overflow-hidden pointer-events-none">
              <div
                className="h-full bg-gradient-to-r from-[#00f0ff] to-[#fcee0a] transition-all duration-150"
                style={{ width: `${(progress / Math.max(duration, 1)) * 100}%` }}
              />
            </div>
          )}

          {/* Hover overlay sheen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
