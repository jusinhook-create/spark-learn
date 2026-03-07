import { cn } from "@/lib/utils";
import pencilIcon from "@/assets/pencil-icon.jpg";
import rainbowStrip from "@/assets/rainbow-strip.jpg";
import "./AiMorphAvatar.css";

interface AiMorphAvatarProps {
  isAnimating?: boolean;
  size?: number;
  className?: string;
}

export default function AiMorphAvatar({ isAnimating = false, size = 32, className }: AiMorphAvatarProps) {
  return (
    <div
      className={cn("ai-morph-avatar relative shrink-0 overflow-hidden rounded-lg", className)}
      style={{ width: size, height: size }}
      aria-label="AI Tutor avatar"
    >
      {/* Black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Rainbow strip - visible during animation, fades out */}
      <img
        src={rainbowStrip}
        alt=""
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-all duration-1000",
          isAnimating ? "morph-rainbow" : "opacity-0 scale-50"
        )}
        draggable={false}
      />

      {/* Pencil icon - always present, revealed after morph */}
      <img
        src={pencilIcon}
        alt=""
        className={cn(
          "absolute inset-0 w-full h-full object-contain transition-all duration-1000",
          isAnimating ? "morph-pencil" : "opacity-100",
          // Invert to make pencil white on black bg
          "invert"
        )}
        draggable={false}
      />
    </div>
  );
}
