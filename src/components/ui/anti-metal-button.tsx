"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SingleChevronProps {
  index: number;
  dotColor: string;
  isLarge?: boolean;
}

const SingleChevron: React.FC<SingleChevronProps> = ({ index, dotColor, isLarge }) => {
  const base = index * 0.12;
  const dots = isLarge
    ? [
        { cx: 4, cy: 4, d: 0 },
        { cx: 8, cy: 8, d: 0.06 },
        { cx: 12, cy: 12, d: 0.12 },
        { cx: 8, cy: 16, d: 0.18 },
        { cx: 4, cy: 20, d: 0.24 },
      ]
    : [
        { cx: 3, cy: 3, d: 0 },
        { cx: 6, cy: 6, d: 0.06 },
        { cx: 9, cy: 9, d: 0.12 },
        { cx: 6, cy: 12, d: 0.18 },
        { cx: 3, cy: 15, d: 0.24 },
      ];

  return (
    <svg
      width={isLarge ? "16" : "12"}
      height={isLarge ? "24" : "18"}
      viewBox={isLarge ? "0 0 16 24" : "0 0 12 18"}
      aria-hidden="true"
      focusable="false"
      className="shrink-0 overflow-visible"
    >
      <g fill={dotColor}>
        {dots.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={isLarge ? "1.8" : "1.4"}
            className="bd-dot"
            style={{ animationDelay: `${base + p.d}s` }}
          />
        ))}
      </g>
    </svg>
  );
};

export interface AntiMetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  accentFrom?: string;
  accentTo?: string;
  dotColor?: string;
  size?: 'sm' | 'lg';
}

export const AntiMetalButton = React.forwardRef<HTMLButtonElement, AntiMetalButtonProps>(
  (
    {
      className,
      children,
      label,
      accentFrom = "#fcee0a",
      accentTo = "#fcee0a",
      dotColor = "#000000",
      size = "sm",
      disabled,
      ...props
    },
    ref
  ) => {
    const content = label ?? children ?? "START GAME";
    const isLarge = size === "lg";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "group/btn relative inline-flex items-center overflow-hidden transition-all active:scale-[0.98] focus-visible:outline-none",
          "bg-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)]",
          isLarge
            ? "h-16 w-full rounded-2xl"
            : "h-9 min-w-[148px] rounded-lg",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
        style={{ fontFamily: "'Kode Mono', monospace" }}
        {...props}
      >
        <style>{`
          @keyframes bd-dot-wave {
            0%, 70%, 100% { opacity: 0.3; transform: scale(0.9); }
            35% { opacity: 1; transform: scale(1.1); }
          }
          .bd-dot {
            transform-box: fill-box;
            transform-origin: center;
            animation: bd-dot-wave 1.4s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .bd-dot { animation: none; opacity: 1; }
          }
        `}</style>

        {/* Text */}
        <span
          className={cn(
            "relative z-0 flex items-center font-turret font-extrabold tracking-wider text-white uppercase select-none whitespace-nowrap",
            isLarge
              ? "justify-center w-full h-full text-lg md:text-xl pl-6 pr-4"
              : "justify-end pr-3.5 w-full h-full text-xs font-bold"
          )}
        >
          {content}
        </span>

        {/* Square resting badge with single arrow; expands on hover */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute z-10 flex items-center overflow-hidden transition-[width,padding,gap] duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]",
            isLarge
              ? "bottom-2 left-2 top-2 w-12 rounded-xl pl-3.5 gap-6 group-hover/btn:w-[calc(100%-1rem)]"
              : "bottom-1 left-1 top-1 w-7 rounded-md pl-2 gap-4 group-hover/btn:w-[calc(100%-0.5rem)]"
          )}
          style={{
            background: `linear-gradient(180deg, ${accentFrom} 0%, ${accentTo} 100%)`,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <SingleChevron key={i} index={i} dotColor={dotColor} isLarge={isLarge} />
          ))}
        </span>
      </button>
    );
  }
);

AntiMetalButton.displayName = "AntiMetalButton";

export default AntiMetalButton;
