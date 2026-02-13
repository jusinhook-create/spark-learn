import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <main className="pb-20 md:pl-64 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
