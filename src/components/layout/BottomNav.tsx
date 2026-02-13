import { NavLink } from "@/components/NavLink";
import { Home, Bot, Trophy, Video, User } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/ai-tutor", icon: Bot, label: "AI Tutor" },
  { to: "/quizzes", icon: Trophy, label: "Quizzes" },
  { to: "/classes", icon: Video, label: "Classes" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
