import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";

export type FilterPeriod = "this-week" | "day" | "month" | "year";

interface PerformanceFiltersProps {
  onFilterChange: (period: FilterPeriod, startDate: Date, endDate: Date) => void;
  className?: string;
}

export const PerformanceFilters = ({ onFilterChange, className }: PerformanceFiltersProps) => {
  const [activePeriod, setActivePeriod] = useState<FilterPeriod>("this-week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), "yyyy"));

  const handlePeriodChange = (period: FilterPeriod) => {
    setActivePeriod(period);
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "this-week":
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
        break;
      case "day":
        startDate = selectedDate;
        endDate = selectedDate;
        break;
      case "month":
        const monthDate = new Date(selectedMonth + "-01");
        startDate = startOfMonth(monthDate);
        endDate = endOfMonth(monthDate);
        break;
      case "year":
        const yearDate = new Date(selectedYear + "-01-01");
        startDate = startOfYear(yearDate);
        endDate = endOfYear(yearDate);
        break;
    }

    onFilterChange(period, startDate, endDate);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (activePeriod === "day") {
        onFilterChange("day", date, date);
      }
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (activePeriod === "month") {
      const monthDate = new Date(month + "-01");
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);
      onFilterChange("month", startDate, endDate);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (activePeriod === "year") {
      const yearDate = new Date(year + "-01-01");
      const startDate = startOfYear(yearDate);
      const endDate = endOfYear(yearDate);
      onFilterChange("year", startDate, endDate);
    }
  };

  // Initialize with current week
  React.useEffect(() => {
    handlePeriodChange("this-week");
  }, []);

  // Generate year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4" />
        <h3 className="font-medium">Filter Performance Data</h3>
      </div>

      {/* Period Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activePeriod === "this-week" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriodChange("this-week")}
        >
          This Week
        </Button>
        <Button
          variant={activePeriod === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriodChange("day")}
        >
          Day
        </Button>
        <Button
          variant={activePeriod === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriodChange("month")}
        >
          Month
        </Button>
        <Button
          variant={activePeriod === "year" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriodChange("year")}
        >
          Year
        </Button>
      </div>

      {/* Date/Month/Year Pickers */}
      <div className="space-y-3">
        {activePeriod === "day" && (
          <div>
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-surface border-border",
                    !selectedDate && "text-foreground-muted"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {activePeriod === "month" && (
          <div>
            <Label>Select Month</Label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="bg-surface border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(currentYear, i, 1);
                  const value = format(date, "yyyy-MM");
                  const label = format(date, "MMMM yyyy");
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
                {/* Previous year months */}
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(currentYear - 1, i, 1);
                  const value = format(date, "yyyy-MM");
                  const label = format(date, "MMMM yyyy");
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {activePeriod === "year" && (
          <div>
            <Label>Select Year</Label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="bg-surface border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Current Filter Display */}
      <div className="text-sm text-foreground-muted p-3 bg-muted rounded-lg">
        <strong>Current Filter:</strong>{" "}
        {activePeriod === "this-week" && "This Week (Monday to Sunday)"}
        {activePeriod === "day" && format(selectedDate, "PPP")}
        {activePeriod === "month" && format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
        {activePeriod === "year" && selectedYear}
      </div>
    </div>
  );
};