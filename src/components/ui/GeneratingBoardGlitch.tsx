"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PowerGlitch } from 'powerglitch';

interface GeneratingBoardGlitchProps {
  categories?: string[];
  players?: string[];
}

export const GeneratingBoardGlitch: React.FC<GeneratingBoardGlitchProps> = ({
  categories = [],
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // PowerGlitch instance with subtle, randomized burst intervals
  useEffect(() => {
    if (!imgRef.current) return;

    const glitch = PowerGlitch.glitch(imgRef.current, {
      playMode: 'manual',
      createContainers: true,
      hideOverflow: false,
      timing: {
        duration: 350,
        iterations: 1,
      },
      glitchTimeSpan: {
        start: 0,
        end: 1,
      },
      shake: {
        velocity: 12,
        amplitudeX: 0.03,
        amplitudeY: 0, // strict horizontal jitter
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

    let timeoutId: ReturnType<typeof setTimeout>;
    let stopTimeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextGlitch = () => {
      // Random gap between 1.4s and 3.6s
      const delay = Math.random() * 2200 + 1400;
      timeoutId = setTimeout(() => {
        glitch.startGlitch();
        // Short subtle burst duration: 120ms to 240ms
        const burstDuration = Math.random() * 120 + 120;
        stopTimeoutId = setTimeout(() => {
          glitch.stopGlitch();
          scheduleNextGlitch();
        }, burstDuration);
      }, delay);
    };

    scheduleNextGlitch();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(stopTimeoutId);
      glitch.stopGlitch?.();
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
    <div className="flex-1 w-full h-full min-h-[500px] flex flex-col items-center justify-center relative bg-[#000000] p-6 select-none overflow-hidden">
      
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
      <div className="absolute w-[50vw] h-[50vw] bg-[#fcee0a]/[0.025] rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glitch Image Container */}
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
