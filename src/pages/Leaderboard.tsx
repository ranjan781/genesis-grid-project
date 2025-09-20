import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, Target, Users, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  full_name: string;
  user_type: string;
  total_points: number;
  current_streak: number;
  lessons_completed: number;
  rank: number;
}

interface UserRank {
  rank: number;
  total_points: number;
  percentile: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [timeframe, setTimeframe] = useState('all-time');
  const [category, setCategory] = useState('points');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe, category]);

  const fetchLeaderboardData = async () => {
    if (!user) return;

    try {
      let query = `
        profiles.id,
        profiles.user_id,
        profiles.full_name,
        profiles.user_type,
        total_points:user_points(points.sum()),
        current_streak:user_streaks(current_streak),
        lessons_completed:user_progress(count)
      `;

      // Build leaderboard manually since RPC doesn't exist yet
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          user_type
        `);

      if (!profilesData) return;

      // Get points for each user
      const leaderboardWithPoints = await Promise.all(
        profilesData.map(async (profile) => {
          // Get total points
          const { data: pointsData } = await supabase
            .from('user_points')
            .select('points')
            .eq('user_id', profile.user_id);

          const totalPoints = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;

          // Get current streak
          const { data: streakData } = await supabase
            .from('user_streaks')
            .select('current_streak')
            .eq('user_id', profile.user_id)
            .single();

          // Get lessons completed
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('id')
            .eq('user_id', profile.user_id)
            .eq('progress_type', 'lesson_completed');

          return {
            ...profile,
            total_points: totalPoints,
            current_streak: streakData?.current_streak || 0,
            lessons_completed: progressData?.length || 0,
            rank: 0 // Will be set after sorting
          };
        })
      );

      // Sort by the selected category
      const sortedLeaderboard = leaderboardWithPoints
        .sort((a, b) => {
          switch (category) {
            case 'streak':
              return b.current_streak - a.current_streak;
            case 'lessons':
              return b.lessons_completed - a.lessons_completed;
            default:
              return b.total_points - a.total_points;
          }
        })
        .map((entry, index) => ({ ...entry, rank: index + 1 }))
        .slice(0, 50); // Top 50

      setLeaderboard(sortedLeaderboard);

      // Find current user's rank
      const currentUserEntry = sortedLeaderboard.find(entry => entry.user_id === user.id);
      if (currentUserEntry) {
        const percentile = Math.round((1 - (currentUserEntry.rank - 1) / sortedLeaderboard.length) * 100);
        setUserRank({
          rank: currentUserEntry.rank,
          total_points: currentUserEntry.total_points,
          percentile
        });
      }

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error loading leaderboard",
        description: "Failed to load leaderboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getDisplayValue = (entry: LeaderboardEntry) => {
    switch (category) {
      case 'streak':
        return `${entry.current_streak} days`;
      case 'lessons':
        return `${entry.lessons_completed} lessons`;
      default:
        return `${entry.total_points} pts`;
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
              <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
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
        {/* User's Current Rank */}
        {userRank && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Your Current Rank</h3>
                    <p className="text-muted-foreground">
                      #{userRank.rank} • Top {userRank.percentile}% • {userRank.total_points} points
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  #{userRank.rank}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-6">
          <Tabs defaultValue="points" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="points" onClick={() => setCategory('points')}>
                  Points
                </TabsTrigger>
                <TabsTrigger value="streak" onClick={() => setCategory('streak')}>
                  Streaks
                </TabsTrigger>
                <TabsTrigger value="lessons" onClick={() => setCategory('lessons')}>
                  Lessons
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Button 
                  variant={timeframe === 'all-time' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('all-time')}
                >
                  All Time
                </Button>
                <Button 
                  variant={timeframe === 'monthly' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('monthly')}
                >
                  This Month
                </Button>
                <Button 
                  variant={timeframe === 'weekly' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('weekly')}
                >
                  This Week
                </Button>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Top 3 Podium */}
          <div className="lg:col-span-4 mb-8">
            <h2 className="text-2xl font-bold text-center mb-8">🏆 Top Performers 🏆</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {leaderboard.slice(0, 3).map((entry, index) => (
                <Card 
                  key={entry.id} 
                  className={`text-center ${
                    index === 0 ? 'ring-2 ring-yellow-500 scale-105' : 
                    index === 1 ? 'ring-2 ring-gray-400' : 
                    'ring-2 ring-amber-600'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-center mb-3">
                      {getRankIcon(entry.rank)}
                    </div>
                    <Avatar className="w-16 h-16 mx-auto mb-3">
                      <AvatarFallback className="text-lg font-bold">
                        {entry.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{entry.full_name}</CardTitle>
                    <Badge variant="outline">{entry.user_type}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary mb-2">
                      {getDisplayValue(entry)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Rank #{entry.rank}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Full Leaderboard */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Full Rankings</CardTitle>
                <CardDescription>
                  Complete leaderboard for all participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(3).map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        entry.user_id === user?.id ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                          {entry.rank}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {entry.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{entry.full_name}</p>
                          <p className="text-sm text-muted-foreground">{entry.user_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{getDisplayValue(entry)}</p>
                        {entry.user_id === user?.id && (
                          <Badge variant="secondary" className="ml-2">You</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {leaderboard.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                    <p className="text-muted-foreground">
                      Start learning to see your ranking!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Competition Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Participants</span>
                  <span className="font-semibold">{leaderboard.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Points</span>
                  <span className="font-semibold">
                    {Math.round(leaderboard.reduce((sum, entry) => sum + entry.total_points, 0) / leaderboard.length) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Top Streak</span>
                  <span className="font-semibold">
                    {Math.max(...leaderboard.map(entry => entry.current_streak), 0)} days
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/courses">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Earn More Points
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
                    <Award className="h-4 w-4 mr-2" />
                    View Achievements
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