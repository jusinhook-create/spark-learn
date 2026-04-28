ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;
ALTER TABLE public.join_requests REPLICA IDENTITY FULL;