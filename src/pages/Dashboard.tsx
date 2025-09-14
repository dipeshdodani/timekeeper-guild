import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSessionEntries } from "@/utils/timesheetStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Play, 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Plus,
  FileText,
  Database
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    if (!role || !email) {
      navigate("/");
      return;
    }
    setUserRole(role);
    setUserEmail(email);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("employeeId");
    clearSessionEntries(); // Clear session timesheet entries
    navigate("/");
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      "team-member": "Team Member",
      "sme": "SME",
      "admin": "Admin", 
      "super-user": "Super User"
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "team-member": "default",
      "sme": "secondary",
      "admin": "destructive",
      "super-user": "destructive"
    };
    return variantMap[role] || "default";
  };

  // Mock data for dashboard metrics
  const todayMetrics = {
    totalHours: 6.5,
    targetHours: 9,
    completedTasks: 12,
    pendingTasks: 3,
    avgAHT: "24min"
  };

  const quickActions = [
    {
      title: "Start Timesheet",
      description: "Begin tracking your daily tasks",
      icon: Play,
      action: () => navigate("/timesheet"),
      variant: "default" as const
    },
    {
      title: "View Reports", 
      description: "Access your time tracking reports",
      icon: FileText,
      action: () => navigate("/reports"),
      variant: "secondary" as const
    }
  ];

  // Add role-specific actions
  if (userRole === "sme" || userRole === "admin" || userRole === "super-user") {
    quickActions.push({
      title: "Manage Tasks",
      description: "Add or modify task definitions",
      icon: Plus,
      action: () => navigate("/tasks"),
      variant: "secondary" as const
    });
  }

  if (userRole === "admin" || userRole === "super-user") {
    quickActions.push({
      title: "Team Management",
      description: "Manage team members and settings", 
      icon: Users,
      action: () => navigate("/team"),
      variant: "secondary" as const
    });
    
    quickActions.push({
      title: "Dropdown Management",
      description: "Manage dropdown lists and data", 
      icon: Database,
      action: () => navigate("/dropdown-management"),
      variant: "secondary" as const
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      {/* Header */}
      <header className="bg-surface shadow-soft border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">Timesheet Tracker</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{userEmail}</p>
                <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                  {getRoleDisplayName(userRole)}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-border hover:bg-accent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome back, {userEmail.split('@')[0]}!
          </h2>
          <p className="text-foreground-muted">
            Here's your timesheet overview for today
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-muted">Today's Hours</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayMetrics.totalHours}h
                  </p>
                  <p className="text-sm text-foreground-subtle">
                    of {todayMetrics.targetHours}h target
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-muted">Completed Tasks</p>
                  <p className="text-2xl font-bold text-success">
                    {todayMetrics.completedTasks}
                  </p>
                  <p className="text-sm text-foreground-subtle">
                    {todayMetrics.pendingTasks} pending
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-muted">Avg AHT</p>
                  <p className="text-2xl font-bold text-foreground">
                    {todayMetrics.avgAHT}
                  </p>
                  <p className="text-sm text-success">
                    ↓ 5% from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-warning-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-muted">This Week</p>
                  <p className="text-2xl font-bold text-foreground">
                    32.5h
                  </p>
                  <p className="text-sm text-foreground-subtle">
                    4 days tracked
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-soft border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks to get you started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  className="w-full justify-start h-auto p-4 group"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm opacity-70">{action.description}</p>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Today's Status
              </CardTitle>
              <CardDescription>
                Your progress towards daily targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground-muted">Daily Target Progress</span>
                    <span className="text-foreground">{todayMetrics.totalHours}h / {todayMetrics.targetHours}h</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(todayMetrics.totalHours / todayMetrics.targetHours) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-foreground-muted mb-2">Remaining time needed:</p>
                  <p className="text-lg font-semibold text-warning">
                    {(todayMetrics.targetHours - todayMetrics.totalHours).toFixed(1)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;