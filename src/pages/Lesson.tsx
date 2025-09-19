import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  lesson_order: number;
  duration_minutes: number;
}

interface Course {
  id: string;
  title: string;
}

export default function Lesson() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLessonData();
    }
  }, [id, user]);

  const fetchLessonData = async () => {
    try {
      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', lessonData.course_id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch next lesson
      const { data: nextLessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', lessonData.course_id)
        .eq('lesson_order', lessonData.lesson_order + 1)
        .single();

      setNextLesson(nextLessonData);

      // Check if lesson is completed by user
      if (user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', id)
          .eq('progress_type', 'lesson_completed');

        setIsCompleted(progressData && progressData.length > 0);

        // Mark lesson as started if not already done
        await markLessonStarted();
      }
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      toast({
        title: "Error loading lesson",
        description: "Failed to load lesson data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markLessonStarted = async () => {
    if (!user || !lesson) return;

    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .eq('progress_type', 'lesson_started');

    if (!existingProgress || existingProgress.length === 0) {
      await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id: lesson.id,
          course_id: lesson.course_id,
          progress_type: 'lesson_started'
        });
    }
  };

  const completeLesson = async () => {
    if (!user || !lesson || isCompleted) return;

    setCompleting(true);
    try {
      // Mark lesson as completed
      await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          lesson_id: lesson.id,
          course_id: lesson.course_id,
          progress_type: 'lesson_completed',
          completed_at: new Date().toISOString()
        });

      // Award points for lesson completion
      await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          points: 10,
          points_type: 'lesson_completion',
          source_id: lesson.id,
          description: `Completed lesson: ${lesson.title}`
        });

      setIsCompleted(true);
      toast({
        title: "Lesson completed! 🎉",
        description: "You earned 10 points. Keep up the great work!",
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Error completing lesson",
        description: "Failed to mark lesson as complete. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
          <Link to="/courses">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to={`/course/${course.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-primary">{course.title}</h1>
                <p className="text-sm text-muted-foreground">Lesson {lesson.lesson_order}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {lesson.duration_minutes} min
              </div>
              {isCompleted && (
                <div className="flex items-center text-success">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">{lesson.title}</CardTitle>
            <CardDescription>
              Lesson {lesson.lesson_order} • {lesson.duration_minutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <div className="text-base leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          </CardContent>
        </Card>

        {/* Interactive Elements Placeholder */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Practice Exercise</CardTitle>
            <CardDescription>
              Apply what you've learned with this interactive exercise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Interactive 3D animations and exercises will be added here
              </p>
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-success font-medium">Exercise Complete! 🎉</p>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {!isCompleted && user ? (
                  <Button 
                    onClick={completeLesson}
                    disabled={completing}
                    className="bg-success hover:bg-success/90"
                  >
                    {completing ? 'Completing...' : 'Mark as Complete'}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                ) : isCompleted ? (
                  <div className="flex items-center text-success">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="font-medium">Lesson Completed!</span>
                  </div>
                ) : (
                  <Button disabled>
                    Sign in to track progress
                  </Button>
                )}
              </div>
              <div>
                {nextLesson ? (
                  <Link to={`/lesson/${nextLesson.id}`}>
                    <Button>
                      Next Lesson
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/course/${course.id}`}>
                    <Button variant="outline">
                      Back to Course
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}