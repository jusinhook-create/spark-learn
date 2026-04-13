
-- Add require_approval to forums
ALTER TABLE public.forums ADD COLUMN IF NOT EXISTS require_approval boolean NOT NULL DEFAULT false;

-- Create join_requests table
CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(forum_id, user_id)
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Users can create join requests for themselves
CREATE POLICY "Users can create join requests" ON public.join_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.join_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Group creators can view requests for their groups
CREATE POLICY "Group creators can view group requests" ON public.join_requests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.forums WHERE id = join_requests.forum_id AND created_by = auth.uid())
  );

-- Group creators can update (approve/reject) requests
CREATE POLICY "Group creators can manage requests" ON public.join_requests
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.forums WHERE id = join_requests.forum_id AND created_by = auth.uid())
  );

-- Create pinned_messages table
CREATE TABLE public.pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.forum_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id)
);

ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- Anyone in the forum can view pinned messages
CREATE POLICY "Authenticated users can view pinned messages" ON public.pinned_messages
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can pin messages
CREATE POLICY "Authenticated users can pin messages" ON public.pinned_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = pinned_by);

-- Pinner or group creator can unpin
CREATE POLICY "Pinner can unpin messages" ON public.pinned_messages
  FOR DELETE TO authenticated USING (
    pinned_by = auth.uid() OR EXISTS (SELECT 1 FROM public.forums WHERE id = pinned_messages.forum_id AND created_by = auth.uid())
  );
