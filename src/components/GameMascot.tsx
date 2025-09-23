import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Star, Lightbulb, Trophy, Target } from 'lucide-react';

interface GameMascotProps {
  onClose?: () => void;
  message?: string;
  type?: 'welcome' | 'achievement' | 'tip' | 'encouragement';
}

const mascotMessages = {
  welcome: [
    "Welcome back! Ready to continue your learning adventure? 🚀",
    "Great to see you again! Let's make today productive! 📚",
    "Hello there! I've prepared some exciting lessons for you today! ✨"
  ],
  achievement: [
    "Congratulations! You've earned a new badge! 🏆",
    "Amazing work! Your dedication is paying off! 🌟",
    "Fantastic progress! Keep up the excellent work! 🎉"
  ],
  tip: [
    "Pro tip: Take short breaks between lessons to stay focused! 🧠",
    "Did you know? Practice quizzes help reinforce your learning! 💡",
    "Try joining forum discussions to learn from others! 🗣️"
  ],
  encouragement: [
    "Don't give up! Every expert was once a beginner! 💪",
    "You're doing great! Small steps lead to big achievements! 🌱",
    "Keep going! Your future self will thank you! ⭐"
  ]
};

export default function GameMascot({ onClose, message, type = 'welcome' }: GameMascotProps) {
  const [currentMessage, setCurrentMessage] = useState(message || '');
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!message) {
      const messages = mascotMessages[type];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
    }
    
    // Animate on mount
    setTimeout(() => setIsAnimating(true), 100);
  }, [message, type]);

  const getIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-6 w-6 text-accent" />;
      case 'tip':
        return <Lightbulb className="h-6 w-6 text-secondary" />;
      case 'encouragement':
        return <Target className="h-6 w-6 text-primary" />;
      default:
        return <Star className="h-6 w-6 text-accent" />;
    }
  };

  const getGradientClass = () => {
    switch (type) {
      case 'achievement':
        return 'from-accent/10 to-accent/5';
      case 'tip':
        return 'from-secondary/10 to-secondary/5';
      case 'encouragement':
        return 'from-primary/10 to-primary/5';
      default:
        return 'from-accent/10 to-primary/5';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  if (!isVisible) return null;

  return (
    <Card className={`
      bg-gradient-to-r ${getGradientClass()} border-2 shadow-lg
      transform transition-all duration-300 ease-out
      ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
    `}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Mascot Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                {getIcon()}
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  {type === 'achievement' && 'EduBot 🏆'}
                  {type === 'tip' && 'EduBot 💡'}
                  {type === 'encouragement' && 'EduBot 💪'}
                  {type === 'welcome' && 'EduBot 👋'}
                </h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {currentMessage}
                </p>
              </div>
              
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            {type === 'welcome' && (
              <div className="flex space-x-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs">
                  Start Learning
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={handleClose}>
                  Maybe Later
                </Button>
              </div>
            )}

            {type === 'tip' && (
              <div className="flex space-x-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs">
                  Learn More
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={handleClose}>
                  Got it!
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}