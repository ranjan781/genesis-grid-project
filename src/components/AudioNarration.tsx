import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, Volume2, VolumeX, RotateCcw, 
  SkipBack, SkipForward, Mic, MicOff 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioNarrationProps {
  text: string;
  autoPlay?: boolean;
  lessonId?: string;
}

export default function AudioNarration({ text, autoPlay = false, lessonId }: AudioNarrationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState([0.8]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0];
    }
  }, [volume, isMuted]);

  const generateAudio = async () => {
    if (!text.trim()) {
      toast({
        title: "No text to narrate",
        description: "Please provide text content for narration",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      // This would integrate with text-to-speech service
      // For demo purposes, we'll simulate audio generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would be the audio data from TTS service
      setAudioData('demo-audio-data');
      
      toast({
        title: "Audio generated",
        description: "Lesson narration is ready to play",
      });

      if (autoPlay) {
        handlePlay();
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Error generating audio",
        description: "Failed to create narration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (newTime: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Mic className="h-5 w-5 mr-2 text-primary" />
            Audio Narration
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {isGeneratingAudio ? 'Generating...' : audioData ? 'Ready' : 'Not Generated'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Audio Element */}
        {audioData && (
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
          >
            {/* In real implementation, this would be the audio source */}
            <source src="#" type="audio/mpeg" />
          </audio>
        )}

        {/* Generate Audio Button */}
        {!audioData && !isGeneratingAudio && (
          <Button 
            onClick={generateAudio}
            className="w-full"
            disabled={!text.trim()}
          >
            <Mic className="h-4 w-4 mr-2" />
            Generate Audio Narration
          </Button>
        )}

        {/* Loading State */}
        {isGeneratingAudio && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
            <span className="text-sm text-muted-foreground">Generating audio narration...</span>
          </div>
        )}

        {/* Audio Controls */}
        {audioData && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSkip(-10)}
                disabled={!audioData}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={resetAudio}
                disabled={!audioData}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                onClick={handlePlay}
                disabled={!audioData}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSkip(10)}
                disabled={!audioData}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleMute}
                disabled={!audioData}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={volume}
                max={1}
                step={0.1}
                onValueChange={setVolume}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Playback Speed */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Playback Speed:</span>
              <div className="flex space-x-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <Button
                    key={speed}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.playbackRate = speed;
                      }
                    }}
                    className="text-xs px-2 py-1"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text Preview */}
        <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            {text.length > 200 ? `${text.substring(0, 200)}...` : text}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}