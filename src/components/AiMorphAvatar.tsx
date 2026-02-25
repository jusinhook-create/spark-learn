import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AiMorphAvatarProps {
  isAnimating?: boolean;
  size?: number;
  className?: string;
}

export default function AiMorphAvatar({ isAnimating = false, size = 32, className }: AiMorphAvatarProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isAnimating) {
      setPhase(0);
      return;
    }
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-label="AI Tutor avatar"
    >
      <defs>
        <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(270, 80%, 60%)">
            <animate attributeName="stop-color" values="hsl(270,80%,60%);hsl(330,80%,60%);hsl(270,80%,60%)" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="hsl(330, 80%, 60%)">
            <animate attributeName="stop-color" values="hsl(330,80%,60%);hsl(20,90%,60%);hsl(330,80%,60%)" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="hsl(30, 90%, 55%)">
            <animate attributeName="stop-color" values="hsl(30,90%,55%);hsl(45,95%,55%);hsl(30,90%,55%)" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <linearGradient id="pencilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>

      {/* Morphing background shape */}
      <g>
        {isAnimating ? (
          <>
            {/* Animated gradient blob that morphs */}
            <rect
              x="8" y="8" width="48" height="48" rx="12"
              fill="url(#rainbowGrad)"
              opacity="0.9"
              transform="rotate(-12, 32, 32)"
            >
              <animate attributeName="rx" values="12;24;12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" values="-12,32,32;0,32,32;-12,32,32" dur="2s" repeatCount="indefinite" />
            </rect>
            {/* Pencil shape fading in/out */}
            <g opacity="0">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
              <path
                d="M20 44 L40 14 L46 18 L26 48 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M20 44 L18 50 L26 48" fill="currentColor" opacity="0.8" />
              <line x1="38" y1="16" x2="44" y2="20" stroke="currentColor" strokeWidth="2" />
            </g>
          </>
        ) : (
          <>
            {/* Static state: gradient shape with pencil overlay */}
            <rect
              x="10" y="10" width="44" height="44" rx="14"
              fill="url(#pencilGrad)"
              opacity="0.15"
              transform="rotate(-8, 32, 32)"
            />
            <g stroke="hsl(var(--primary))" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 42 L38 16 L44 20 L28 46 Z" />
              <path d="M22 42 L20 48 L28 46" fill="hsl(var(--primary))" opacity="0.3" />
              <line x1="36" y1="18" x2="42" y2="22" />
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
