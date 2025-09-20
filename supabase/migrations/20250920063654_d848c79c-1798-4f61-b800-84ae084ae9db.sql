-- Add tables for Phase 2: Enhanced engagement and teacher tools

-- Forums for discussion
CREATE TABLE public.forums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forum posts
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Class management for teachers
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL,
  grade_level TEXT,
  subject TEXT,
  class_code TEXT UNIQUE NOT NULL DEFAULT SUBSTRING(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Class enrollment
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Assignments
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id),
  lesson_id UUID REFERENCES public.lessons(id),
  quiz_id UUID REFERENCES public.quizzes(id),
  due_date TIMESTAMP WITH TIME ZONE,
  points_possible INTEGER DEFAULT 100,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assignment submissions
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score INTEGER,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
);

-- Enhanced achievements system
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  points_value INTEGER DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  requirements JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User achievements (separate from badges)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 100,
  UNIQUE(user_id, achievement_id)
);

-- Resource library
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- 'pdf', 'video', 'link', 'document'
  file_url TEXT,
  content_url TEXT,
  subject TEXT,
  grade_level TEXT,
  tags TEXT[],
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Virtual classroom sessions
CREATE TABLE public.virtual_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES public.classes(id),
  host_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'live', -- 'live', 'recorded'
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  meeting_url TEXT,
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Session attendance
CREATE TABLE public.session_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.virtual_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  UNIQUE(session_id, user_id)
);

-- Notifications system
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'achievement'
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Friends/social connections
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Study groups
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  created_by UUID NOT NULL,
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study group memberships
CREATE TABLE public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Forums
CREATE POLICY "Anyone can view forums" ON public.forums FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create forums" ON public.forums FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Forum creators can update their forums" ON public.forums FOR UPDATE USING (created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Forum Posts
CREATE POLICY "Anyone can view forum posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own posts" ON public.forum_posts FOR UPDATE USING (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Classes
CREATE POLICY "Teachers can view their classes" ON public.classes FOR SELECT USING (teacher_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Students can view their enrolled classes" ON public.classes FOR SELECT USING (id IN (SELECT class_id FROM class_enrollments WHERE student_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));
CREATE POLICY "Teachers can create classes" ON public.classes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'teacher'));
CREATE POLICY "Teachers can update their classes" ON public.classes FOR UPDATE USING (teacher_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Class Enrollments
CREATE POLICY "Students can view their enrollments" ON public.class_enrollments FOR SELECT USING (student_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Teachers can view their class enrollments" ON public.class_enrollments FOR SELECT USING (class_id IN (SELECT id FROM classes WHERE teacher_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));
CREATE POLICY "Students can enroll themselves" ON public.class_enrollments FOR INSERT WITH CHECK (student_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Teachers can enroll students in their classes" ON public.class_enrollments FOR INSERT WITH CHECK (class_id IN (SELECT id FROM classes WHERE teacher_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));

-- RLS Policies for Assignments
CREATE POLICY "Students can view assignments for their classes" ON public.assignments FOR SELECT USING (class_id IN (SELECT class_id FROM class_enrollments WHERE student_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));
CREATE POLICY "Teachers can view assignments for their classes" ON public.assignments FOR SELECT USING (class_id IN (SELECT id FROM classes WHERE teacher_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));
CREATE POLICY "Teachers can create assignments" ON public.assignments FOR INSERT WITH CHECK (created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'teacher'));
CREATE POLICY "Teachers can update their assignments" ON public.assignments FOR UPDATE USING (created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Assignment Submissions
CREATE POLICY "Students can view their submissions" ON public.assignment_submissions FOR SELECT USING (student_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Teachers can view submissions for their assignments" ON public.assignment_submissions FOR SELECT USING (assignment_id IN (SELECT id FROM assignments WHERE created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));
CREATE POLICY "Students can submit assignments" ON public.assignment_submissions FOR INSERT WITH CHECK (student_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Teachers can update submission scores" ON public.assignment_submissions FOR UPDATE USING (assignment_id IN (SELECT id FROM assignments WHERE created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));

-- RLS Policies for Achievements
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- RLS Policies for User Achievements
CREATE POLICY "Users can view their achievements" ON public.user_achievements FOR SELECT USING (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "System can award achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- RLS Policies for Resources
CREATE POLICY "Anyone can view public resources" ON public.resources FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own resources" ON public.resources FOR SELECT USING (created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Authenticated users can create resources" ON public.resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their resources" ON public.resources FOR UPDATE USING (created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Virtual Sessions
CREATE POLICY "Users can view sessions for their classes" ON public.virtual_sessions FOR SELECT USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())
    UNION
    SELECT class_id FROM class_enrollments WHERE student_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())
  )
);
CREATE POLICY "Teachers can create sessions" ON public.virtual_sessions FOR INSERT WITH CHECK (host_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'teacher'));
CREATE POLICY "Hosts can update their sessions" ON public.virtual_sessions FOR UPDATE USING (host_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Session Attendance
CREATE POLICY "Users can view their attendance" ON public.session_attendance FOR SELECT USING (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Teachers can view attendance for their sessions" ON public.session_attendance FOR SELECT USING (session_id IN (SELECT id FROM virtual_sessions WHERE host_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));
CREATE POLICY "Users can record their attendance" ON public.session_attendance FOR INSERT WITH CHECK (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Users can update their attendance" ON public.session_attendance FOR UPDATE USING (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Friendships
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (
  requester_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()) OR
  addressee_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())
);
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT WITH CHECK (requester_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Users can update their friendships" ON public.friendships FOR UPDATE USING (
  requester_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()) OR
  addressee_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- RLS Policies for Study Groups
CREATE POLICY "Anyone can view public study groups" ON public.study_groups FOR SELECT USING (is_public = true);
CREATE POLICY "Members can view their groups" ON public.study_groups FOR SELECT USING (id IN (SELECT group_id FROM study_group_members WHERE user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid())));
CREATE POLICY "Authenticated users can create groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Group creators can update their groups" ON public.study_groups FOR UPDATE USING (created_by IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- RLS Policies for Study Group Members
CREATE POLICY "Members can view group memberships" ON public.study_group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM study_group_members WHERE user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()))
);
CREATE POLICY "Users can join groups" ON public.study_group_members FOR INSERT WITH CHECK (user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));
CREATE POLICY "Admins can manage memberships" ON public.study_group_members FOR UPDATE USING (
  group_id IN (SELECT group_id FROM study_group_members WHERE user_id IN (SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()) AND role = 'admin')
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_forums_updated_at BEFORE UPDATE ON public.forums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_virtual_sessions_updated_at BEFORE UPDATE ON public.virtual_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON public.study_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample achievements
INSERT INTO public.achievements (name, description, category, points_value, requirements) VALUES
  ('Quick Learner', 'Complete a lesson in under 10 minutes', 'speed', 50, '{"type": "lesson_completion", "time_limit": 600}'),
  ('Streak Master', 'Maintain a 7-day learning streak', 'consistency', 100, '{"type": "streak", "days": 7}'),
  ('Quiz Champion', 'Score 100% on 5 quizzes', 'achievement', 150, '{"type": "quiz_perfect", "count": 5}'),
  ('Social Scholar', 'Help 10 students in forums', 'community', 200, '{"type": "forum_posts", "helpful_count": 10}'),
  ('Course Conqueror', 'Complete an entire course', 'completion', 300, '{"type": "course_completion", "count": 1}'),
  ('Teacher Pet', 'Submit 10 assignments on time', 'dedication', 250, '{"type": "assignment_submission", "on_time_count": 10}');