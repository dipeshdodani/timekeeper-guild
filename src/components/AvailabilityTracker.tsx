import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Coffee, 
  Target, 
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface AvailabilityTrackerProps {
  totalLoggedTime: number; // in seconds
  breakTime: number; // in seconds
  isOnBreak: boolean;
  targetHours: number;
  workTargetHours?: number; // for remaining time calculation, defaults to 8
}

export const AvailabilityTracker = ({ 
  totalLoggedTime, 
  breakTime, 
  isOnBreak, 
  targetHours,
  workTargetHours = 8
}: AvailabilityTrackerProps) => {
  const [currentBreakTime, setCurrentBreakTime] = useState(breakTime);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOnBreak) {
      interval = setInterval(() => {
        setCurrentBreakTime(prev => prev + 1);
      }, 1000);
    } else {
      setCurrentBreakTime(breakTime);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnBreak, breakTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDetailedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const targetSeconds = targetHours * 3600;
  const workTargetSeconds = workTargetHours * 3600;
  const progressPercentage = Math.min((totalLoggedTime / targetSeconds) * 100, 100);
  const remainingTime = Math.max(workTargetSeconds - totalLoggedTime, 0);
  
  const getProgressColor = () => {
    if (progressPercentage >= 100) return "success";
    if (progressPercentage >= 75) return "primary";
    if (progressPercentage >= 50) return "warning";
    return "destructive";
  };

  const getStatusIcon = () => {
    if (isOnBreak) return Coffee;
    if (progressPercentage >= 100) return CheckCircle;
    if (progressPercentage < 50) return AlertTriangle;
    return TrendingUp;
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card className="shadow-soft border-border mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <StatusIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Daily Availability Tracker
                {isOnBreak && (
                  <Badge variant="destructive" className="animate-pulse">
                    On Break
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Track your progress towards the daily {targetHours}-hour target
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {formatTime(totalLoggedTime)}
            </div>
            <div className="text-sm text-foreground-muted">
              of {targetHours}h target
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground-muted">Progress</span>
            <span className="text-sm font-semibold text-foreground">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-muted"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs font-medium text-white mix-blend-difference">
                {progressPercentage >= 10 && `${progressPercentage.toFixed(0)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Time Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground-muted">Logged Time</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatDetailedTime(totalLoggedTime)}
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-foreground-muted">Break Time</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatDetailedTime(currentBreakTime)}
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-foreground-muted">Remaining</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatDetailedTime(remainingTime)}
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary-glow" />
              <span className="text-sm font-medium text-foreground-muted">Total Time</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatDetailedTime(totalLoggedTime + currentBreakTime)}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="bg-accent/30 rounded-lg p-4 border border-accent">
          {isOnBreak ? (
            <div className="flex items-center gap-2 text-warning">
              <Coffee className="w-4 h-4" />
              <span className="text-sm font-medium">
                Currently on break - Timer paused for all tasks
              </span>
            </div>
          ) : progressPercentage >= 100 ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Great job! You've reached your daily target of {targetHours} hours
              </span>
            </div>
          ) : progressPercentage >= 75 ? (
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                You're doing great! {formatTime(remainingTime)} remaining to reach your work target
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-foreground-muted">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">
                Keep going! {formatTime(remainingTime)} left to complete your {workTargetHours}-hour work target
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};