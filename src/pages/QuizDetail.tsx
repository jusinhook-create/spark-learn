import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, ArrowLeft, CheckCircle, XCircle, Coins, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quizzes").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["quiz-questions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", id!)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (quiz?.time_limit_seconds) {
      setTimeLeft(quiz.time_limit_seconds);
    }
  }, [quiz]);

  useEffect(() => {
    if (finished || !timeLeft) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, timeLeft]);

  const submitAttempt = useMutation({
    mutationFn: async (finalScore: number) => {
      const totalQ = questions?.length || 0;
      const coinsEarned = Math.round((finalScore / Math.max(totalQ, 1)) * (quiz?.coins_reward || 10));
      const { error } = await supabase.from("quiz_attempts").insert({
        user_id: user!.id,
        quiz_id: id!,
        score: finalScore,
        total_questions: totalQ,
        coins_earned: coinsEarned,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Award coins
      // Award coins - direct update
      const { data: profile } = await supabase.from("profiles").select("coins").eq("user_id", user!.id).single();
      if (profile) {
        await supabase.from("profiles").update({ coins: (profile.coins || 0) + coinsEarned }).eq("user_id", user!.id);
      }

      return coinsEarned;
    },
  });

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    const correct = questions![currentQ].correct_answer_index;
    if (index === correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (!questions) return;
    if (currentQ + 1 >= questions.length) {
      const finalScore = score + (selectedAnswer === questions[currentQ].correct_answer_index ? 0 : 0);
      setFinished(true);
      submitAttempt.mutate(score);
    } else {
      setCurrentQ((c) => c + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handleFinishEarly = () => {
    setFinished(true);
    submitAttempt.mutate(score);
  };

  if (quizLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz || !questions || questions.length === 0) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/quizzes")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="font-semibold">Quiz not found or has no questions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (finished) {
    const totalQ = questions.length;
    const pct = Math.round((score / totalQ) * 100);
    const coinsEarned = Math.round((score / totalQ) * (quiz.coins_reward || 10));

    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-accent" />
            <h1 className="text-2xl font-bold">Quiz Complete!</h1>
            <p className="text-lg">{quiz.title}</p>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{score}/{totalQ}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{pct}%</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">+{coinsEarned}</p>
                <p className="text-xs text-muted-foreground">Coins</p>
              </div>
            </div>

            <Progress value={pct} className="mt-4" />

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/quizzes")}>
                Back to Quizzes
              </Button>
              <Button className="flex-1" onClick={() => { setCurrentQ(0); setScore(0); setFinished(false); setAnswered(false); setSelectedAnswer(null); setTimeLeft(quiz.time_limit_seconds || 300); }}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const q = questions[currentQ];
  const options = (q.options as string[]) || [];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/quizzes")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
          <Clock className="h-4 w-4" /> {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
          <span className="text-xs font-semibold text-primary">{score} correct</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold mb-4">{q.question_text}</h2>
          <div className="space-y-2">
            {options.map((opt, i) => {
              let variant: "outline" | "default" | "destructive" | "secondary" = "outline";
              if (answered) {
                if (i === q.correct_answer_index) variant = "default";
                else if (i === selectedAnswer && i !== q.correct_answer_index) variant = "destructive";
              }
              return (
                <Button
                  key={i}
                  variant={variant}
                  className={`w-full justify-start text-left h-auto py-3 px-4 ${!answered && selectedAnswer === i ? "ring-2 ring-primary" : ""}`}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                >
                  <span className="mr-2 font-bold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                  {answered && i === q.correct_answer_index && <CheckCircle className="h-4 w-4 ml-auto text-primary-foreground" />}
                  {answered && i === selectedAnswer && i !== q.correct_answer_index && <XCircle className="h-4 w-4 ml-auto" />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleFinishEarly}>
          End Quiz
        </Button>
        <Button className="flex-1" onClick={handleNext} disabled={!answered}>
          {currentQ + 1 >= questions.length ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
