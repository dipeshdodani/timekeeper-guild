import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, FileText, Calendar } from "lucide-react";

const Reports = () => {
  const [userRole, setUserRole] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/");
      return;
    }
    setUserRole(role);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="bg-surface border-border hover:bg-surface-elevated"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-foreground-muted">Generate and view timesheet reports</p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-soft border-border hover:shadow-medium transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Time Summary</CardTitle>
                  <CardDescription>Daily, weekly, and monthly time reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border hover:shadow-medium transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Task Reports</CardTitle>
                  <CardDescription>Detailed task breakdown and analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border hover:shadow-medium transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Attendance Report</CardTitle>
                  <CardDescription>Employee attendance and availability</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">42h</div>
              <div className="text-sm text-foreground-muted">This Week</div>
            </Card>
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">168h</div>
              <div className="text-sm text-foreground-muted">This Month</div>
            </Card>
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">85%</div>
              <div className="text-sm text-foreground-muted">Utilization</div>
            </Card>
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-foreground-muted">Active Projects</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;