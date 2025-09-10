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
import { useTimerSummary } from "@/hooks/useTimer";
import * as TimerStore from "@/services/PerformanceTimerService";
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
}

const Timesheet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [globalBreakTime, setGlobalBreakTime] = useState<number>(0);
  const [isOnGlobalBreak, setIsOnGlobalBreak] = useState<boolean>(false);
  const [globalBreakStartTime, setGlobalBreakStartTime] = useState<number | null>(null);
  
  // Timer summary hook for real-time totals
  const timerSummary = useTimerSummary();

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
      const rows = parsed.rows || [];
      setRows(rows);
      
      // No need to clean up orphaned timers with new service
    } else {
      // Initialize with one empty row
      addNewRow();
    }

    // Timer service handles its own cleanup
  }, [navigate]);

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
      status: "In Progress",
      receivedDate: new Date().toISOString().split('T')[0],
      ticketCount: 1,
      comments: ""
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
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`timesheet-${new Date().toDateString()}`, JSON.stringify(dataToSave));
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
    // Stop timer if it's running for this task
    if (TimerStore.isRunning(id)) {
      TimerStore.pause(id);
    }
    saveToLocalStorage();
  };

  const handleSubmit = async () => {
    try {
      // Pause all active timers before submitting
      const allTimers = TimerStore.getAllTimers();
      allTimers.forEach(timer => {
        if (TimerStore.isRunning(timer.taskId)) {
          TimerStore.pause(timer.taskId);
        }
      });

      // Get final timer data and save submission
      const finalRows = rows.map((row) => {
        const totalTime = TimerStore.getCurrentTime(row.id);
        return {
          ...row,
          totalTime
        };
      });

      saveSubmittedTimesheet(finalRows);
      
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

  // Total logged time is managed via subscription above

  // Timer control functions
  const handleStartTimer = (id: string) => {
    const currentlyRunning = TimerStore.getRunningTimerId();
    
    // If starting a different timer, notify user about the switch
    if (currentlyRunning && currentlyRunning !== id) {
      const runningRow = rows.find(row => row.id === currentlyRunning);
      const newRow = rows.find(row => row.id === id);
      
      toast({
        title: "Timer Switched",
        description: `Paused "${runningRow?.taskName || 'previous task'}" and started "${newRow?.taskName || 'new task'}"`,
      });
    }
    
    TimerStore.start(id);
  };

  const handlePauseTimer = (id: string) => {
    TimerStore.pause(id);
  };

  const handleStopTimer = (id: string) => {
    TimerStore.reset(id);
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
      if (timerSummary.hasActiveTask) {
        const allTimers = TimerStore.getAllTimers();
        allTimers.forEach(timer => {
          if (TimerStore.isRunning(timer.taskId)) {
            TimerStore.pause(timer.taskId);
          }
        });
      }
      setIsOnGlobalBreak(true);
      setGlobalBreakStartTime(Date.now());
    }
  };

  // No need for manual re-render interval - hooks handle this

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
          totalLoggedTime={timerSummary.totalLoggedTime}
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