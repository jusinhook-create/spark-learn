
-- Group members table for join functionality
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(forum_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Add invite_code column to forums
ALTER TABLE public.forums ADD COLUMN invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8);

-- Update forums SELECT policy to include groups user is a member of
DROP POLICY IF EXISTS "Anyone can view public forums" ON public.forums;
CREATE POLICY "Users can view public forums or joined forums" ON public.forums
  FOR SELECT USING (
    is_public = true 
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.group_members WHERE forum_id = forums.id AND user_id = auth.uid())
  );

-- Update forum_messages SELECT policy to include joined groups
DROP POLICY IF EXISTS "Users can view messages in accessible forums" ON public.forum_messages;
CREATE POLICY "Users can view messages in accessible forums" ON public.forum_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forums 
      WHERE forums.id = forum_messages.forum_id 
      AND (forums.is_public = true OR forums.created_by = auth.uid() 
           OR EXISTS (SELECT 1 FROM group_members WHERE forum_id = forums.id AND user_id = auth.uid()))
    )
  );
