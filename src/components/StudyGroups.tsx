import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, BookOpen, MessageCircle, Plus, 
  Search, Globe, Lock, Crown, UserPlus 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  max_members: number;
  is_public: boolean;
  created_at: string;
  created_by: string;
  member_count?: number;
  is_member?: boolean;
  creator_name?: string;
}

export default function StudyGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');

  // Create group form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupSubject, setGroupSubject] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStudyGroups();
    if (user) fetchMyGroups();
  }, [user]);

  const fetchStudyGroups = async () => {
    try {
      const { data } = await supabase
        .from('study_groups')
        .select(`
          *,
          study_group_members(count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (data) {
        const groupsWithCount = data.map(group => ({
          ...group,
          member_count: group.study_group_members?.[0]?.count || 0
        }));
        setStudyGroups(groupsWithCount);
      }
    } catch (error) {
      console.error('Error fetching study groups:', error);
      toast({
        title: "Error loading study groups",
        description: "Failed to load study groups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('study_group_members')
        .select(`
          study_groups(
            *,
            study_group_members(count)
          ),
          role
        `)
        .eq('user_id', user.id);

      if (data) {
        const groups = data.map(item => ({
          ...item.study_groups,
          member_count: item.study_groups?.study_group_members?.[0]?.count || 0,
          my_role: item.role
        }));
        setMyGroups(groups);
      }
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  };

  const createStudyGroup = async () => {
    if (!user || !groupName.trim() || !groupSubject.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      // Create the study group
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim(),
          subject: groupSubject.trim(),
          max_members: maxMembers,
          is_public: isPublic,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      // Reset form
      setGroupName('');
      setGroupDescription('');
      setGroupSubject('');
      setMaxMembers(10);
      setIsPublic(true);
      setIsCreateDialogOpen(false);

      // Refresh data
      fetchStudyGroups();
      fetchMyGroups();

      toast({
        title: "Study group created!",
        description: "Your study group has been created successfully",
      });
    } catch (error) {
      console.error('Error creating study group:', error);
      toast({
        title: "Error creating group",
        description: "Failed to create study group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const joinStudyGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Joined study group!",
        description: "You're now a member of this study group",
      });

      // Refresh data
      fetchStudyGroups();
      fetchMyGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error joining group",
        description: "Failed to join study group. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredGroups = studyGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subjects = ['Mathematics', 'Science', 'History', 'Literature', 'Languages', 'Technology', 'Art', 'Music'];

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
              <h1 className="text-2xl font-bold text-primary">Study Groups</h1>
              <p className="text-sm text-muted-foreground">Collaborate and learn together</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Study Group</DialogTitle>
                  <DialogDescription>
                    Start a new study group and invite others to join
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="group-name">Group Name *</Label>
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-subject">Subject *</Label>
                    <Input
                      id="group-subject"
                      value={groupSubject}
                      onChange={(e) => setGroupSubject(e.target.value)}
                      placeholder="e.g., Mathematics, Science"
                    />
                  </div>
                  <div>
                    <Label htmlFor="group-description">Description</Label>
                    <Textarea
                      id="group-description"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Describe your study group"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-members">Max Members</Label>
                    <Input
                      id="max-members"
                      type="number"
                      min="2"
                      max="50"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public-group"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="public-group">
                      {isPublic ? (
                        <span className="flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          Public group
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Lock className="h-4 w-4 mr-1" />
                          Private group
                        </span>
                      )}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createStudyGroup}
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? 'Creating...' : 'Create Group'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6 max-w-md">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Discover Groups
          </button>
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'my-groups'
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
        </div>

        {activeTab === 'discover' && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search study groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Study Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {group.description || 'No description available'}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{group.subject}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {group.member_count}/{group.max_members} members
                      </div>
                      <div className="flex items-center">
                        {group.is_public ? (
                          <Globe className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => joinStudyGroup(group.id)}
                      disabled={!user || group.is_member}
                      className="w-full"
                      variant={group.is_member ? "secondary" : "default"}
                    >
                      {group.is_member ? (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Member
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Join Group
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {filteredGroups.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No study groups found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to create a study group!'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'my-groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        {group.name}
                        {group.my_role === 'admin' && (
                          <Crown className="h-4 w-4 ml-2 text-amber-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {group.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{group.subject}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {group.member_count}/{group.max_members} members
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {group.my_role}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Study
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {myGroups.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No study groups yet</h3>
                <p className="text-muted-foreground mb-4">
                  Join or create a study group to start collaborating
                </p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}