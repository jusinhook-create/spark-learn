
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard WITH (security_invoker = true) AS
SELECT 
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.coins,
  COALESCE(s.current_streak, 0) as current_streak,
  COALESCE((SELECT COUNT(*) FROM public.quiz_attempts qa WHERE qa.user_id = p.user_id AND qa.completed_at IS NOT NULL), 0) as quizzes_completed
FROM public.profiles p
LEFT JOIN public.streaks s ON s.user_id = p.user_id
ORDER BY p.coins DESC;
