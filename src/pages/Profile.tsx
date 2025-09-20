import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User, Trophy, Target, Calendar, Settings, 
  Award, Star, BookOpen, Users, Edit,
  Shield, Palette, Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string;
  user_type: string;
  age: number;
  grade_level: string;
  avatar_url: string;
}

interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  badges: any[];
  achievements: any[];
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lessonsCompleted: 0,
    coursesCompleted: 0,
    badges: [],
    achievements: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

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

      // Get streaks
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      // Get lessons completed
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('progress_type', 'lesson_completed');

      // Get badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges (
            name,
            description,
            icon_url,
            points_value
          )
        `)
        .eq('user_id', user.id);

      // Get achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select(`
          achievement_id,
          earned_at,
          progress,
          achievements (
            name,
            description,
            category,
            points_value
          )
        `)
        .eq('user_id', user.id);

      setStats({
        totalPoints,
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        lessonsCompleted: progressData?.length || 0,
        coursesCompleted: 0, // TODO: Calculate from courses
        badges: badgesData || [],
        achievements: achievementsData || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setProfile({ ...profile, ...updatedData });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getNextLevelProgress = () => {
    const pointsForNextLevel = Math.ceil(stats.totalPoints / 1000) * 1000;
    const progress = ((stats.totalPoints % 1000) / 1000) * 100;
    return { progress, nextLevel: pointsForNextLevel };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { progress, nextLevel } = getNextLevelProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary">My Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl font-bold">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                  <Badge variant="secondary">{profile?.user_type}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-4 text-muted-foreground">
                    {profile?.age && <span>Age: {profile.age}</span>}
                    {profile?.grade_level && <span>Grade: {profile.grade_level}</span>}
                  </div>
                  
                  {/* Level Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Level Progress</span>
                      <span>{stats.totalPoints} / {nextLevel} points</span>
                    </div>
                    <Progress value={progress} className="w-full md:w-96" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.totalPoints}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{stats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.lessonsCompleted}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
                  <Target className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats.longestStreak}</div>
                  <p className="text-xs text-muted-foreground">days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                  <Trophy className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.badges.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  <Award className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{stats.achievements.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Badges</CardTitle>
                <CardDescription>Your latest achievements and recognitions</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.badges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.badges.slice(0, 6).map((userBadge) => (
                      <div key={userBadge.badge_id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{userBadge.badges.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {userBadge.badges.points_value} points
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(userBadge.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No badges earned yet. Keep learning to unlock achievements!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>All Achievements</CardTitle>
                <CardDescription>Track your progress and unlock new achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.achievements.map((achievement) => (
                    <div key={achievement.achievement_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Award className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{achievement.achievements.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {achievement.achievements.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{achievement.achievements.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {achievement.achievements.points_value} points
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Progress value={achievement.progress} className="w-20 mb-2" />
                        <p className="text-sm text-muted-foreground">{achievement.progress}%</p>
                      </div>
                    </div>
                  ))}

                  {stats.achievements.length === 0 && (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                      <p className="text-muted-foreground">
                        Start learning and completing activities to unlock achievements!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Learning Activity</CardTitle>
                <CardDescription>Your learning journey and progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Activity Tracking Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed activity logs and learning analytics will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <EditProfileForm 
                      profile={profile} 
                      onSave={handleUpdateProfile}
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name</Label>
                          <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
                        </div>
                        <div>
                          <Label>User Type</Label>
                          <p className="text-sm text-muted-foreground">{profile?.user_type}</p>
                        </div>
                        <div>
                          <Label>Age</Label>
                          <p className="text-sm text-muted-foreground">{profile?.age || 'Not set'}</p>
                        </div>
                        <div>
                          <Label>Grade Level</Label>
                          <p className="text-sm text-muted-foreground">{profile?.grade_level || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Other Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Privacy</p>
                        <p className="text-sm text-muted-foreground">Control your privacy settings</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">Customize your learning experience</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Change</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Edit Profile Form Component
function EditProfileForm({ 
  profile, 
  onSave, 
  onCancel 
}: { 
  profile: Profile | null; 
  onSave: (data: Partial<Profile>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    age: profile?.age || '',
    grade_level: profile?.grade_level || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
      onSave({
        full_name: formData.full_name,
        age: formData.age ? parseInt(formData.age.toString()) : undefined,
        grade_level: formData.grade_level
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          value={formData.age}
          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="grade_level">Grade Level</Label>
        <Input
          id="grade_level"
          value={formData.grade_level}
          onChange={(e) => setFormData(prev => ({ ...prev, grade_level: e.target.value }))}
        />
      </div>

      <div className="flex space-x-3">
        <Button type="submit">Save Changes</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
