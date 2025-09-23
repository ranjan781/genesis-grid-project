import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Trophy, Target, Users, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import GameMascot from '@/components/GameMascot';

interface Profile {
  id: string;
  full_name: string;
  user_type: string;
}

interface UserStats {
  totalPoints: number;
  currentStreak: number;
  coursesInProgress: number;
  lessonsCompleted: number;
  badges: any[];
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    currentStreak: 0,
    coursesInProgress: 0,
    lessonsCompleted: 0,
    badges: []
  });
  const [loading, setLoading] = useState(true);
  const [showMascot, setShowMascot] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchUserStats();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Get total points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id);

      const totalPoints = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;

      // Get current streak
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .single();

      // Get lessons completed count
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('progress_type', 'lesson_completed');

      // Get user badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges (
            name,
            description,
            icon_url
          )
        `)
        .eq('user_id', user.id);

      setStats({
        totalPoints,
        currentStreak: streakData?.current_streak || 0,
        coursesInProgress: 2, // Mock data for now
        lessonsCompleted: progressData?.length || 0,
        badges: badgesData || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary">EduLearn</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {profile?.full_name}
              </span>
              <Badge variant="secondary">
                {profile?.user_type}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mascot */}
        {showMascot && (
          <div className="mb-6">
            <GameMascot 
              type="welcome" 
              onClose={() => setShowMascot(false)}
            />
          </div>
        )}
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-muted-foreground">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.totalPoints}</div>
              <p className="text-xs text-muted-foreground">
                Keep learning to earn more!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.currentStreak}</div>
              <p className="text-xs text-muted-foreground">
                days in a row
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Active</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.coursesInProgress}</div>
              <p className="text-xs text-muted-foreground">
                in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lessons Done</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.lessonsCompleted}</div>
              <p className="text-xs text-muted-foreground">
                completed this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Continue Learning
                  <Badge variant="secondary">
                    {stats.coursesInProgress} active
                  </Badge>
                </CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to="/course/1/lesson/2">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Introduction to Mathematics</h3>
                        <p className="text-sm text-muted-foreground">Lesson 2: Multiplication and Division</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">Math</Badge>
                          <span className="text-xs text-muted-foreground">• 15 min remaining</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={40} className="w-20 mb-2" />
                      <p className="text-xs text-muted-foreground">40% complete</p>
                    </div>
                  </div>
                </Link>
                
                <Link to="/course/2/lesson/1">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Basic Science Concepts</h3>
                        <p className="text-sm text-muted-foreground">Lesson 1: Introduction to Physics</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">Science</Badge>
                          <span className="text-xs text-muted-foreground">• Just started</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={5} className="w-20 mb-2" />
                      <p className="text-xs text-muted-foreground">5% complete</p>
                    </div>
                  </div>
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <Link to="/courses">
                    <Button className="w-full" variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse All Courses
                    </Button>
                  </Link>
                  <Link to="/virtual-classroom">
                    <Button className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Join Live Session
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Daily Goals */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Today's Goals
                </CardTitle>
                <CardDescription>Complete these to maintain your streak</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">✓</span>
                    </div>
                    <span className="text-sm">Complete 1 lesson</span>
                  </div>
                  <Badge variant="secondary" className="text-success">Completed</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xs">○</span>
                    </div>
                    <span className="text-sm">Practice quiz (2/3 remaining)</span>
                  </div>
                  <Progress value={33} className="w-16" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xs">○</span>
                    </div>
                    <span className="text-sm">Forum participation</span>
                  </div>
                  <Link to="/forums">
                    <Button size="sm" variant="outline">Go</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements & Navigation */}
          <div className="space-y-6">
            {/* Streak & Level Info */}
            <Card className="bg-gradient-to-r from-secondary/10 to-accent/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">{stats.currentStreak}</div>
                  <p className="text-sm text-muted-foreground mb-4">Day Learning Streak 🔥</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Level Progress</span>
                      <span>Level {Math.floor(stats.totalPoints / 1000) + 1}</span>
                    </div>
                    <Progress value={((stats.totalPoints % 1000) / 1000) * 100} />
                    <p className="text-xs text-muted-foreground">
                      {1000 - (stats.totalPoints % 1000)} points to next level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Achievements
                  <Link to="/profile">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </CardTitle>
                <CardDescription>Your latest badges and accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.badges.length > 0 ? (
                  <div className="space-y-3">
                    {stats.badges.slice(0, 3).map((userBadge) => (
                      <div key={userBadge.badge_id} className="flex items-center space-x-3 p-2 bg-accent/5 rounded-lg">
                        <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{userBadge.badges.name}</p>
                          <p className="text-xs text-muted-foreground">
                            +{userBadge.badges.points_value} points • {new Date(userBadge.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Complete lessons to earn your first badge!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/courses">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="h-4 w-4 mr-2" />
                    View Leaderboard
                  </Button>
                </Link>
                <Link to="/library">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Library
                  </Button>
                </Link>
                <Link to="/forums">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Join Discussions
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}