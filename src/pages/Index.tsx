import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Trophy, Flame, Coins, BookOpen, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const quotes = [
  "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela",
  "The beautiful thing about learning is that no one can take it away from you. — B.B. King",
  "An investment in knowledge pays the best interest. — Benjamin Franklin",
  "The mind is not a vessel to be filled, but a fire to be kindled. — Plutarch",
  "Live as if you were to die tomorrow. Learn as if you were to live forever. — Mahatma Gandhi",
];

const todayQuote = quotes[new Date().getDate() % quotes.length];

const quickLinks = [
  { to: "/materials", icon: BookOpen, label: "Study Materials", desc: "Upload PDFs & text to learn from", color: "bg-primary/10 text-primary" },
  { to: "/ai-tutor", icon: Bot, label: "AI Tutor", desc: "Ask anything about your materials", color: "bg-accent/10 text-accent" },
  { to: "/quizzes", icon: Trophy, label: "Quizzes", desc: "Auto-generated from your uploads", color: "bg-warning/10 text-warning" },
  { to: "/forums", icon: Flame, label: "Community Chat", desc: "Chat & share streaks with learners", color: "bg-destructive/10 text-destructive" },
];

export default function Index() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: streak } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("streaks").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard-top3"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, avatar_url, coins").order("coins", { ascending: false }).limit(3);
      return data;
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const displayName = profile?.display_name || "Learner";

  return (
    <div className="space-y-6">
      {/* Animated Welcome */}
      {showWelcome && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-6 text-center animate-fade-in">
          {/* Wave layers */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full animate-[wave_3s_ease-in-out_infinite]">
                <path d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z" fill="hsl(var(--primary))" />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-10">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full animate-[wave_4s_ease-in-out_infinite_reverse]">
                <path d="M0,80 C300,20 600,100 900,40 C1050,10 1150,80 1200,60 L1200,120 L0,120 Z" fill="hsl(var(--accent))" />
              </svg>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground animate-[slideDown_0.6s_ease-out]">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight mt-1 animate-[slideDown_0.8s_ease-out]">
              {displayName} 👋
            </h1>
          </div>
        </div>
      )}

      {/* Regular greeting (after animation fades) */}
      {!showWelcome && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Ready to learn something new today?</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Coins className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.coins ?? 0}</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <Flame className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak?.current_streak ?? 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quote of the Day */}
      <Card className="border-0 bg-primary/5 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase text-primary mb-1">Quote of the Day</p>
              <p className="text-sm italic text-foreground/80 leading-relaxed">{todayQuote}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
        <div className="grid gap-3">
          {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Top Learners</h2>
          <Link to="/profile?tab=leaderboard" className="text-sm font-medium text-primary hover:underline">View All</Link>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">{["🥇", "🥈", "🥉"][i]}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                    {entry.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="flex-1 font-medium text-sm">{entry.display_name || "Anonymous"}</span>
                  <span className="text-sm font-semibold text-warning">{entry.coins} coins</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Be the first on the leaderboard!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
