import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, PlayCircle, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty_level: string;
  duration_minutes: number;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  lesson_order: number;
  duration_minutes: number;
}

interface UserProgress {
  lesson_id: string;
  progress_type: string;
  completed_at: string;
}

export default function Course() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('lesson_order');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch user progress if authenticated
      if (user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id);

        setUserProgress(progressData || []);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error loading course",
        description: "Failed to load course data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return userProgress.some(p => p.lesson_id === lessonId && p.progress_type === 'lesson_completed');
  };

  const getCompletionPercentage = () => {
    if (lessons.length === 0) return 0;
    const completedLessons = lessons.filter(lesson => isLessonCompleted(lesson.id));
    return Math.round((completedLessons.length / lessons.length) * 100);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-success/10 text-success';
      case 'intermediate': return 'bg-warning/10 text-warning';
      case 'advanced': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
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
          <div className="flex items-center h-16">
            <Link to="/courses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="text-sm">
                {course.subject}
              </Badge>
              <Badge className={`text-sm ${getDifficultyColor(course.difficulty_level)}`}>
                {course.difficulty_level}
              </Badge>
            </div>
            <CardTitle className="text-3xl text-primary">{course.title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {course.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="text-sm">{course.duration_minutes} minutes total</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="text-sm">{lessons.length} lessons</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm mr-2">Progress:</span>
                <Progress value={getCompletionPercentage()} className="flex-1" />
                <span className="text-sm ml-2">{getCompletionPercentage()}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle>Course Lessons</CardTitle>
            <CardDescription>
              Complete lessons in order to track your progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lessons.map((lesson, index) => {
              const isCompleted = isLessonCompleted(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    isCompleted ? 'bg-success/5 border-success/20' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {lesson.duration_minutes} minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isCompleted && (
                      <Badge variant="secondary" className="text-xs">
                        Completed
                      </Badge>
                    )}
                    <Link to={`/lesson/${lesson.id}`}>
                      <Button 
                        variant={isCompleted ? "outline" : "default"}
                        size="sm"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {isCompleted ? 'Review' : 'Start'}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {lessons.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No lessons available yet
              </h3>
              <p className="text-muted-foreground">
                This course is still being prepared. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}