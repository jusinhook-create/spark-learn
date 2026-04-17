import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, Send } from "lucide-react";

interface Props {
  imageUrl: string;
  onClose: () => void;
  onReply: (text: string) => void;
}

/**
 * Full-screen image viewer with pinch-zoom, swipe-down/left/right to close,
 * and swipe-up to open reply input.
 */
export function ImageViewer({ imageUrl, onClose, onReply }: Props) {
  const [scale, setScale] = useState(1);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const startTouch = useRef<{ x: number; y: number; distance?: number; baseScale?: number } | null>(null);

  // Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      startTouch.current = {
        x: 0, y: 0,
        distance: Math.hypot(dx, dy),
        baseScale: scale,
      };
    } else if (e.touches.length === 1) {
      startTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && startTouch.current?.distance) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.max(1, Math.min(4, (startTouch.current.baseScale || 1) * (dist / startTouch.current.distance)));
      setScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startTouch.current || scale > 1.05) { startTouch.current = null; return; }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startTouch.current.x;
    const dy = touch.clientY - startTouch.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const THRESHOLD = 60;

    if (absY > absX && dy < -THRESHOLD) {
      // swipe up → open reply
      setShowReply(true);
    } else if ((absY > absX && dy > THRESHOLD) || (absX > absY && absX > THRESHOLD)) {
      // swipe down/left/right → close
      onClose();
    }
    startTouch.current = null;
  };

  const handleSend = () => {
    if (!replyText.trim()) return;
    onReply(replyText.trim());
    setReplyText("");
    setShowReply(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between p-3 text-white">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
        <span className="text-xs opacity-70">Pinch to zoom · Swipe ↑ to reply · Swipe ↓ to close</span>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setShowReply(true)}>
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt="Full preview"
          className="max-w-[95vw] max-h-[80vh] object-contain transition-transform select-none"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>

      {showReply && (
        <div
          className="bg-background border-t p-3 flex gap-2 items-center animate-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Reply to image..."
            className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm outline-none"
          />
          <Button size="icon" className="rounded-full h-10 w-10" onClick={handleSend} disabled={!replyText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
