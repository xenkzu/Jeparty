"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerGlitch } from 'powerglitch';

interface CyberpunkPreloaderProps {
  onComplete: () => void;
  duration?: number; // default 1250ms (synced to glitch-intro.mp3 duration ~1.23s)
}

const AUDIO_SRC = '/glitch-intro.mp3';

export const CyberpunkPreloader: React.FC<CyberpunkPreloaderProps> = ({
  onComplete,
  duration = 1250,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play glitch-intro sound effect at 40% volume automatically on mount
  useEffect(() => {
    let isCancelled = false;
    const audio = new Audio(AUDIO_SRC);
    audio.volume = 0.40;
    audioRef.current = audio;

    audio.play().catch((err) => {
      console.warn('[CyberpunkPreloader] Audio autoplay note:', err);
    });

    return () => {
      isCancelled = true;
      // Delay pause check so strict-mode mount does not abort play promise
      setTimeout(() => {
        if (isCancelled && audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 300);
    };
  }, []);

  // Synchronize PowerGlitch bursts to audio peaks
  useEffect(() => {
    if (!imgRef.current) return;

    const glitch = PowerGlitch.glitch(imgRef.current, {
      playMode: 'manual',
      createContainers: true,
      hideOverflow: false,
      timing: {
        duration: 250,
        iterations: 1,
      },
      glitchTimeSpan: {
        start: 0,
        end: 1,
      },
      shake: {
        velocity: 10,
        amplitudeX: 0.025,
        amplitudeY: 0, // strict horizontal jitter
      },
      slice: {
        count: 4,
        velocity: 12,
        minHeight: 0.02,
        maxHeight: 0.1,
        hueRotate: true,
      },
      pulse: false,
    });

    // Burst 1: 0ms -> 140ms
    glitch.startGlitch();
    const t0 = setTimeout(() => {
      glitch.stopGlitch();
    }, 140);

    // Burst 2: 380ms -> 680ms
    const t1 = setTimeout(() => {
      glitch.startGlitch();
      setTimeout(() => {
        glitch.stopGlitch();
      }, 300);
    }, 380);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      glitch.stopGlitch?.();
    };
  }, []);

  // Automatic exit transition after duration completes
  useEffect(() => {
    const completeTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete();
      }, 250);
    }, duration);

    return () => {
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="cyberpunk-preloader"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            filter: 'brightness(1.5)',
            transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
          }}
          onClick={handleSkip}
          className="fixed inset-0 z-[999999] bg-[#000000] flex items-center justify-center select-none cursor-pointer overflow-hidden"
        >
          {/* Centered Small Logo with Synchronized PowerGlitch */}
          <div className="relative w-72 sm:w-80 max-w-[340px] aspect-[5/2] flex items-center justify-center">
            <img
              ref={imgRef}
              src="/Cyberpunk_Edgerunners_logo.png"
              alt="Cyberpunk Edgerunners"
              className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(252,238,10,0.3)]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CyberpunkPreloader;



