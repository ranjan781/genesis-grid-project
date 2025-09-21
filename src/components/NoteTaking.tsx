import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StickyNote, Save, Edit3, Plus, Tag
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NoteTakingProps {
  lessonId?: string;
  courseId?: string;
  lessonTitle?: string;
}

export default function NoteTaking({ lessonId, courseId, lessonTitle }: NoteTakingProps) {
  const [currentNote, setCurrentNote] = useState('');
  const [noteTitle, setNoteTitle] = useState(lessonTitle ? `Notes: ${lessonTitle}` : '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [notes] = useState<any[]>([]); // Simplified for demo

  const availableTags = ['Important', 'Question', 'Summary', 'Formula', 'Example', 'Review'];

  const saveNote = () => {
    // Simplified save function for demo
    setCurrentNote('');
    setNoteTitle(lessonTitle ? `Notes: ${lessonTitle}` : '');
    setSelectedTags([]);
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
                New Note
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

              <Button 
                onClick={saveNote}
                disabled={!currentNote.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground">
                Start taking notes to keep track of your learning!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}