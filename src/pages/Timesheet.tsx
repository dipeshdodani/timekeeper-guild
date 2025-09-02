import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Save, 
  ArrowLeft,
  Coffee,
  Timer as TimerIcon
} from "lucide-react";
import { TimerRow } from "@/components/TimerRow";
import { AvailabilityTracker } from "@/components/AvailabilityTracker";

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
  totalTime: number; // in seconds
  isTimerRunning: boolean;
}

const Timesheet = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [totalLoggedTime, setTotalLoggedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/");
      return;
    }
    setUserRole(role);
    
    // Initialize with one empty row
    addNewRow();
  }, [navigate]);

  const addNewRow = () => {
    const newRow: TimesheetRow = {
      id: Date.now().toString(),
      ticketNumber: "",
      stubName: "",
      university: "",
      domain: "",
      clientType: "",
      taskName: "",
      count: 0,
      completedCount: 0,
      comments: "",
      receivedDate: "",
      status: "Not Started",
      startTime: null,
      endTime: null,
      totalTime: 0,
      isTimerRunning: false
    };
    setRows(prev => [...prev, newRow]);
  };

  const updateRow = (id: string, updates: Partial<TimesheetRow>) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, ...updates } : row
    ));
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const toggleBreak = () => {
    if (isOnBreak) {
      // End break
      if (breakStartTime) {
        const breakDuration = (Date.now() - breakStartTime.getTime()) / 1000;
        setBreakTime(prev => prev + breakDuration);
      }
      setIsOnBreak(false);
      setBreakStartTime(null);
    } else {
      // Start break - pause all running timers
      setRows(prev => prev.map(row => 
        row.isTimerRunning 
          ? { ...row, isTimerRunning: false, endTime: new Date() }
          : row
      ));
      setIsOnBreak(true);
      setBreakStartTime(new Date());
    }
  };

  const handleSubmit = () => {
    // Here you would submit to Supabase
    console.log("Submitting timesheet:", { rows, totalLoggedTime, breakTime });
    // Show success message and redirect
    navigate("/dashboard");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Mock dropdown data
  const dropdownData = {
    stubs: ["Development", "Testing", "Analysis", "Documentation"],
    universities: ["University A", "University B", "University C"],
    domains: ["Healthcare", "Finance", "Education", "Technology"],
    clientTypes: ["New", "BAU"],
    tasks: ["Code Review", "Bug Fix", "Feature Development", "Testing"],
    statuses: ["Not Started", "WIP", "On Hold - Client", "On Hold - Dev", "Completed"]
  };

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
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">Daily Timesheet</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant={isOnBreak ? "destructive" : "outline"}
                onClick={toggleBreak}
                className="transition-all duration-300"
              >
                <Coffee className="w-4 h-4 mr-2" />
                {isOnBreak ? "End Break" : "Take Break"}
              </Button>
              
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-primary-light">
                <Save className="w-4 h-4 mr-2" />
                Submit Timesheet
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Availability Tracker */}
        <AvailabilityTracker 
          totalLoggedTime={totalLoggedTime}
          breakTime={breakTime}
          isOnBreak={isOnBreak}
          targetHours={9}
        />

        {/* Timesheet Rows */}
        <Card className="shadow-soft border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TimerIcon className="w-5 h-5" />
                  Task Entries
                </CardTitle>
                <CardDescription>
                  Track time for each task individually
                </CardDescription>
              </div>
              <Button onClick={addNewRow} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {rows.map((row, index) => (
                <TimerRow
                  key={row.id}
                  row={row}
                  index={index}
                  dropdownData={dropdownData}
                  onUpdate={updateRow}
                  onDelete={deleteRow}
                  onTimeUpdate={(seconds) => {
                    // Update total logged time
                    const totalTime = rows.reduce((acc, r) => acc + r.totalTime, 0);
                    setTotalLoggedTime(totalTime);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Timesheet;