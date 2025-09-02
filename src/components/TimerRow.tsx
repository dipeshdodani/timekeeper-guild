import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
    <Card className="mb-2 shadow-sm border-border">
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Compact Task Info Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(row.status)} className="text-xs py-0 px-2 h-5">
                {row.status}
              </Badge>
              {taskAHT > 0 && (
                <div className="flex items-center gap-1 text-xs text-foreground-muted">
                  <Timer className="w-3 h-3" />
                  <span>AHT: {taskAHT}min</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-mono text-foreground">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-foreground-muted">
                  Total: {getTotalTimeDisplay()}
                </div>
              </div>
              {/* Compact Timer Controls */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={startTimer}
                  disabled={row.isRunning && !row.isPaused}
                  className="bg-success hover:bg-success/90 h-7 w-7 p-0"
                >
                  <Play className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={pauseTimer}
                  disabled={!row.isRunning}
                  className="bg-warning hover:bg-warning/90 h-7 w-7 p-0"
                >
                  <Pause className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={stopTimer}
                  disabled={!row.isRunning && !row.isPaused}
                  variant="outline"
                  className="h-7 w-7 p-0"
                >
                  <Square className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onDelete(row.id)}
                  variant="destructive"
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Compact Form Fields Grid - Excel-like Row */}
          <div className="grid grid-cols-6 lg:grid-cols-12 gap-2 text-xs">
            {/* Ticket Number */}
            <div className="col-span-1">
              <Input
                value={row.ticketNumber}
                onChange={(e) => onUpdate(row.id, { ticketNumber: e.target.value })}
                placeholder="Ticket #"
                className="h-7 text-xs border-border"
              />
            </div>

            {/* Stub Name */}
            <div className="col-span-1 lg:col-span-2">
              <SearchableSelect
                value={row.stubName || ""}
                onValueChange={(value) => onUpdate(row.id, { stubName: value })}
                options={dropdownData.stubs}
                placeholder="Stub"
                searchPlaceholder="Search stubs..."
                className="h-7 text-xs"
              />
            </div>

            {/* University */}
            <div className="col-span-1 lg:col-span-2">
              <SearchableSelect
                value={row.university || ""}
                onValueChange={(value) => onUpdate(row.id, { university: value })}
                options={dropdownData.universities}
                placeholder="University"
                searchPlaceholder="Search universities..."
                className="h-7 text-xs"
              />
            </div>

            {/* Domain */}
            <div className="col-span-1">
              <SearchableSelect
                value={row.domain || ""}
                onValueChange={(value) => onUpdate(row.id, { domain: value })}
                options={dropdownData.domains}
                placeholder="Domain"
                searchPlaceholder="Search domains..."
                className="h-7 text-xs"
              />
            </div>

            {/* Main Category */}
            <div className="col-span-1 lg:col-span-2">
              <SearchableSelect
                value={row.category || ""}
                onValueChange={(value) => onUpdate(row.id, { category: value, subCategory: "", taskName: "" })}
                options={getUniqueCategories()}
                placeholder="Category"
                searchPlaceholder="Search categories..."
                className="h-7 text-xs"
              />
            </div>

            {/* Sub Category */}
            <div className="col-span-1 lg:col-span-2">
              <SearchableSelect
                value={row.subCategory || ""}
                onValueChange={(value) => {
                  const taskName = row.category ? `${row.category} - ${value}` : value;
                  onUpdate(row.id, { subCategory: value, taskName });
                }}
                options={getSubCategoriesForCategory(row.category || "")}
                placeholder="Sub Category"
                searchPlaceholder="Search subcategories..."
                disabled={!row.category}
                className="h-7 text-xs"
              />
            </div>

            {/* Client Type - Compact */}
            <div className="col-span-1">
              <SearchableSelect
                value={row.clientType || ""}
                onValueChange={(value) => onUpdate(row.id, { clientType: value })}
                options={dropdownData.clientTypes}
                placeholder="Client"
                searchPlaceholder="Search client types..."
                className="h-7 text-xs"
              />
            </div>

            {/* Status - Compact */}
            <div className="col-span-1">
              <Select 
                value={row.status || ""} 
                onValueChange={(value) => onUpdate(row.id, { status: value })}
              >
                <SelectTrigger className="h-7 text-xs border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {dropdownData.statuses.map((status) => (
                    <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Count - Compact */}
            <div className="col-span-1">
              <Input
                type="number"
                value={row.ticketCount || ""}
                onChange={(e) => onUpdate(row.id, { ticketCount: parseInt(e.target.value) || 0 })}
                placeholder="Data #"
                className="h-7 text-xs border-border"
              />
            </div>

            {/* Case Count - Compact */}
            <div className="col-span-1">
              <Input
                type="number"
                value={row.caseCount || ""}
                onChange={(e) => onUpdate(row.id, { caseCount: parseInt(e.target.value) || 0 })}
                placeholder="Cases"
                className="h-7 text-xs border-border"
              />
            </div>

            {/* Received Date - Compact */}
            <div className="col-span-1">
              <Input
                type="date"
                value={row.receivedDate}
                onChange={(e) => onUpdate(row.id, { receivedDate: e.target.value })}
                className="h-7 text-xs border-border"
              />
            </div>
          </div>

          {/* Comments - Full Width */}
          <div>
            <Textarea
              value={row.comments}
              onChange={(e) => onUpdate(row.id, { comments: e.target.value })}
              placeholder="Comments..."
              className="text-xs resize-none border-border"
              rows={1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimerRow;