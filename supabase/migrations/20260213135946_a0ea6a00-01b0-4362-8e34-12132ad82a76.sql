
-- Storage bucket for user uploads (PDFs, images, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('study-uploads', 'study-uploads', false);

-- Storage policies
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (bucket_id = 'study-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'study-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Study materials table (stores uploaded content)
CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT, -- 'pdf', 'text', 'image'
  extracted_text TEXT, -- full text content extracted from file
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own materials" ON public.study_materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create materials" ON public.study_materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materials" ON public.study_materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materials" ON public.study_materials FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON public.study_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Forum messages table (WhatsApp-style real-time chat)
CREATE TABLE public.forum_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  image_url TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'streak'
  streak_data JSONB, -- for streak sharing cards
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in accessible forums" ON public.forum_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM forums WHERE forums.id = forum_messages.forum_id AND (forums.is_public = true OR forums.created_by = auth.uid()))
);
CREATE POLICY "Auth users can send messages" ON public.forum_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.forum_messages FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for forum messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_messages;

-- Storage bucket for forum images
INSERT INTO storage.buckets (id, name, public) VALUES ('forum-images', 'forum-images', true);
CREATE POLICY "Users can upload forum images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'forum-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view forum images" ON storage.objects FOR SELECT USING (bucket_id = 'forum-images');
