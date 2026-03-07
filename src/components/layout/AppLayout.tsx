import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAiTutor = location.pathname.startsWith("/ai-tutor");
  const mainClass = isAiTutor ? "md:pl-64 pb-20 md:pb-0 overflow-hidden overscroll-none min-h-0" : "pb-20 md:pl-64 md:pb-0";
  const contentClass = isAiTutor ? "mx-auto max-w-4xl p-0 h-dvh" : "mx-auto max-w-4xl px-4 py-6";
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className={mainClass}>
        <div className={contentClass}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
