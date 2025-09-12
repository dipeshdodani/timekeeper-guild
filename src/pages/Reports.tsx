import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BarChart3, FileText, Calendar, Download, Filter } from "lucide-react";
import { PerformanceFilters, FilterPeriod } from "@/components/PerformanceFilters";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseReportData, exportReportWithNames } from "@/utils/reportUtils";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { GlobalDateFilter } from "@/components/GlobalDateFilter";
import { FilterStatusPill } from "@/components/FilterStatusPill";
import { getFilterCacheKey } from "@/utils/dateHelpers";

const ReportsContent = () => {
  const [userRole, setUserRole] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState<{
    period: FilterPeriod;
    startDate: Date;
    endDate: Date;
  }>({
    period: "this-week",
    startDate: new Date(),
    endDate: new Date()
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { globalDateFilter, lastUpdated } = useDashboard();

  // Sample data for reports with team structure
  const teamsData = {
    "all": {
      name: "All Teams",
      employees: [
        { id: "EMP001", name: "John Smith", team: "support-alpha" },
        { id: "EMP002", name: "Sarah Johnson", team: "support-alpha" },
        { id: "EMP003", name: "Mike Wilson", team: "support-beta" },
        { id: "EMP004", name: "Lisa Chen", team: "support-beta" },
        { id: "EMP005", name: "David Brown", team: "development" },
        { id: "EMP006", name: "Emily Davis", team: "development" },
        { id: "EMP007", name: "Alex White", team: "qa" },
        { id: "EMP008", name: "Jessica Green", team: "qa" }
      ]
    },
    "support-alpha": {
      name: "Support Team Alpha",
      employees: [
        { id: "EMP001", name: "John Smith", team: "support-alpha" },
        { id: "EMP002", name: "Sarah Johnson", team: "support-alpha" }
      ]
    },
    "support-beta": {
      name: "Support Team Beta", 
      employees: [
        { id: "EMP003", name: "Mike Wilson", team: "support-beta" },
        { id: "EMP004", name: "Lisa Chen", team: "support-beta" }
      ]
    },
    "development": {
      name: "Development Team",
      employees: [
        { id: "EMP005", name: "David Brown", team: "development" },
        { id: "EMP006", name: "Emily Davis", team: "development" }
      ]
    },
    "qa": {
      name: "QA Team",
      employees: [
        { id: "EMP007", name: "Alex White", team: "qa" },
        { id: "EMP008", name: "Jessica Green", team: "qa" }
      ]
    }
  };

  // Get actual report data from Supabase using global date filter
  const getActualReportData = async () => {
    return await getSupabaseReportData(globalDateFilter);
  };

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load report data when filter changes
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        const data = await getActualReportData();
        setReportData(data);
      } catch (error) {
        console.error('Error loading report data:', error);
        toast({
          title: "Error",
          description: "Failed to load report data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [getFilterCacheKey(globalDateFilter), lastUpdated]);

  // Get filtered employees based on selected team
  const getFilteredEmployees = () => {
    const teamData = teamsData[selectedTeam as keyof typeof teamsData];
    return teamData ? teamData.employees : [];
  };

  // Get filtered report data based on selections using actual data
  const getFilteredReportData = () => {
    if (!reportData?.employees) {
      return [];
    }

    let filteredEmployees = reportData.employees;

    // Filter by team if specific team selected
    if (selectedTeam !== "all") {
      const teamEmployees = getFilteredEmployees();
      const teamEmployeeIds = teamEmployees.map(emp => emp.id);
      filteredEmployees = reportData.employees.filter(emp => 
        teamEmployeeIds.includes(emp.id)
      );
    }

    // Further filter by specific employee if selected
    if (selectedEmployee !== "all") {
      filteredEmployees = filteredEmployees.filter(emp => emp.id === selectedEmployee);
    }

    // Only show employees with actual activity (non-zero hours)
    // For day filters, this ensures only employees with logged time appear
    return filteredEmployees.filter(emp => emp.totalHours > 0);
  };

  // Remove old date range handler as it's now handled by GlobalDateFilter component

  const handlePerformanceFilterChange = (period: FilterPeriod, startDate: Date, endDate: Date) => {
    setPerformanceFilter({ period, startDate, endDate });
  };

  const exportReport = (reportType: string) => {
    if (!reportData) {
      toast({
        title: "Error",
        description: "No report data available to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const filename = exportReportWithNames(reportType, reportData, globalDateFilter);
      toast({
        title: "Export Complete",
        description: `${reportType} report exported as ${filename}`
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

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
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="bg-surface border-border hover:bg-surface-elevated"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-foreground-muted">Generate and view timesheet reports</p>
          </div>
        </div>

        {/* Filter Status */}
        <div className="mb-6">
          <FilterStatusPill />
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-soft border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <GlobalDateFilter />
              </div>
              <div>
                <Label htmlFor="team">Team</Label>
                <Select value={selectedTeam} onValueChange={(value) => {
                  setSelectedTeam(value);
                  setSelectedEmployee("all"); // Reset employee when team changes
                }}>
                  <SelectTrigger className="bg-surface border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(teamsData).map(([key, team]) => (
                      <SelectItem key={key} value={key}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="bg-surface border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {getFilteredEmployees().map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => exportReport("time-summary")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
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
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => exportReport("task-breakdown")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
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
                  <CardTitle className="text-lg">Employee Summary</CardTitle>
                  <CardDescription>Individual employee performance data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => exportReport("employee-summary")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Time Summary Card */}
          <Card className="shadow-soft border-border">
            <CardHeader>
              <CardTitle>Time Summary - {globalDateFilter.mode}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse bg-muted h-4 rounded"></div>
                  <div className="animate-pulse bg-muted h-4 rounded"></div>
                  <div className="animate-pulse bg-muted h-4 rounded"></div>
                </div>
              ) : reportData?.timeSummary ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Total Hours:</span>
                    <span className="font-semibold">{reportData.timeSummary.totalHours}h</span>
                  </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Billable Hours:</span>
                  <span className="font-semibold">{reportData.timeSummary.billableHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Avg Daily Hours:</span>
                  <span className="font-semibold">{reportData.timeSummary.avgDailyHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Utilization Rate:</span>
                  <span className="font-semibold text-success">{reportData.timeSummary.utilizationRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Avg AHT:</span>
                  <span className="font-semibold">{reportData.timeSummary.avgAHT}min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">AHT Efficiency:</span>
                  <span className="font-semibold text-success">{reportData.timeSummary.ahtEfficiency}%</span>
                </div>
              </div>
              ) : (
                <div className="text-center py-4 text-foreground-muted">
                  <p>No data available for the selected period.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Breakdown */}
          <Card className="shadow-soft border-border">
            <CardHeader>
              <CardTitle>Task Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse bg-muted h-8 rounded"></div>
                  <div className="animate-pulse bg-muted h-8 rounded"></div>
                  <div className="animate-pulse bg-muted h-8 rounded"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {reportData?.tasks.length > 0 ? reportData.tasks.map((task, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">{task.name}</span>
                          <span className="text-foreground-muted">{task.hours}h</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${task.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-foreground-muted pl-2">
                      <span>Actual Avg: {task.actualAvgTime}min</span>
                    </div>
                  </div>
                  )) : (
                    <div className="text-center py-4 text-foreground-muted">
                      <p>No task data available for the selected period.</p>
                      <p className="text-xs mt-1">Submit some timesheets to see task breakdown here.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee Performance Table */}
        <Card className="shadow-soft border-border">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle>Employee Performance Summary</CardTitle>
              <div className="lg:w-80">
                <PerformanceFilters onFilterChange={handlePerformanceFilterChange} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Employee ID</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Total Hours</th>
                    <th className="text-left py-2">Tasks Completed</th>
                    <th className="text-left py-2">Avg AHT</th>
                    <th className="text-left py-2">AHT Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredReportData().map((employee, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-2">{employee.id}</td>
                      <td className="py-2">{employee.name}</td>
                      <td className="py-2">{employee.totalHours.toFixed(1)}h</td>
                      <td className="py-2">{employee.tasks}</td>
                      <td className="py-2">{employee.avgAHT.toFixed(1)}min</td>
                      <td className="py-2">
                        <span className={employee.ahtEfficiency >= 90 ? 'text-success' : employee.ahtEfficiency >= 80 ? 'text-warning' : 'text-destructive'}>
                          {employee.ahtEfficiency.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">{reportData?.timeSummary?.totalHours || 0}h</div>
              <div className="text-sm text-foreground-muted">Total Hours</div>
            </Card>
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">{reportData?.timeSummary?.billableHours || 0}h</div>
              <div className="text-sm text-foreground-muted">Billable Hours</div>
            </Card>
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">{reportData?.timeSummary?.utilizationRate || 0}%</div>
              <div className="text-sm text-foreground-muted">Utilization</div>
            </Card>
            <Card className="p-4 bg-surface border-border">
              <div className="text-2xl font-bold text-primary">{getFilteredReportData().length}</div>
              <div className="text-sm text-foreground-muted">
                {selectedTeam === "all" ? "Total Employees" : `${teamsData[selectedTeam as keyof typeof teamsData]?.name} Members`}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const Reports = () => {
  return (
    <DashboardProvider>
      <ReportsContent />
    </DashboardProvider>
  );
};

export default Reports;