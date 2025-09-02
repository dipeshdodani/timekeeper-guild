import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, Square, Trash2, Timer } from 'lucide-react';
import { getTaskAHT, getDropdownData } from '@/utils/dropdownStorage';

interface TimesheetRow {
  id: string;
  ticketNumber: string;
  category: string;
  subCategory: string;
  taskName: string;
  stubName: string;
  university: string;
  domain: string;
  clientType: string;
  status: string;
  receivedDate: string;
  ticketCount: number;
  caseCount: number;
  comments: string;
  totalTime: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
}

interface TimerRowProps {
  row: TimesheetRow;
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

const TimerRow: React.FC<TimerRowProps> = ({ 
  row, 
  dropdownData, 
  onUpdate, 
  onDelete, 
  onTimeUpdate 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [taskAHT, setTaskAHT] = useState<number>(0);

  // Update AHT when both category and subcategory are selected
  useEffect(() => {
    if (row.category && row.subCategory) {
      const taskKey = `${row.category} - ${row.subCategory}`;
      const aht = getTaskAHT(taskKey);
      if (aht !== null) {
        setTaskAHT(aht);
      } else {
        setTaskAHT(0); // Default to 0 if no AHT found
      }
    }
  }, [row.category, row.subCategory]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (row.isRunning && !row.isPaused) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          onTimeUpdate(1);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [row.isRunning, row.isPaused, onTimeUpdate]);

  const startTimer = () => {
    onUpdate(row.id, {
      isRunning: true,
      isPaused: false,
      startTime: Date.now()
    });
  };

  const pauseTimer = () => {
    onUpdate(row.id, {
      isRunning: false,
      isPaused: true,
      totalTime: row.totalTime + currentTime
    });
    setCurrentTime(0);
  };

  const stopTimer = () => {
    onUpdate(row.id, {
      isRunning: false,
      isPaused: false,
      totalTime: row.totalTime + currentTime,
      status: "Completed"
    });
    setCurrentTime(0);
  };

  const resetTimer = () => {
    setCurrentTime(0);
    onUpdate(row.id, {
      totalTime: 0,
      isRunning: false,
      isPaused: false,
      startTime: null
    });
  };

  // Helper functions to get categories and subcategories from AHT data
  const getUniqueCategories = () => {
    const data = getDropdownData();
    const categories = [...new Set(data.tasks.map(task => task.category))];
    return categories.sort();
  };

  const getSubCategoriesForCategory = (category: string) => {
    const data = getDropdownData();
    const subCategories = data.tasks
      .filter(task => task.category === category)
      .map(task => task.subCategory);
    return [...new Set(subCategories)].sort();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalTimeDisplay = (): string => {
    const totalSeconds = row.totalTime + currentTime;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "WIP": return "secondary";
      case "On Hold - Client": return "outline";
      case "On Hold - Dev": return "outline";
      default: return "secondary";
    }
  };

  const getTimerButtonColor = (isRunning: boolean, isPaused: boolean) => {
    if (isRunning && !isPaused) return "text-red-500";
    if (isPaused) return "text-yellow-500";
    return "text-primary";
  };

  return (
    <Card className="mb-4 shadow-soft border-border">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Task Info Section */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(row.status)} className="text-xs">
                {row.status}
              </Badge>
              {taskAHT > 0 && (
                <div className="flex items-center gap-1 text-xs text-foreground-muted">
                  <Timer className="w-3 h-3" />
                  <span>AHT: {taskAHT}min</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-foreground">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-foreground-muted">
                Total: {getTotalTimeDisplay()}
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              size="sm"
              onClick={startTimer}
              disabled={row.isRunning && !row.isPaused}
              className="bg-success hover:bg-success/90"
            >
              <Play className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={pauseTimer}
              disabled={!row.isRunning}
              className="bg-warning hover:bg-warning/90"
            >
              <Pause className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={stopTimer}
              disabled={!row.isRunning && !row.isPaused}
              variant="outline"
            >
              <Square className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={() => onDelete(row.id)}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ticket Number */}
            <div className="space-y-1">
              <Label htmlFor="ticketNumber" className="text-xs font-medium text-foreground-muted">Ticket Number</Label>
              <Input
                id="ticketNumber"
                value={row.ticketNumber}
                onChange={(e) => onUpdate(row.id, { ticketNumber: e.target.value })}
                placeholder="TKT-001"
                className="bg-surface border-border h-8 text-xs"
              />
            </div>

            {/* Stub Name */}
            <div className="space-y-1">
              <Label htmlFor="stubName" className="text-xs font-medium text-foreground-muted">Stub Name</Label>
              <Select 
                value={row.stubName || ""} 
                onValueChange={(value) => onUpdate(row.id, { stubName: value })}
              >
                <SelectTrigger className="bg-surface border-border h-8 text-xs">
                  <SelectValue placeholder="Select stub" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border z-50">
                  {dropdownData.stubs.map((stub) => (
                    <SelectItem key={stub} value={stub}>{stub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* University */}
            <div className="space-y-1">
              <Label htmlFor="university" className="text-xs font-medium text-foreground-muted">University</Label>
              <Select 
                value={row.university || ""} 
                onValueChange={(value) => onUpdate(row.id, { university: value })}
              >
                <SelectTrigger className="bg-surface border-border h-8 text-xs">
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border z-50">
                  {dropdownData.universities.map((university) => (
                    <SelectItem key={university} value={university}>{university}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domain */}
            <div className="space-y-1">
              <Label htmlFor="domain" className="text-xs font-medium text-foreground-muted">Domain</Label>
              <Select 
                value={row.domain || ""} 
                onValueChange={(value) => onUpdate(row.id, { domain: value })}
              >
                <SelectTrigger className="bg-surface border-border h-8 text-xs">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border z-50">
                  {dropdownData.domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Main Category Selection */}
            <div className="space-y-1">
              <Label htmlFor="category" className="text-xs font-medium text-foreground-muted">Main Category</Label>
              <Select 
                value={row.category || ""} 
                onValueChange={(value) => onUpdate(row.id, { category: value, subCategory: "", taskName: "" })}
              >
                <SelectTrigger className="bg-surface border-border h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border z-50">
                  {getUniqueCategories().map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub Category Selection */}
            <div className="space-y-1">
              <Label htmlFor="subCategory" className="text-xs font-medium text-foreground-muted">Sub Category</Label>
              <Select 
                value={row.subCategory || ""} 
                onValueChange={(value) => {
                  const taskName = row.category ? `${row.category} - ${value}` : value;
                  onUpdate(row.id, { subCategory: value, taskName });
                }}
                disabled={!row.category}
              >
                <SelectTrigger className="bg-surface border-border h-8 text-xs">
                  <SelectValue placeholder="Select sub category" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border z-50">
                  {getSubCategoriesForCategory(row.category || "").map((subCategory) => (
                    <SelectItem key={subCategory} value={subCategory}>{subCategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Type */}
            <div className="space-y-1">
              <Label htmlFor="clientType" className="text-xs font-medium text-foreground-muted">Client Type</Label>
              <Select 
                value={row.clientType || ""} 
                onValueChange={(value) => onUpdate(row.id, { clientType: value })}
              >
                <SelectTrigger className="bg-surface border-border h-8 text-xs">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border z-50">
                  {dropdownData.clientTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs font-medium text-foreground-muted">Status</Label>
              <Select 
                value={row.status || ""} 
                onValueChange={(value) => onUpdate(row.id, { status: value })}
              >
                <SelectTrigger className="bg-surface border-border h-8 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-surface border-border z-50">
                  {dropdownData.statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ticket Count */}
            <div className="space-y-1">
              <Label htmlFor="ticketCount" className="text-xs font-medium text-foreground-muted">Ticket Count</Label>
              <Input
                id="ticketCount"
                type="number"
                value={row.ticketCount || ""}
                onChange={(e) => onUpdate(row.id, { ticketCount: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="bg-surface border-border h-8 text-xs"
              />
            </div>

            {/* Case Count */}
            <div className="space-y-1">
              <Label htmlFor="caseCount" className="text-xs font-medium text-foreground-muted">Case Count</Label>
              <Input
                id="caseCount"
                type="number"
                value={row.caseCount || ""}
                onChange={(e) => onUpdate(row.id, { caseCount: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="bg-surface border-border h-8 text-xs"
              />
            </div>

            {/* Received Date */}
            <div className="space-y-1">
              <Label htmlFor="receivedDate" className="text-xs font-medium text-foreground-muted">Received Date</Label>
              <Input
                id="receivedDate"
                type="date"
                value={row.receivedDate}
                onChange={(e) => onUpdate(row.id, { receivedDate: e.target.value })}
                className="bg-surface border-border h-8 text-xs"
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-1">
            <Label htmlFor="comments" className="text-xs font-medium text-foreground-muted">Comments</Label>
            <Textarea
              id="comments"
              value={row.comments}
              onChange={(e) => onUpdate(row.id, { comments: e.target.value })}
              placeholder="Add any additional notes..."
              className="bg-surface border-border text-xs resize-none"
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimerRow;