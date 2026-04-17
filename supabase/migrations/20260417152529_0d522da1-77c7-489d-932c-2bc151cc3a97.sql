-- Track last read timestamp per user per forum for unread counts
CREATE TABLE IF NOT EXISTS public.forum_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, forum_id)
);

ALTER TABLE public.forum_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads"
ON public.forum_reads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reads"
ON public.forum_reads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reads"
ON public.forum_reads FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_forum_reads_user_forum ON public.forum_reads(user_id, forum_id);

-- Add reply_to_message_id to forum_messages for image reply threading (additive, nullable)
ALTER TABLE public.forum_messages
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.forum_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_forum_messages_reply_to ON public.forum_messages(reply_to_message_id);

-- Enable realtime for unread tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_reads;