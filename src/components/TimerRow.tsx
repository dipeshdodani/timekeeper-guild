import { useState, useEffect } from "react";
import { getSimpleDropdownData, getTaskAHT } from "@/utils/dropdownStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Clock,
  Calendar
} from "lucide-react";

interface TimesheetRow {
  id: string;
  ticketNumber: string;
  stubName: string;
  university: string;
  domain: string;
  clientType: string;
  taskName: string;
  count: number;
  completedCount: number;
  comments: string;
  receivedDate: string;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  totalTime: number;
  isTimerRunning: boolean;
}

interface TimerRowProps {
  row: TimesheetRow;
  index: number;
  dropdownData: {
    stubs: string[];
    universities: string[];
    domains: string[];
    clientTypes: string[];
    tasks: string[];
    statuses: string[];
  };
  onUpdate: (id: string, updates: Partial<TimesheetRow>) => void;
  onDelete: (id: string) => void;
  onTimeUpdate: (seconds: number) => void;
}

export const TimerRow = ({ 
  row, 
  index, 
  dropdownData, 
  onUpdate, 
  onDelete, 
  onTimeUpdate 
}: TimerRowProps) => {
  const [currentTime, setCurrentTime] = useState(row.totalTime);
  const [taskAHT, setTaskAHT] = useState<number | null>(null);

  // Get AHT for selected task
  useEffect(() => {
    if (row.taskName) {
      const aht = getTaskAHT(row.taskName);
      setTaskAHT(aht);
    }
  }, [row.taskName]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (row.isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          onUpdate(row.id, { totalTime: newTime });
          onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [row.isTimerRunning, row.id, onUpdate, onTimeUpdate]);

  const startTimer = () => {
    onUpdate(row.id, {
      isTimerRunning: true,
      startTime: row.startTime || new Date(),
      status: row.status === "Not Started" ? "WIP" : row.status
    });
  };

  const pauseTimer = () => {
    onUpdate(row.id, {
      isTimerRunning: false,
      endTime: new Date()
    });
  };

  const stopTimer = () => {
    onUpdate(row.id, {
      isTimerRunning: false,
      endTime: new Date(),
      status: "Completed"
    });
  };

  const resetTimer = () => {
    setCurrentTime(0);
    onUpdate(row.id, {
      totalTime: 0,
      isTimerRunning: false,
      startTime: null,
      endTime: null
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalTimeDisplay = () => {
    if (row.totalTime > 0) {
      const hours = Math.floor(row.totalTime / 3600);
      const minutes = Math.floor((row.totalTime % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    return "0h 0m";
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Not Started": "outline",
      "WIP": "default",
      "On Hold - Client": "destructive",
      "On Hold - Dev": "destructive", 
      "Completed": "secondary"
    };
    return variants[status] || "outline";
  };

  const getTimerButtonColor = () => {
    if (row.isTimerRunning) return "timer-active";
    return "timer-stopped";
  };

  return (
    <Card className="shadow-soft border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Task #{index + 1}
            </Badge>
            <Badge variant={getStatusBadgeVariant(row.status)}>
              {row.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Timer Display */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-lg font-bold border-2 transition-all duration-300 ${
                row.isTimerRunning 
                  ? 'bg-timer-active/10 border-timer-active text-timer-active shadow-timer' 
                  : 'bg-surface border-border text-foreground'
              }`}>
                <Clock className="w-4 h-4" />
                {formatTime(currentTime)}
              </div>
              
              {row.totalTime > 0 && (
                <div className="text-center">
                  <div className="text-sm font-semibold text-primary">
                    {getTotalTimeDisplay()}
                  </div>
                  <div className="text-xs text-foreground-muted">Total</div>
                </div>
              )}
            </div>
            
            {/* Timer Controls */}
            <div className="flex gap-1">
              {!row.isTimerRunning ? (
                <Button
                  size="sm"
                  onClick={startTimer}
                  className="bg-timer-active hover:bg-timer-active/90 text-white"
                >
                  <Play className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={pauseTimer}
                  className="bg-timer-paused hover:bg-timer-paused/90 text-white"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={stopTimer}
                className="border-timer-stopped hover:bg-timer-stopped/10"
              >
                <Square className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(row.id)}
                className="border-destructive hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Ticket Number</label>
            <Input
              value={row.ticketNumber}
              onChange={(e) => onUpdate(row.id, { ticketNumber: e.target.value })}
              placeholder="TKT-001"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Stub Name</label>
            <Select value={row.stubName} onValueChange={(value) => onUpdate(row.id, { stubName: value })}>
              <SelectTrigger className="bg-surface border-border">
                <SelectValue placeholder="Select stub" />
              </SelectTrigger>
              <SelectContent>
                {dropdownData.stubs.map((stub) => (
                  <SelectItem key={stub} value={stub}>{stub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">University</label>
            <Select value={row.university} onValueChange={(value) => onUpdate(row.id, { university: value })}>
              <SelectTrigger className="bg-surface border-border">
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                {dropdownData.universities.map((uni) => (
                  <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Domain</label>
            <Select value={row.domain} onValueChange={(value) => onUpdate(row.id, { domain: value })}>
              <SelectTrigger className="bg-surface border-border">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                {dropdownData.domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Client Type</label>
            <Select value={row.clientType} onValueChange={(value) => onUpdate(row.id, { clientType: value })}>
              <SelectTrigger className="bg-surface border-border">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {dropdownData.clientTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Task Name</label>
            <Select value={row.taskName} onValueChange={(value) => onUpdate(row.id, { taskName: value })}>
              <SelectTrigger className="bg-surface border-border">
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                {dropdownData.tasks.map((task) => (
                  <SelectItem key={task} value={task}>
                    <div className="flex justify-between items-center w-full">
                      <span>{task}</span>
                      {getTaskAHT(task) && (
                        <span className="text-xs text-foreground-muted ml-2">
                          AHT: {getTaskAHT(task)}min
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {taskAHT && (
              <div className="text-xs text-foreground-muted">
                Expected AHT: {taskAHT} minutes
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Count</label>
            <Input
              type="number"
              value={row.count || ""}
              onChange={(e) => onUpdate(row.id, { count: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Completed Count</label>
            <Input
              type="number"
              value={row.completedCount || ""}
              onChange={(e) => onUpdate(row.id, { completedCount: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="bg-surface border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-muted">Received Date</label>
            <Input
              type="date"
              value={row.receivedDate}
              onChange={(e) => onUpdate(row.id, { receivedDate: e.target.value })}
              className="bg-surface border-border"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-foreground-muted">Comments</label>
          <Textarea
            value={row.comments}
            onChange={(e) => onUpdate(row.id, { comments: e.target.value })}
            placeholder="Add any additional notes or comments..."
            className="bg-surface border-border resize-none"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};