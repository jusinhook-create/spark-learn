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
  "The only thing that interferes with my learning is my education. — Albert Einstein",
  "Education is not the filling of a pail, but the lighting of a fire. — W.B. Yeats",
  "Tell me and I forget. Teach me and I remember. Involve me and I learn. — Benjamin Franklin",
  "The roots of education are bitter, but the fruit is sweet. — Aristotle",
  "A person who never made a mistake never tried anything new. — Albert Einstein",
  "The more that you read, the more things you will know. — Dr. Seuss",
  "Learning is a treasure that will follow its owner everywhere. — Chinese Proverb",
  "Education is the passport to the future. — Malcolm X",
  "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice. — Brian Herbert",
  "Knowledge is power. Information is liberating. — Kofi Annan",
  "In learning you will teach, and in teaching you will learn. — Phil Collins",
  "The expert in anything was once a beginner. — Helen Hayes",
  "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible. — Richard Feynman",
  "It is the mark of an educated mind to be able to entertain a thought without accepting it. — Aristotle",
  "Wisdom is not a product of schooling but of the lifelong attempt to acquire it. — Albert Einstein",
  "The only true wisdom is in knowing you know nothing. — Socrates",
  "Education breeds confidence. Confidence breeds hope. Hope breeds peace. — Confucius",
  "The purpose of education is to replace an empty mind with an open one. — Malcolm Forbes",
  "Self-education is, I firmly believe, the only kind of education there is. — Isaac Asimov",
  "The man who does not read has no advantage over the man who cannot read. — Mark Twain",
  "What we learn with pleasure we never forget. — Alfred Mercier",
  "Develop a passion for learning. If you do, you will never cease to grow. — Anthony J. D'Angelo",
  "Change is the end result of all true learning. — Leo Buscaglia",
  "Anyone who stops learning is old, whether at twenty or eighty. — Henry Ford",
  "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge. — Daniel J. Boorstin",
  "A well-educated mind will always have more questions than answers. — Helen Keller",
  "Intelligence plus character — that is the goal of true education. — Martin Luther King Jr.",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love of what you are doing. — Pelé",
  "Education's purpose is to replace an empty mind with an open one. — Malcolm Forbes",
  "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
  "Genius is 1% inspiration and 99% perspiration. — Thomas Edison",
  "A journey of a thousand miles begins with a single step. — Lao Tzu",
  "Don't let what you cannot do interfere with what you can do. — John Wooden",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Learning never exhausts the mind. — Leonardo da Vinci",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Try not to become a man of success, but rather try to become a man of value. — Albert Einstein",
  "I have no special talents. I am only passionately curious. — Albert Einstein",
  "The secret of getting ahead is getting started. — Mark Twain",
  "What you get by achieving your goals is not as important as what you become by achieving your goals. — Zig Ziglar",
  "Perseverance is not a long race; it is many short races one after the other. — Walter Elliot",
  "There is no substitute for hard work. — Thomas Edison",
  "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
  "Mistakes are proof that you are trying. — Jennifer Lim",
  "You are never too old to set another goal or to dream a new dream. — C.S. Lewis",
  "Dream big and dare to fail. — Norman Vaughan",
  "Do what you can, with what you have, where you are. — Theodore Roosevelt",
  "Strive for progress, not perfection. — Unknown",
  "The only limit to our realization of tomorrow is our doubts of today. — Franklin D. Roosevelt",
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
