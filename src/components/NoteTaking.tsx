import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StickyNote, Save, Trash2, Edit3, Clock,
  Bookmark, Tag, Search, Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lesson_id?: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
  is_bookmark: boolean;
}

interface NoteTakingProps {
  lessonId?: string;
  courseId?: string;
  lessonTitle?: string;
}

export default function NoteTaking({ lessonId, courseId, lessonTitle }: NoteTakingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);

  const availableTags = ['Important', 'Question', 'Summary', 'Formula', 'Example', 'Review'];

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, lessonId]);

  useEffect(() => {
    if (lessonTitle && !noteTitle) {
      setNoteTitle(`Notes: ${lessonTitle}`);
    }
  }, [lessonTitle, noteTitle]);

  const fetchNotes = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const saveNote = async () => {
    if (!user || !currentNote.trim()) {
      toast({
        title: "Cannot save note",
        description: "Please add some content to your note",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        user_id: user.id,
        title: noteTitle || 'Untitled Note',
        content: currentNote,
        tags: selectedTags,
        lesson_id: lessonId || null,
        course_id: courseId || null,
      };

      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', editingNote.id);

        if (error) throw error;
        
        toast({
          title: "Note updated",
          description: "Your note has been saved successfully",
        });
      } else {
        // Create new note
        const { error } = await supabase
          .from('notes')
          .insert(noteData);

        if (error) throw error;
        
        toast({
          title: "Note saved",
          description: "Your note has been saved successfully",
        });
      }

      // Reset form
      setCurrentNote('');
      setNoteTitle(lessonTitle ? `Notes: ${lessonTitle}` : '');
      setSelectedTags([]);
      setEditingNote(null);
      
      // Refresh notes
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error saving note",
        description: "Failed to save your note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const editNote = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setCurrentNote(note.content);
    setSelectedTags(note.tags || []);
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      toast({
        title: "Note deleted",
        description: "Your note has been deleted",
      });
      
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error deleting note",
        description: "Failed to delete the note. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleBookmark = async (note: Note) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_bookmark: !note.is_bookmark })
        .eq('id', note.id);

      if (error) throw error;
      
      fetchNotes();
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const addNewTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sign in to take notes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="write" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="write">
            <Edit3 className="h-4 w-4 mr-2" />
            Write Note
          </TabsTrigger>
          <TabsTrigger value="view">
            <StickyNote className="h-4 w-4 mr-2" />
            My Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit3 className="h-5 w-5 mr-2" />
                {editingNote ? 'Edit Note' : 'New Note'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="font-medium"
              />
              
              <Textarea
                placeholder="Start writing your notes here..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                rows={8}
                className="resize-none"
              />

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
                    className="flex-1"
                  />
                  <Button onClick={addNewTag} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={saveNote}
                  disabled={saving || !currentNote.trim()}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
                </Button>
                {editingNote && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingNote(null);
                      setCurrentNote('');
                      setNoteTitle(lessonTitle ? `Notes: ${lessonTitle}` : '');
                      setSelectedTags([]);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          {notes.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        {note.title}
                        {note.is_bookmark && (
                          <Bookmark className="h-4 w-4 ml-2 text-amber-500 fill-current" />
                        )}
                      </CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(note.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBookmark(note)}
                      >
                        <Bookmark className={`h-4 w-4 ${note.is_bookmark ? 'text-amber-500 fill-current' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editNote(note)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNote(note.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                    {note.content.length > 200 
                      ? `${note.content.substring(0, 200)}...` 
                      : note.content
                    }
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredNotes.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'Try adjusting your search terms.' 
                      : 'Start taking notes to keep track of your learning!'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}