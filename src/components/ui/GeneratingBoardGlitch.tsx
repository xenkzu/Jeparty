"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PowerGlitch } from 'powerglitch';
import { playLoopingGlitchIntro, GLITCH_SFX_VOLUME } from '../../utils/audioPreloader';

interface GeneratingBoardGlitchProps {
  categories?: string[];
  players?: string[];
}

export const GeneratingBoardGlitch: React.FC<GeneratingBoardGlitchProps> = ({
  categories = [],
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const glitchRef = useRef<any>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const burstTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearBursts = () => {
    burstTimeoutsRef.current.forEach(t => clearTimeout(t));
    burstTimeoutsRef.current = [];
  };

  // PowerGlitch instance initialization
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
          velocity: 12,
          amplitudeX: 0.03,
          amplitudeY: 0,
        },
        slice: {
          count: 5,
          velocity: 14,
          minHeight: 0.02,
          maxHeight: 0.12,
          hueRotate: true,
        },
        pulse: false,
      });

      glitchRef.current = glitch;
    } catch (err) {
      console.warn('[GeneratingBoardGlitch] PowerGlitch init error:', err);
    }

    return () => {
      glitchRef.current?.stopGlitch?.();
    };
  }, []);

  // Play looping glitch sound at 20% volume, synchronized with visual glitch bursts
  useEffect(() => {
    let isCancelled = false;

    const triggerGlitchBursts = () => {
      const glitch = glitchRef.current;
      if (!glitch) return;

      // Burst 1: 0ms -> 140ms (matches audio spike 1)
      glitch.startGlitch?.();
      const t0 = setTimeout(() => {
        glitch.stopGlitch?.();
      }, 140);

      // Burst 2: 380ms -> 680ms (matches audio spike 2)
      const t1 = setTimeout(() => {
        glitch.startGlitch?.();
        const tSub = setTimeout(() => {
          glitch.stopGlitch?.();
        }, 300);
        burstTimeoutsRef.current.push(tSub);
      }, 380);

      burstTimeoutsRef.current.push(t0, t1);
    };

    // Start looping audio at comfortable, subtle volume
    playLoopingGlitchIntro(GLITCH_SFX_VOLUME).then(({ stop, duration: audioDuration }) => {
      if (isCancelled) {
        stop();
        return;
      }

      stopAudioRef.current = stop;

      // Initial visual burst in sync with audio start
      triggerGlitchBursts();

      // Repeat visual bursts in lockstep with each audio loop cycle (~1.25s)
      const cycleMs = Math.round((audioDuration || 1.25) * 1000);
      loopIntervalRef.current = setInterval(() => {
        clearBursts();
        triggerGlitchBursts();
      }, cycleMs);
    });

    return () => {
      isCancelled = true;
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
      clearBursts();
      glitchRef.current?.stopGlitch?.();
    };
  }, []);

  // Cycle category names being synthesized
  useEffect(() => {
    if (categories.length === 0) return;
    const interval = setInterval(() => {
      setActiveCategoryIndex((prev) => (prev + 1) % categories.length);
    }, 700);
    return () => clearInterval(interval);
  }, [categories]);

  const currentCat = categories[activeCategoryIndex] || 'NEURAL_STREAMS';

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen flex flex-col items-center justify-center bg-[#000000] p-6 select-none overflow-hidden">
      
      {/* Background Architectural Yellow Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(252, 238, 10, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(252, 238, 10, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '88px 88px',
        }}
      />

      {/* Ambient Yellow Glow */}
      <div className="absolute w-[50vw] h-[50vw] bg-[#fcee0a]/[0.035] rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glitch Image Container - Perfectly Centered in Viewport */}
      <div className="relative w-full max-w-[620px] aspect-[16/9] flex items-center justify-center z-20 px-4">
        <img
          ref={imgRef}
          src="/Generating board.png"
          alt="GENERATING BOARD"
          className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_24px_rgba(252,238,10,0.35)]"
        />
      </div>

      {/* Telemetry Stream Readout */}
      <div className="flex flex-col items-center gap-2 z-20 mt-4 font-mono">
        <div className="flex items-center gap-3 text-xs tracking-widest text-[#fcee0a] uppercase font-bold">
          <span className="w-2 h-2 bg-[#fcee0a] rounded-full animate-ping" />
          <span>SYNTHESIZING_STREAM // {currentCat}</span>
        </div>

        {/* Tech scanline indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
              className="w-3 h-1 bg-[#fcee0a]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeneratingBoardGlitch;
