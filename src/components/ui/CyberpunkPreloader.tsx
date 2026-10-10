"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerGlitch } from 'powerglitch';
import { playGlitchIntro, GLITCH_SFX_VOLUME } from '../../utils/audioPreloader';

interface CyberpunkPreloaderProps {
  onComplete: () => void;
  duration?: number; // default 1250ms (synced to glitch-intro.mp3 duration ~1.23s)
}

export const CyberpunkPreloader: React.FC<CyberpunkPreloaderProps> = ({
  onComplete,
  duration = 1250,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const glitchInstanceRef = useRef<any>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasTriggeredRef = useRef(false);

  const clearAllTimers = () => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  };

  // Initialize PowerGlitch instance on logo image
  useEffect(() => {
    if (!imgRef.current) return;

    try {
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
          amplitudeY: 0,
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

      glitchInstanceRef.current = glitch;
    } catch (err) {
      console.warn('[CyberpunkPreloader] PowerGlitch init note:', err);
    }

    return () => {
      glitchInstanceRef.current?.stopGlitch?.();
    };
  }, []);

  // Synchronized glitch bursts matching glitch-intro.mp3 audio peaks
  const triggerGlitchBursts = useCallback(() => {
    const glitch = glitchInstanceRef.current;
    if (!glitch) return;

    // Burst 1: 0ms -> 140ms
    glitch.startGlitch?.();
    const t0 = setTimeout(() => {
      glitch.stopGlitch?.();
    }, 140);

    // Burst 2: 380ms -> 680ms
    const t1 = setTimeout(() => {
      glitch.startGlitch?.();
      const tSub = setTimeout(() => {
        glitch.stopGlitch?.();
      }, 300);
      timerRefs.current.push(tSub);
    }, 380);

    timerRefs.current.push(t0, t1);
  }, []);

  // Launch sequence: triggers synced glitch bursts and smooth exit timer
  const launchSequence = useCallback(
    (customDuration?: number) => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      triggerGlitchBursts();

      const runDuration = customDuration || duration;
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        const completeTimer = setTimeout(() => {
          onComplete();
        }, 250);
        timerRefs.current.push(completeTimer);
      }, runDuration);

      timerRefs.current.push(exitTimer);
    },
    [duration, onComplete, triggerGlitchBursts]
  );

  // Play audio automatically on mount without requiring any user interaction
  useEffect(() => {
    let isCancelled = false;

    // Safety fallback timer: guarantee preloader always completes even on slow networks
    const safetyTimer = setTimeout(() => {
      if (!isCancelled && !hasTriggeredRef.current) {
        launchSequence(duration);
      }
    }, 1400);
    timerRefs.current.push(safetyTimer);

    // Trigger instant pre-warmed audio playback at comfortable, subtle volume
    playGlitchIntro(GLITCH_SFX_VOLUME).then(({ duration: audioDuration }) => {
      if (isCancelled || hasTriggeredRef.current) return;
      clearTimeout(safetyTimer);
      const effectiveDuration = audioDuration ? Math.round(audioDuration * 1000) : duration;
      launchSequence(effectiveDuration);
    });

    return () => {
      isCancelled = true;
      clearAllTimers();
      glitchInstanceRef.current?.stopGlitch?.();
    };
  }, [duration, launchSequence]);

  const handleSkip = () => {
    clearAllTimers();
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  // Keyboard shortcut listener for Escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="cyberpunk-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            filter: 'brightness(1.5)',
            transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={handleSkip}
          className="fixed inset-0 z-[999999] bg-[#000000] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden px-4"
        >
          {/* Subtle Cybernetic Background Grid */}
          <div 
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #fcee0a 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

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
