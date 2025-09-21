import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video, Calendar, Clock, Users, Plus,
  Play, Square, Mic, MicOff, Camera,
  CameraOff, Monitor, MessageCircle, 
  Settings, Link as LinkIcon, Edit, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface VirtualSession {
  id: string;
  title: string;
  description: string;
  session_type: 'live' | 'recorded';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  meeting_url?: string;
  recording_url?: string;
  host_id: string;
  class_id?: string;
  created_at: string;
  host_name?: string;
  class_name?: string;
  attendee_count?: number;
}

export default function VirtualClassroom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<VirtualSession[]>([]);
  const [mySessions, setMySessions] = useState<VirtualSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my-sessions' | 'recordings'>('upcoming');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Create session form state
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionType, setSessionType] = useState<'live' | 'recorded'>('live');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [creating, setCreating] = useState(false);

  // Virtual meeting state
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    fetchSessions();
    if (user) fetchMySessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data } = await supabase
        .from('virtual_sessions')
        .select(`
          *,
          session_attendance(count)
        `)
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true });

      if (data) {
        const sessionsWithDetails = data.map(session => ({
          ...session,
          session_type: session.session_type as 'live' | 'recorded',
          status: session.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
          host_name: 'Host User',
          class_name: null,
          attendee_count: session.session_attendance?.[0]?.count || 0
        }));
        setSessions(sessionsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySessions = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('virtual_sessions')
        .select(`
          *,
          session_attendance(count)
        `)
        .eq('host_id', user.id)
        .order('scheduled_start', { ascending: false });

      if (data) {
        const sessionsWithDetails = data.map(session => ({
          ...session,
          session_type: session.session_type as 'live' | 'recorded',
          status: session.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
          host_name: 'Host User',
          class_name: null,
          attendee_count: session.session_attendance?.[0]?.count || 0
        }));
        setMySessions(sessionsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching my sessions:', error);
    }
  };

  const createSession = async () => {
    if (!user || !sessionTitle.trim() || !scheduledStart || !scheduledEnd) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('virtual_sessions')
        .insert({
          title: sessionTitle.trim(),
          description: sessionDescription.trim(),
          session_type: sessionType,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          host_id: user.id,
          meeting_url: `https://meet.example.com/${Math.random().toString(36).substr(2, 9)}`
        });

      if (error) throw error;

      // Reset form
      setSessionTitle('');
      setSessionDescription('');
      setScheduledStart('');
      setScheduledEnd('');
      setIsCreateDialogOpen(false);

      // Refresh data
      fetchSessions();
      fetchMySessions();

      toast({
        title: "Session scheduled!",
        description: "Your virtual session has been created successfully",
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error creating session",
        description: "Failed to create virtual session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const joinSession = async (session: VirtualSession) => {
    if (!user) return;

    try {
      // Record attendance
      await supabase
        .from('session_attendance')
        .insert({
          session_id: session.id,
          user_id: user.id,
          joined_at: new Date().toISOString()
        });

      setIsInMeeting(true);
      toast({
        title: "Joined session",
        description: `Welcome to ${session.title}`,
      });
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const leaveSession = () => {
    setIsInMeeting(false);
    setIsMuted(true);
    setIsCameraOff(true);
    setIsScreenSharing(false);
    toast({
      title: "Left session",
      description: "You have left the virtual classroom",
    });
  };

  const startSession = async (sessionId: string) => {
    try {
      await supabase
        .from('virtual_sessions')
        .update({
          status: 'in_progress',
          actual_start: new Date().toISOString()
        })
        .eq('id', sessionId);

      fetchSessions();
      fetchMySessions();
      
      toast({
        title: "Session started",
        description: "Your virtual session is now live",
      });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      await supabase
        .from('virtual_sessions')
        .update({
          status: 'completed',
          actual_end: new Date().toISOString()
        })
        .eq('id', sessionId);

      fetchSessions();
      fetchMySessions();
      
      toast({
        title: "Session ended",
        description: "The virtual session has been completed",
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-2xl font-bold text-primary">Virtual Classroom</h1>
              <p className="text-sm text-muted-foreground">Join live sessions and watch recordings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
              {user && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Schedule Virtual Session</DialogTitle>
                      <DialogDescription>
                        Create a new live session or upload a recording
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="session-title">Session Title *</Label>
                        <Input
                          id="session-title"
                          value={sessionTitle}
                          onChange={(e) => setSessionTitle(e.target.value)}
                          placeholder="Enter session title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="session-description">Description</Label>
                        <Textarea
                          id="session-description"
                          value={sessionDescription}
                          onChange={(e) => setSessionDescription(e.target.value)}
                          placeholder="Describe your session"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="session-type">Session Type</Label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant={sessionType === 'live' ? 'default' : 'outline'}
                            onClick={() => setSessionType('live')}
                            className="flex-1"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Live
                          </Button>
                          <Button
                            variant={sessionType === 'recorded' ? 'default' : 'outline'}
                            onClick={() => setSessionType('recorded')}
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Recorded
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="scheduled-start">Start Time *</Label>
                        <Input
                          id="scheduled-start"
                          type="datetime-local"
                          value={scheduledStart}
                          onChange={(e) => setScheduledStart(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduled-end">End Time *</Label>
                        <Input
                          id="scheduled-end"
                          type="datetime-local"
                          value={scheduledEnd}
                          onChange={(e) => setScheduledEnd(e.target.value)}
                        />
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
                          onClick={createSession}
                          disabled={creating}
                          className="flex-1"
                        >
                          {creating ? 'Creating...' : 'Schedule Session'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Virtual Meeting Interface */}
      {isInMeeting && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Video Area */}
          <div className="flex-1 relative bg-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-8 text-white text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Camera is turned off</p>
                <p className="text-sm opacity-75">Click the camera button to turn it on</p>
              </div>
            </div>
            
            {/* Meeting Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-800 rounded-full px-6 py-3">
              <Button
                size="lg"
                variant={isMuted ? "secondary" : "default"}
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              <Button
                size="lg"
                variant={isCameraOff ? "secondary" : "default"}
                onClick={() => setIsCameraOff(!isCameraOff)}
                className="rounded-full"
              >
                {isCameraOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </Button>
              
              <Button
                size="lg"
                variant={isScreenSharing ? "default" : "secondary"}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className="rounded-full"
              >
                <Monitor className="h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="destructive"
                onClick={leaveSession}
                className="rounded-full"
              >
                <Square className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="my-sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress').map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription className="mt-1">
                          by {session.host_name}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {session.description || 'No description available'}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDateTime(session.scheduled_start)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {Math.round((new Date(session.scheduled_end).getTime() - new Date(session.scheduled_start).getTime()) / (1000 * 60))} min
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {session.attendee_count} attendees
                      </div>
                    </div>

                    <Button
                      onClick={() => joinSession(session)}
                      disabled={!user || session.status !== 'in_progress'}
                      className="w-full"
                    >
                      {session.status === 'in_progress' ? (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Join Session
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Scheduled
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {sessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                  <p className="text-muted-foreground">
                    Check back later for new virtual classroom sessions
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-sessions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySessions.map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {session.session_type === 'live' ? 'Live Session' : 'Recorded Session'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {session.description || 'No description available'}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDateTime(session.scheduled_start)}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {session.attendee_count} attendees
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {session.status === 'scheduled' && (
                        <Button
                          onClick={() => startSession(session.id)}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {session.status === 'in_progress' && (
                        <Button
                          onClick={() => endSession(session.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          End
                        </Button>
                      )}
                      {session.meeting_url && (
                        <Button
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(session.meeting_url || '')}
                          className="flex-1"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {mySessions.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first virtual classroom session
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recordings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.filter(s => s.status === 'completed' && s.recording_url).map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <CardDescription>
                      Recorded on {new Date(session.actual_end || session.scheduled_end).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {session.description || 'No description available'}
                    </p>
                    
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>

                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Recording
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {sessions.filter(s => s.status === 'completed' && s.recording_url).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recordings available</h3>
                  <p className="text-muted-foreground">
                    Completed sessions with recordings will appear here
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}