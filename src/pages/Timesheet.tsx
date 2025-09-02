import { useState, useEffect } from "react";
import { getSimpleDropdownData } from "@/utils/dropdownStorage";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Plus, Coffee, Send } from "lucide-react";
import TimerRow from "@/components/TimerRow";
import { AvailabilityTracker } from "@/components/AvailabilityTracker";
import { useToast } from "@/hooks/use-toast";

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

const Timesheet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [totalLoggedTime, setTotalLoggedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/");
      return;
    }
    setUserRole(role);

    // Load saved timesheet data
    const savedData = localStorage.getItem(`timesheet-${new Date().toDateString()}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setRows(parsed.rows || []);
      setTotalLoggedTime(parsed.totalLoggedTime || 0);
      setBreakTime(parsed.breakTime || 0);
    } else {
      // Initialize with one empty row
      addNewRow();
    }
  }, [navigate]);

  const addNewRow = () => {
    const newRow: TimesheetRow = {
      id: Date.now().toString(),
      ticketNumber: "",
      category: "",
      subCategory: "",
      taskName: "",
      stubName: "",
      university: "",
      domain: "",
      clientType: "",
      status: "Not Started",
      receivedDate: "",
      ticketCount: 0,
      caseCount: 0,
      comments: "",
      totalTime: 0,
      isRunning: false,
      isPaused: false,
      startTime: null
    };
    setRows(prev => [...prev, newRow]);
  };

  const updateRow = (id: string, updates: Partial<TimesheetRow>) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, ...updates } : row
    ));
    saveToLocalStorage();
  };

  const saveToLocalStorage = () => {
    const dataToSave = {
      rows,
      totalLoggedTime,
      breakTime,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`timesheet-${new Date().toDateString()}`, JSON.stringify(dataToSave));
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
    saveToLocalStorage();
  };

  const toggleBreak = () => {
    if (isOnBreak) {
      // End break
      const breakDuration = breakStartTime ? Date.now() - breakStartTime : 0;
      setBreakTime(prev => prev + Math.floor(breakDuration / 1000));
      setBreakStartTime(null);
      setIsOnBreak(false);
    } else {
      // Start break - pause all running timers
      setRows(prev => prev.map(row => 
        row.isRunning ? { ...row, isRunning: false, isPaused: true } : row
      ));
      setBreakStartTime(Date.now());
      setIsOnBreak(true);
    }
    saveToLocalStorage();
  };

  const handleSubmit = () => {
    toast({
      title: "Timesheet Submitted",
      description: "Your timesheet has been submitted successfully.",
    });
    console.log("Submitting timesheet data:", { rows, totalLoggedTime, breakTime });
    navigate("/dashboard");
  };

  const handleTimeUpdate = (seconds: number) => {
    setTotalLoggedTime(prev => prev + seconds);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get dropdown data from uploaded lists
  const dropdownData = getSimpleDropdownData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      {/* Header */}
      <header className="bg-surface shadow-soft border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Daily Timesheet</h1>
                <p className="text-sm text-foreground-muted">Track your work hours</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Break Controls */}
              <Button
                variant={isOnBreak ? "destructive" : "outline"}
                size="sm"
                onClick={toggleBreak}
                className="flex items-center gap-2"
              >
                <Coffee className="w-4 h-4" />
                {isOnBreak ? "End Break" : "Take Break"}
              </Button>
              
              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Timesheet
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Tracker */}
        <div className="mb-8">
          <AvailabilityTracker 
            totalLoggedTime={totalLoggedTime}
            breakTime={breakTime}
            isOnBreak={isOnBreak}
            targetHours={8}
          />
        </div>

        {/* Timesheet Rows */}
        <Card className="shadow-soft border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-foreground">
                Time Entries
              </CardTitle>
              <Button
                onClick={addNewRow}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map((row) => (
              <TimerRow
                key={row.id}
                row={row}
                dropdownData={dropdownData}
                onUpdate={updateRow}
                onDelete={deleteRow}
                onTimeUpdate={handleTimeUpdate}
              />
            ))}
            
            {rows.length === 0 && (
              <div className="text-center py-8 text-foreground-muted">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No time entries yet. Click "Add Entry" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="mt-8 flex justify-end">
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Total Logged Time:</span>
                  <Badge variant="secondary" className="text-sm">
                    {formatTime(totalLoggedTime)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Break Time:</span>
                  <Badge variant="outline" className="text-sm">
                    {formatTime(breakTime)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-foreground">Net Work Time:</span>
                  <Badge variant="default" className="text-sm">
                    {formatTime(Math.max(0, totalLoggedTime - breakTime))}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Timesheet;