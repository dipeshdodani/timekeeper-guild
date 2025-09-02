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
import { useGlobalTimer, setupTimerCleanup } from "@/hooks/useGlobalTimer";
import { saveSubmittedTimesheet } from "@/utils/timesheetStorage";

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
  // Timer fields
  isActive: boolean;
  totalTime: number;
  startTime: number | null;
}

const Timesheet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [globalBreakTime, setGlobalBreakTime] = useState<number>(0);
  const [isOnGlobalBreak, setIsOnGlobalBreak] = useState<boolean>(false);
  const [globalBreakStartTime, setGlobalBreakStartTime] = useState<number | null>(null);
  
  // Use global timer hook
  const { 
    startTimer, 
    pauseTimer, 
    stopTimer, 
    stopAllTimers,
    clearAllTimers,
    cleanupOrphanedTimers,
    getTimer, 
    getCurrentTime, 
    hasActiveTimer, 
    removeTimer 
  } = useGlobalTimer();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/");
      return;
    }
    setUserRole(role);

    // Debug: Check timer state before loading
    console.log("Loading timesheet page, checking timer state...");
    
    // Load saved timesheet data
    const savedData = localStorage.getItem(`timesheet-${new Date().toDateString()}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const rows = parsed.rows || [];
      setRows(rows);
      
      // Clean up orphaned timers that don't match current row IDs
      const validRowIds = rows.map((row: TimesheetRow) => row.id);
      cleanupOrphanedTimers(validRowIds);
      
      // CRITICAL: Stop all active timers when loading the page
      // This ensures no phantom timers continue running from previous sessions
      console.log("Stopping all active timers on page load...");
      stopAllTimers();
    } else {
      // Initialize with one empty row
      addNewRow();
      // Also stop any phantom timers for fresh start
      stopAllTimers();
    }

    // Setup timer cleanup on app close
    const cleanup = setupTimerCleanup();
    return cleanup;
  }, [navigate, stopAllTimers, cleanupOrphanedTimers]);

  const addNewRow = () => {
    const newRow: TimesheetRow = {
      id: Date.now().toString(),
      ticketNumber: "",
      category: "",
      subCategory: "",
      activityType: "",
      taskName: "",
      stubName: "",
      university: "",
      domain: "",
      clientType: "",
      status: "Not Started",
      receivedDate: "",
      ticketCount: 0,
      comments: "",
      // Timer fields
      isActive: false,
      totalTime: 0,
      startTime: null
    };
    setRows(prev => [...prev, newRow]);
  };

  const updateRow = (id: string, updates: Partial<TimesheetRow>) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        // Sync timer data from global state
        const timer = getTimer(id);
        return { 
          ...row, 
          ...updates,
          totalTime: timer ? timer.totalTime : row.totalTime,
          isActive: timer ? timer.isActive : false,
          startTime: timer ? timer.startTime : null
        };
      }
      return row;
    }));
    saveToLocalStorage();
  };

  const saveToLocalStorage = () => {
    const dataToSave = {
      rows,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`timesheet-${new Date().toDateString()}`, JSON.stringify(dataToSave));
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
    removeTimer(id); // Clean up timer state
    saveToLocalStorage();
  };

  const handleSubmit = () => {
    try {
      // Stop all active timers before submitting
      stopAllTimers();

      // Get final timer data and save submission
      const finalRows = rows.map(row => {
        const timer = getTimer(row.id);
        return {
          ...row,
          totalTime: timer ? timer.totalTime : row.totalTime,
          isActive: false,
          startTime: null
        };
      });

      saveSubmittedTimesheet(finalRows);
      
      // Clear all timer data after successful submission
      clearAllTimers();
      
      toast({
        title: "Timesheet Submitted",
        description: "Your timesheet has been submitted successfully.",
      });
      
      console.log("Submitting timesheet data:", finalRows);
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your timesheet. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate total logged time from all rows (using global timer state)
  const totalLoggedTime = rows.reduce((total, row) => {
    return total + getCurrentTime(row.id);
  }, 0);

  // Timer control functions (now use global timer)
  const handleStartTimer = (id: string) => {
    startTimer(id);
    // Sync local state with timer state
    setRows(prev => prev.map(row => {
      const timer = getTimer(row.id);
      return {
        ...row,
        isActive: timer ? timer.isActive : false,
        startTime: timer ? timer.startTime : null
      };
    }));
  };

  const handlePauseTimer = (id: string) => {
    pauseTimer(id);
    // Sync local state with timer state
    setRows(prev => prev.map(row => {
      const timer = getTimer(row.id);
      return {
        ...row,
        isActive: timer ? timer.isActive : false,
        startTime: timer ? timer.startTime : null,
        totalTime: timer ? timer.totalTime : row.totalTime
      };
    }));
  };

  const handleStopTimer = (id: string) => {
    stopTimer(id);
    // Sync local state with timer state
    setRows(prev => prev.map(row => {
      const timer = getTimer(row.id);
      return {
        ...row,
        isActive: timer ? timer.isActive : false,
        startTime: timer ? timer.startTime : null,
        totalTime: timer ? timer.totalTime : row.totalTime
      };
    }));
  };

  const toggleGlobalBreak = () => {
    if (isOnGlobalBreak) {
      // End break
      if (globalBreakStartTime) {
        const breakDuration = Math.floor((Date.now() - globalBreakStartTime) / 1000);
        setGlobalBreakTime(prev => prev + breakDuration);
      }
      setIsOnGlobalBreak(false);
      setGlobalBreakStartTime(null);
    } else {
      // Start break - pause all active timers
      rows.forEach(row => {
        if (row.isActive) {
          pauseTimer(row.id);
        }
      });
      
      // Sync local state
      setRows(prev => prev.map(row => {
        const timer = getTimer(row.id);
        return {
          ...row,
          isActive: timer ? timer.isActive : false,
          startTime: timer ? timer.startTime : null,
          totalTime: timer ? timer.totalTime : row.totalTime
        };
      }));
      
      setIsOnGlobalBreak(true);
      setGlobalBreakStartTime(Date.now());
    }
  };

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRows(prev => [...prev]); // Force re-render to update current time display
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
              {/* Break Button */}
              <Button
                onClick={toggleGlobalBreak}
                variant={isOnGlobalBreak ? "destructive" : "outline"}
                className="flex items-center gap-2"
              >
                <Coffee className="w-4 h-4" />
                {isOnGlobalBreak ? "End Break" : "Start Break"}
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
        {/* Availability Tracker */}
        <AvailabilityTracker
          totalLoggedTime={totalLoggedTime}
          breakTime={globalBreakTime + (isOnGlobalBreak && globalBreakStartTime ? Math.floor((Date.now() - globalBreakStartTime) / 1000) : 0)}
          isOnBreak={isOnGlobalBreak}
          targetHours={8}
          workTargetHours={8}
        />

        {/* Timesheet Rows */}
        <div className="space-y-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Timesheet Entries
          </CardTitle>
          
          {/* Column Headers */}
          <div className="grid grid-cols-6 lg:grid-cols-12 gap-2 text-xs font-medium text-foreground-muted bg-muted/50 p-2 rounded-md border">
            <div className="col-span-1">Ticket #</div>
            <div className="col-span-1 lg:col-span-2">Stub Name</div>
            <div className="col-span-1 lg:col-span-2">University</div>
            <div className="col-span-1">Domain</div>
            <div className="col-span-1 lg:col-span-2">Main Category</div>
            <div className="col-span-1 lg:col-span-2">Sub Category</div>
            <div className="col-span-1">Activity Type</div>
            <div className="col-span-1">Client Type</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Data Count</div>
            <div className="col-span-1">AHT / Unit</div>
            <div className="col-span-1">Received Date</div>
          </div>
          
          {rows.map((row) => (
            <TimerRow
              key={row.id}
              row={row}
              dropdownData={dropdownData}
              onUpdate={updateRow}
              onDelete={deleteRow}
              onStartTimer={handleStartTimer}
              onPauseTimer={handlePauseTimer}
              onStopTimer={handleStopTimer}
              isOnGlobalBreak={isOnGlobalBreak}
            />
          ))}
          
          {rows.length === 0 && (
            <div className="text-center py-8 text-foreground-muted">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No time entries yet. Click "Add Entry" to get started.</p>
            </div>
          )}

          {/* Add Entry Button at Bottom */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={addNewRow}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timesheet;