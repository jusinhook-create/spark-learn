-- Additive admin-bypass policies so App Admins can see and act on any group
-- without modifying existing user policies.

CREATE POLICY "App admins can view all forums"
ON public.forums FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "App admins can view all forum messages"
ON public.forum_messages FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "App admins can insert into any group"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "App admins can delete forum messages"
ON public.forum_messages FOR DELETE
TO authenticated
USING (public.is_admin());