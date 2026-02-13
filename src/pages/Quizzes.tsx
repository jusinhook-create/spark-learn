import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Coins, Plus, History, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Quizzes() {
  const { user } = useAuth();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["quiz-attempts", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*, quizzes(title, subject)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent" /> Quizzes
          </h1>
          <p className="text-sm text-muted-foreground">Test your knowledge and earn coins</p>
        </div>
        <Link to="/quizzes/create">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Create
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="available">
        <TabsList className="w-full">
          <TabsTrigger value="available" className="flex-1">Available</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">My History</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-4">
          {isLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-4 h-20" />
                </Card>
              ))}
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="grid gap-3">
              {quizzes.map((quiz) => (
                <Link key={quiz.id} to={`/quizzes/${quiz.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{quiz.description}</p>
                          {quiz.subject && (
                            <span className="inline-block text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{quiz.subject}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0 ml-4">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.floor((quiz.time_limit_seconds || 300) / 60)}m</span>
                          <span className="flex items-center gap-1 text-warning font-semibold"><Coins className="h-3 w-3" />{quiz.coins_reward}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No quizzes yet</p>
                <p className="text-sm text-muted-foreground">Generate quizzes from your study materials!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {attemptsLoading ? (
            <div className="grid gap-3">
              {[1, 2].map((i) => (
                <Card key={i} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-4 h-20" />
                </Card>
              ))}
            </div>
          ) : attempts && attempts.length > 0 ? (
            <div className="grid gap-3">
              {attempts.map((attempt) => (
                <Card key={attempt.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{(attempt as any).quizzes?.title || "Quiz"}</p>
                        {(attempt as any).quizzes?.subject && (
                          <span className="inline-block text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                            {(attempt as any).quizzes.subject}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          <span className="text-sm font-bold">{attempt.score}/{attempt.total_questions}</span>
                        </div>
                        <span className="text-xs text-warning font-semibold flex items-center gap-1">
                          <Coins className="h-3 w-3" /> +{attempt.coins_earned}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No quiz history</p>
                <p className="text-sm text-muted-foreground">Take a quiz to see your results here!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
