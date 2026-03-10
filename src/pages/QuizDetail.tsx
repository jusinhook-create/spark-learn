import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, ArrowLeft, CheckCircle, XCircle, Coins, Loader2, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
    if (questions && answers.length === 0) {
      setAnswers(new Array(questions.length).fill(null));
    }
  }, [questions]);

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

  const score = questions
    ? answers.reduce((acc, a, i) => acc + (a === questions[i]?.correct_answer_index ? 1 : 0), 0)
    : 0;

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

      const { data: profile } = await supabase.from("profiles").select("coins").eq("user_id", user!.id).single();
      if (profile) {
        await supabase.from("profiles").update({ coins: (profile.coins || 0) + coinsEarned }).eq("user_id", user!.id);
      }

      return coinsEarned;
    },
  });

  const handleAnswer = (index: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = index;
      return next;
    });
  };

  const handleNext = () => {
    if (!questions) return;
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
      submitAttempt.mutate(score);
    } else {
      setCurrentQ((c) => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ((c) => c - 1);
  };

  const handleFinishEarly = () => {
    setFinished(true);
    submitAttempt.mutate(score);
  };

  const handleRegenerate = async () => {
    if (!quiz || !user) return;
    setIsRegenerating(true);
    try {
      const { data: materials } = await supabase
        .from("study_materials")
        .select("id")
        .eq("user_id", user.id)
        .eq("subject", quiz.subject || "")
        .limit(1);

      const materialId = materials?.[0]?.id;
      if (!materialId) {
        toast({ title: "No matching material found", description: "Upload the material again to regenerate.", variant: "destructive" });
        setIsRegenerating(false);
        return;
      }

      const resp = await supabase.functions.invoke("generate-quiz", {
        body: { material_id: materialId, num_questions: questions?.length || 20 },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);

      const newQuiz = resp.data.quiz;
      toast({ title: "New quiz generated! 🎉" });
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      navigate(`/quizzes/${newQuiz.id}`, { replace: true });
    } catch (e: any) {
      toast({ title: "Regeneration failed", description: e.message, variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShareStreak = async () => {
    const totalQ = questions?.length || 0;
    const pct = Math.round((score / totalQ) * 100);
    const shareText = `🏆 I scored ${score}/${totalQ} (${pct}%) on "${quiz?.title}" on Alpha Thought! 🔥`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Quiz Score", text: shareText });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Score copied to clipboard! 📋" });
    }
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

            <div className="flex flex-col gap-2 mt-6">
              <Button onClick={handleShareStreak} variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" /> Share My Score 🔥
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/quizzes")}>
                  Back to Quizzes
                </Button>
                <Button className="flex-1" onClick={handleRegenerate} disabled={isRegenerating}>
                  {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {isRegenerating ? "Generating..." : "New Quiz 🔄"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Corrections Review */}
        <div>
          <h2 className="text-lg font-semibold mb-3">📝 Review Corrections</h2>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const correctIndex = q.correct_answer_index;
              const isCorrect = userAnswer === correctIndex;
              const opts = (q.options as string[]) || [];

              return (
                <Card key={q.id} className={`border-0 shadow-sm ${isCorrect ? 'ring-1 ring-green-500/30' : 'ring-1 ring-destructive/30'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium text-sm">
                        <span className="text-muted-foreground mr-1">Q{i + 1}.</span>
                        {q.question_text}
                      </p>
                    </div>
                    <div className="space-y-1.5 ml-7">
                      {opts.map((opt, j) => {
                        const isUserChoice = userAnswer === j;
                        const isRightAnswer = correctIndex === j;
                        let className = "text-xs px-3 py-2 rounded-md border ";
                        if (isRightAnswer) {
                          className += "bg-green-500/10 border-green-500/40 text-green-700 dark:text-green-400 font-semibold";
                        } else if (isUserChoice && !isRightAnswer) {
                          className += "bg-destructive/10 border-destructive/40 text-destructive line-through";
                        } else {
                          className += "bg-secondary/50 border-transparent text-muted-foreground";
                        }
                        return (
                          <div key={j} className={className}>
                            <span className="font-bold mr-1">{String.fromCharCode(65 + j)}.</span>
                            {opt}
                            {isRightAnswer && " ✓"}
                            {isUserChoice && !isRightAnswer && " (your answer)"}
                          </div>
                        );
                      })}
                      {userAnswer === null && (
                        <p className="text-xs text-muted-foreground italic">Not answered</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const options = (q.options as string[]) || [];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const selectedAnswer = answers[currentQ];
  const answered = selectedAnswer !== null;

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
              const isSelected = selectedAnswer === i;
              return (
                <Button
                  key={i}
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full justify-start text-left h-auto py-3 px-4`}
                  onClick={() => handleAnswer(i)}
                >
                  <span className="mr-2 font-bold text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                  {isSelected && <CheckCircle className="h-4 w-4 ml-auto" />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentQ === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleFinishEarly}>
          End Quiz
        </Button>
        <Button className="flex-1" onClick={handleNext} disabled={!answered}>
          {currentQ + 1 >= questions.length ? "Finish" : "Next"}
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} disabled={!answered || currentQ + 1 >= questions.length}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Question navigator dots */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`h-6 w-6 rounded-full text-[10px] font-bold transition-colors ${
              i === currentQ
                ? "bg-primary text-primary-foreground"
                : answers[i] !== null
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
