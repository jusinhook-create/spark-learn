import { NavLink } from "@/components/NavLink";
import { Home, Bot, Trophy, Video, User, BookOpen, FileText, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/ai-tutor", icon: Bot, label: "AI Tutor" },
  { to: "/quizzes", icon: Trophy, label: "Quizzes" },
  { to: "/classes", icon: Video, label: "Classes" },
  { to: "/notes", icon: FileText, label: "Study Notes" },
  { to: "/forums", icon: MessageSquare, label: "Forums" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function DesktopSidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">ALPHA THOUGHT</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeClassName="bg-primary/10 text-primary"
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
