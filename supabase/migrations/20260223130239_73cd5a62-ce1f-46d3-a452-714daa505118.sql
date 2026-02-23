
-- Add UPDATE policy for forum_messages so users can edit their own messages
CREATE POLICY "Users can update own messages"
ON public.forum_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
