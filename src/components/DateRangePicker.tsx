import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subWeeks, subMonths, subQuarters, isAfter, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DateRangePickerProps {
  value: string;
  onChange: (value: string, startDate?: Date, endDate?: Date) => void;
  className?: string;
}

export const DateRangePicker = ({ value, onChange, className }: DateRangePickerProps) => {
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showDateInputs, setShowDateInputs] = useState(value === "custom");
  const [error, setError] = useState<string>("");

  const presetOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this-week", label: "This Week" },
    { value: "last-week", label: "Last Week" },
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "this-quarter", label: "This Quarter" },
    { value: "last-quarter", label: "Last Quarter" },
    { value: "custom", label: "Custom Range" }
  ];

  const handlePresetChange = (newValue: string) => {
    setError("");
    setShowDateInputs(newValue === "custom");
    
    if (newValue !== "custom") {
      onChange(newValue);
    } else {
      // Reset custom dates when switching to custom
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const validateAndSetCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (isAfter(customStartDate, customEndDate)) {
      setError("Start date must be before end date");
      return;
    }

    const daysDifference = differenceInDays(customEndDate, customStartDate);
    if (daysDifference > 365) {
      setError("Date range cannot exceed 1 year (365 days)");
      return;
    }

    if (isAfter(customEndDate, new Date())) {
      setError("End date cannot be in the future");
      return;
    }

    setError("");
    onChange("custom", customStartDate, customEndDate);
  };

  const getDateRangeDisplay = () => {
    const now = new Date();
    
    switch (value) {
      case "today":
        return format(now, "PPP");
      case "yesterday":
        return format(subDays(now, 1), "PPP");
      case "this-week":
        return "This Week";
      case "last-week":
        return "Last Week";
      case "this-month":
        return "This Month";
      case "last-month":
        return "Last Month";
      case "this-quarter":
        return "This Quarter";
      case "last-quarter":
        return "Last Quarter";
      case "custom":
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, "PP")} - ${format(customEndDate, "PP")}`;
        }
        return "Select custom range";
      default:
        return "Select date range";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label htmlFor="dateRange">Date Range</Label>
        <Select value={value} onValueChange={handlePresetChange}>
          <SelectTrigger className="bg-surface border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range Inputs */}
      {showDateInputs && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-surface border-border",
                      !customStartDate && "text-foreground-muted"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    disabled={(date) => isAfter(date, new Date())}
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
                      "w-full justify-start text-left font-normal bg-surface border-border",
                      !customEndDate && "text-foreground-muted"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    disabled={(date) => 
                      isAfter(date, new Date()) || 
                      (customStartDate && isAfter(customStartDate, date))
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Apply Custom Range Button */}
          <Button 
            onClick={validateAndSetCustomRange}
            disabled={!customStartDate || !customEndDate}
            className="w-full"
          >
            Apply Custom Range
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Current Selection Display */}
      <div className="text-sm text-foreground-muted">
        <strong>Selected:</strong> {getDateRangeDisplay()}
      </div>
    </div>
  );
};