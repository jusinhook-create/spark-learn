import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Coins, Flame, Trophy, Award, LogOut, Download, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "leaderboard" ? "leaderboard" : "profile";
  const [isDeleting, setIsDeleting] = useState(false);

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

  const { data: achievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", user!.id);
      return data;
    },
    enabled: !!user,
  });

  const { data: quizCount } = useQuery({
    queryKey: ["quiz-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).eq("user_id", user!.id).not("completed_at", "is", null);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard-full"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, avatar_url, coins").order("coins", { ascending: false }).limit(50);
      return data;
    },
  });

  const deleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Failed to delete account");
      toast({ title: "Delete successful ✅", description: "Your account has been deleted." });
      await signOut();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-4">
          {/* Profile Header */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold mb-3">
                {profile?.display_name?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
              </div>
              <h1 className="text-xl font-bold">{profile?.display_name || "Learner"}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.education_level && (
                <span className="mt-2 text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">{profile.education_level}</span>
              )}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Coins, label: "Coins", value: profile?.coins ?? 0, color: "text-warning" },
              { icon: Flame, label: "Streak", value: `${streak?.current_streak ?? 0} days`, color: "text-destructive" },
              { icon: Trophy, label: "Quizzes", value: quizCount ?? 0, color: "text-accent" },
              { icon: Award, label: "Badges", value: achievements?.length ?? 0, color: "text-primary" },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div>
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Achievements</h2>
            {achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {achievements.map((ua: any) => (
                  <Card key={ua.id} className="border-0 shadow-sm">
                    <CardContent className="p-3 flex flex-col items-center text-center">
                      <span className="text-2xl mb-1">{ua.achievements?.icon || "🏆"}</span>
                      <p className="text-[10px] font-medium leading-tight">{ua.achievements?.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Complete quizzes and challenges to earn badges!
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href="/app-release.apk" download>
                <Download className="h-4 w-4" /> Download App
              </a>
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All your data, including study materials, quiz history, coins, and conversations will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4 mt-4">
          <h2 className="text-lg font-semibold">🏆 Top Learners</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold shrink-0">
                      {entry.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="flex-1 font-medium text-sm">{entry.display_name || "Anonymous"}</span>
                    <span className="text-sm font-semibold text-warning">{entry.coins} coins</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No learners yet!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
