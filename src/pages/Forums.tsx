import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Search, Plus, Clock, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Forum {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  posts: { count: number }[];
  profiles: { full_name: string };
}

interface RecentPost {
  id: string;
  content: string;
  created_at: string;
  forums: { title: string };
}

export default function Forums() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forums, setForums] = useState<Forum[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForumsData();
  }, []);

  const fetchForumsData = async () => {
    try {
      // Fetch forums with post count
      const { data: forumsData } = await supabase
        .from('forums')
        .select(`
          *,
          posts:forum_posts(count)
        `)
        .order('created_at', { ascending: false });

      // Fetch recent posts
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select(`
          *,
          forums(title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setForums(forumsData || []);
      setRecentPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching forums:', error);
      toast({
        title: "Error loading forums",
        description: "Failed to load forum data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredForums = forums.filter(forum => {
    const matchesSearch = forum.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         forum.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || forum.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'general', 'subject', 'tips', 'help'];

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
              <h1 className="text-2xl font-bold text-primary">Community Forums</h1>
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
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search forums and discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Forums List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Discussion Forums</h2>
              <Badge variant="secondary">
                {filteredForums.length} forum{filteredForums.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-4">
              {filteredForums.map((forum) => (
                <Card key={forum.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link to={`/forums/${forum.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{forum.title}</CardTitle>
                          <CardDescription>{forum.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {forum.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {forum.posts?.[0]?.count || 0} posts
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            Started by {forum.profiles?.full_name || 'Unknown'}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(forum.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}

              {filteredForums.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No forums found</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to start a discussion!'}
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Discussion
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="border-l-2 border-primary/20 pl-4">
                    <p className="text-sm font-medium">
                      {post.profiles?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      in {post.forums?.title || 'Unknown Forum'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                
                {recentPosts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Forum Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Forums</span>
                  <span className="font-semibold">{forums.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Posts</span>
                  <span className="font-semibold">
                    {forums.reduce((sum, forum) => sum + (forum.posts?.[0]?.count || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Most Popular</span>
                  <span className="font-semibold text-primary">General</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Discussion
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Browse Members
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Popular Topics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}