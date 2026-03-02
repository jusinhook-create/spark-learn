
-- Allow all authenticated users to view all roles (read-only for admin dashboard visibility)
CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
