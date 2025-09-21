-- Create notes table for user note-taking
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  lesson_id UUID REFERENCES public.lessons(id),
  course_id UUID REFERENCES public.courses(id),
  is_bookmark BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for notes
CREATE POLICY "Users can view their own notes" 
ON public.notes 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notes" 
ON public.notes 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notes" 
ON public.notes 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes" 
ON public.notes 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();