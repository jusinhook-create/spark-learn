-- Allow forum creators to delete their forums
CREATE POLICY "Creators can delete forums"
ON public.forums
FOR DELETE
USING (auth.uid() = created_by);

-- Also cascade delete related data when a forum is deleted
-- Delete group members when forum is deleted
ALTER TABLE public.group_members
DROP CONSTRAINT IF EXISTS group_members_forum_id_fkey,
ADD CONSTRAINT group_members_forum_id_fkey
  FOREIGN KEY (forum_id) REFERENCES public.forums(id) ON DELETE CASCADE;

-- Delete forum messages when forum is deleted
ALTER TABLE public.forum_messages
DROP CONSTRAINT IF EXISTS forum_messages_forum_id_fkey,
ADD CONSTRAINT forum_messages_forum_id_fkey
  FOREIGN KEY (forum_id) REFERENCES public.forums(id) ON DELETE CASCADE;

-- Delete forum posts when forum is deleted
ALTER TABLE public.forum_posts
DROP CONSTRAINT IF EXISTS forum_posts_forum_id_fkey,
ADD CONSTRAINT forum_posts_forum_id_fkey
  FOREIGN KEY (forum_id) REFERENCES public.forums(id) ON DELETE CASCADE;