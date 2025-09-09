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
import { useTimer } from '@/hooks/useTimer';
import * as TimerStore from '@/services/PerformanceTimerService';

interface TimesheetRow {
  id: string;
  ticketNumber: string;
  category: string;
  subCategory: string;
  activityType: string;
  taskName: string;
  stubName: string;
  university: string;
  domain: string;
  clientType: string;
  status: string;
  receivedDate: string;
  ticketCount: number;
  comments: string;
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
  onStartTimer: (id: string) => void;
  onPauseTimer: (id: string) => void;
  onStopTimer: (id: string) => void;
  isOnGlobalBreak: boolean;
}

const TimerRow: React.FC<TimerRowProps> = ({ 
  row, 
  dropdownData, 
  onUpdate, 
  onDelete,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
  isOnGlobalBreak
}) => {
  const [taskAHT, setTaskAHT] = useState<number>(0);
  
  // Use timer hook for real-time updates
  const timer = useTimer(row.id);

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "WIP": return "secondary";
      case "On Hold - Client": return "outline";
      case "On Hold - Dev": return "outline";
      default: return "secondary";
    }
  };

  // Timer display function
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer state comes from hook
  const isTimerActive = timer.isRunning;

  return (
    <Card className="shadow-sm border-border">
        <CardContent className="p-3">
          <div className="space-y-3">
            {/* Row Header with Timer Controls and Status */}
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
                
                {/* Timer Display */}
                <div className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1">
                  <Timer className="w-3 h-3 text-primary" />
                  <span className="text-xs font-mono text-foreground">
                    {formatTime(timer.currentTime)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Timer Controls */}
                <div className="flex items-center gap-1">
                  {!isTimerActive ? (
                    <Button
                      size="sm"
                      onClick={() => onStartTimer(row.id)}
                      variant="outline"
                      className="h-6 w-6 p-0"
                      disabled={isOnGlobalBreak}
                      title={isOnGlobalBreak ? "Cannot start timer while on break" : "Start timer"}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onPauseTimer(row.id)}
                      variant="outline"
                      className="h-6 w-6 p-0"
                      title="Pause timer"
                    >
                      <Pause className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={() => onStopTimer(row.id)}
                    variant="outline"
                    className="h-6 w-6 p-0"
                    title="Stop timer"
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => onDelete(row.id)}
                  variant="destructive"
                  className="h-6 w-6 p-0 ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Form Fields Grid - Excel-like Row */}
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

            {/* Activity Type - NEW/BAU Only */}
            <div className="col-span-1">
              <Select 
                value={row.activityType || ""} 
                onValueChange={(value) => onUpdate(row.id, { activityType: value })}
              >
                <SelectTrigger className="h-7 text-xs border-border">
                  <SelectValue placeholder="NEW/BAU" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="NEW" className="text-xs">NEW</SelectItem>
                  <SelectItem value="BAU" className="text-xs">BAU</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Default AHT/Record - Display Only */}
            <div className="col-span-1">
              <Input
                value={taskAHT > 0 ? `${taskAHT}min` : "N/A"}
                readOnly
                placeholder="AHT"
                className="h-7 text-xs border-border bg-muted"
                title="Default AHT from dropdown management"
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