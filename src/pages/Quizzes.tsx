import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Coins, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export default function Quizzes() {
  const { user } = useAuth();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("*, profiles!quizzes_created_by_fkey(display_name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return data;
    },
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
            <p className="text-sm text-muted-foreground">Be the first to create a quiz!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
