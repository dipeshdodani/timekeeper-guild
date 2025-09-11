import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';
import { DateFilterMode } from '@/utils/dateHelpers';

export const GlobalDateFilter: React.FC = () => {
  const { globalDateFilter, setDateFilter } = useDashboard();

  const handleModeChange = (mode: DateFilterMode) => {
    if (mode !== 'custom-range') {
      setDateFilter(mode);
    } else {
      // Keep existing custom dates if available
      setDateFilter(mode, globalDateFilter.startDate, globalDateFilter.endDate);
    }
  };

  const handleCustomDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    if (type === 'start') {
      setDateFilter('custom-range', date, globalDateFilter.endDate);
    } else {
      setDateFilter('custom-range', globalDateFilter.startDate, date);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date-mode">Date Range</Label>
        <Select value={globalDateFilter.mode} onValueChange={handleModeChange}>
          <SelectTrigger className="bg-surface border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="custom-range">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {globalDateFilter.mode === 'custom-range' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !globalDateFilter.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {globalDateFilter.startDate ? (
                    format(globalDateFilter.startDate, "PPP")
                  ) : (
                    <span>Pick start date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={globalDateFilter.startDate}
                  onSelect={(date) => handleCustomDateChange('start', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !globalDateFilter.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {globalDateFilter.endDate ? (
                    format(globalDateFilter.endDate, "PPP")
                  ) : (
                    <span>Pick end date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={globalDateFilter.endDate}
                  onSelect={(date) => handleCustomDateChange('end', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};
