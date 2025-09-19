-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher', 'parent')),
  full_name TEXT NOT NULL,
  grade_level TEXT,
  age INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER,
  thumbnail_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  lesson_order INTEGER NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  progress_type TEXT NOT NULL CHECK (progress_type IN ('lesson_started', 'lesson_completed', 'quiz_started', 'quiz_completed')),
  score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user points table
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  points_type TEXT NOT NULL CHECK (points_type IN ('lesson_completion', 'quiz_completion', 'daily_streak', 'achievement')),
  source_id UUID, -- can reference lesson_id, quiz_id, etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  requirements JSONB NOT NULL,
  points_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for courses (public read, teachers can create/edit)
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Teachers can create courses" ON public.courses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'teacher')
);
CREATE POLICY "Teachers can update their own courses" ON public.courses FOR UPDATE USING (
  created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'teacher')
);

-- Create policies for lessons (public read, teachers can create/edit)
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Teachers can create lessons" ON public.lessons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'teacher')
);

-- Create policies for quizzes (public read, teachers can create/edit)
CREATE POLICY "Anyone can view quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Teachers can create quizzes" ON public.quizzes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'teacher')
);

-- Create policies for user progress (users can view/update their own)
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (
  user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (
  user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create policies for user points (users can view their own)
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (
  user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "System can insert points" ON public.user_points FOR INSERT WITH CHECK (true);

-- Create policies for user streaks (users can view their own)
CREATE POLICY "Users can view their own streaks" ON public.user_streaks FOR SELECT USING (
  user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks FOR UPDATE USING (
  user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks FOR INSERT WITH CHECK (
  user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create policies for badges (public read)
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- Create policies for user badges (users can view their own)
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (
  user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, user_type, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'student'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User')
  );
  
  -- Initialize user streak
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample badges
INSERT INTO public.badges (name, description, icon_url, requirements, points_value) VALUES
('First Lesson', 'Complete your first lesson', '/badge-first-lesson.png', '{"type": "lesson_completion", "count": 1}', 10),
('Quiz Master', 'Complete 5 quizzes with 80% or higher score', '/badge-quiz-master.png', '{"type": "quiz_completion", "count": 5, "min_score": 80}', 50),
('Week Warrior', 'Maintain a 7-day learning streak', '/badge-week-warrior.png', '{"type": "daily_streak", "count": 7}', 100),
('Knowledge Seeker', 'Complete 10 lessons', '/badge-knowledge-seeker.png', '{"type": "lesson_completion", "count": 10}', 75);

-- Insert sample courses
INSERT INTO public.courses (title, description, subject, difficulty_level, duration_minutes) VALUES
('Introduction to Mathematics', 'Basic mathematical concepts and operations', 'Mathematics', 'beginner', 120),
('Basic Science Concepts', 'Fundamental principles of science', 'Science', 'beginner', 90),
('English Grammar Basics', 'Essential grammar rules and usage', 'English', 'beginner', 100);

-- Insert sample lessons for Mathematics course
INSERT INTO public.lessons (course_id, title, content, lesson_order, duration_minutes)
SELECT 
  c.id,
  'Addition and Subtraction',
  'Learn the basic operations of addition and subtraction. Practice with simple numbers and understand how these operations work in everyday life.',
  1,
  15
FROM public.courses c WHERE c.title = 'Introduction to Mathematics';

INSERT INTO public.lessons (course_id, title, content, lesson_order, duration_minutes)
SELECT 
  c.id,
  'Multiplication and Division',
  'Discover multiplication and division. Learn the relationship between these operations and practice with fun examples.',
  2,
  20
FROM public.courses c WHERE c.title = 'Introduction to Mathematics';