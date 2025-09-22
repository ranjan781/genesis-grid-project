import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, FileText, Video, Link as LinkIcon, 
  Download, Search, Filter, Bookmark, 
  Star, Clock, Users, Tag 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  file_url: string;
  content_url: string;
  subject: string;
  grade_level: string;
  tags: string[];
  download_count: number;
  created_at: string;
  created_by: string;
  rating?: number;
  rating_count?: number;
  is_bookmarked?: boolean;
}

export default function Library() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bookmarkedResources, setBookmarkedResources] = useState<string[]>([]);

  useEffect(() => {
    fetchResources();
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  useEffect(() => {
    filterResources();
  }, [resources, searchQuery, selectedType, selectedSubject]);

  const fetchResources = async () => {
    try {
      // Fetch resources with ratings
      const { data: resourcesData } = await supabase
        .from('resources')
        .select(`
          *,
          ratings(rating)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // Calculate average ratings
      const resourcesWithRatings = resourcesData?.map(resource => {
        const ratings = Array.isArray(resource.ratings) ? resource.ratings : [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
          : 0;
        
        return {
          ...resource,
          rating: Number(avgRating.toFixed(1)),
          rating_count: ratings.length,
          ratings: undefined // Remove the nested ratings
        };
      }) || [];

      setResources(resourcesWithRatings);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error loading resources",
        description: "Failed to load library resources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('resource_id')
        .eq('user_id', user.id);
      
      setBookmarkedResources(data?.map(b => b.resource_id) || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(resource => resource.resource_type === selectedType);
    }

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(resource => resource.subject === selectedSubject);
    }

    setFilteredResources(filtered);
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'video':
        return <Video className="h-6 w-6 text-purple-500" />;
      case 'link':
        return <LinkIcon className="h-6 w-6 text-blue-500" />;
      case 'document':
        return <BookOpen className="h-6 w-6 text-green-500" />;
      default:
        return <FileText className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // Increment download count
      await supabase
        .from('resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', resource.id);

      // Open the resource
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
      } else if (resource.content_url) {
        window.open(resource.content_url, '_blank');
      }

      toast({
        title: "Resource opened",
        description: "The resource has been opened in a new tab",
      });
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Error accessing resource",
        description: "Failed to access the resource",
        variant: "destructive"
      });
    }
  };

  const toggleBookmark = async (resourceId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark resources",
        variant: "destructive"
      });
      return;
    }

    try {
      const isBookmarked = bookmarkedResources.includes(resourceId);
      
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', resourceId);
        
        setBookmarkedResources(prev => prev.filter(id => id !== resourceId));
        toast({
          title: "Bookmark removed",
          description: "Resource removed from your bookmarks",
        });
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            resource_id: resourceId
          });
        
        setBookmarkedResources(prev => [...prev, resourceId]);
        toast({
          title: "Resource bookmarked",
          description: "Resource added to your bookmarks",
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error updating bookmark",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderStars = (rating: number, size = 'sm') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} ${
            i <= rating ? 'text-accent fill-accent' : 'text-muted-foreground'
          }`}
        />
      );
    }
    return stars;
  };

  const uniqueSubjects = [...new Set(resources.map(r => r.subject).filter(Boolean))];
  const resourceTypes = ['all', 'pdf', 'video', 'link', 'document'];

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
              <h1 className="text-2xl font-bold text-primary">Resource Library</h1>
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
                placeholder="Search resources, subjects, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                {resourceTypes.slice(1).map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="popular">Most Popular</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
            <TabsTrigger value="bookmarked">My Bookmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                All Resources ({filteredResources.length})
              </h2>
              <Badge variant="secondary">
                {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getResourceIcon(resource.resource_type)}
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {resource.resource_type}
                            </Badge>
                            {resource.subject && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.subject}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleBookmark(resource.id)}
                        className={bookmarkedResources.includes(resource.id) ? 'text-accent' : ''}
                      >
                        <Bookmark 
                          className={`h-4 w-4 ${
                            bookmarkedResources.includes(resource.id) ? 'fill-current' : ''
                          }`} 
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {resource.description}
                    </CardDescription>

                    {/* Rating */}
                    {resource.rating && resource.rating > 0 && (
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center">
                          {renderStars(resource.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {resource.rating} ({resource.rating_count} review{resource.rating_count !== 1 ? 's' : ''})
                        </span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{resource.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Resource Info */}
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          {resource.download_count}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Created by User
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(resource.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Grade Level */}
                    {resource.grade_level && (
                      <div className="mb-4">
                        <Badge variant="outline" className="text-xs">
                          {resource.grade_level}
                        </Badge>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      onClick={() => handleDownload(resource)}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {resource.resource_type === 'link' ? 'Visit' : 'Download'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredResources.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Try adjusting your search filters or check back later for new content.
                  </p>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="popular">
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Popular Resources</h3>
              <p className="text-muted-foreground">
                This section will show the most downloaded and highest-rated resources.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Recently Added</h3>
              <p className="text-muted-foreground">
                This section will show the newest resources added to the library.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="bookmarked">
            {bookmarkedResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources
                  .filter(resource => bookmarkedResources.includes(resource.id))
                  .map((resource) => (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {getResourceIcon(resource.resource_type)}
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {resource.resource_type}
                                </Badge>
                                {resource.subject && (
                                  <Badge variant="secondary" className="text-xs">
                                    {resource.subject}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleBookmark(resource.id)}
                            className="text-accent"
                          >
                            <Bookmark className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-3 mb-4">
                          {resource.description}
                        </CardDescription>

                        {/* Rating */}
                        {resource.rating && resource.rating > 0 && (
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="flex items-center">
                              {renderStars(resource.rating)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {resource.rating}
                            </span>
                          </div>
                        )}
                        
                        <Button 
                          onClick={() => handleDownload(resource)}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {resource.resource_type === 'link' ? 'Visit' : 'Download'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bookmarks Yet</h3>
                <p className="text-muted-foreground">
                  Start bookmarking resources to see them here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}