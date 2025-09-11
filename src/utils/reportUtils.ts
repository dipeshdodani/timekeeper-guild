import { supabase } from "@/integrations/supabase/client";
import { getDisplayNames } from "./userUtils";
import { GlobalDateFilter, getDateBoundaries } from "./dateHelpers";

export interface ReportData {
  timeSummary: {
    totalHours: number;
    billableHours: number;
    avgDailyHours: number;
    utilizationRate: number;
    avgAHT: number;
    ahtEfficiency: number;
  };
  tasks: Array<{
    name: string;
    hours: number;
    percentage: number;
    actualAvgTime: number;
  }>;
  employees: Array<{
    id: string;
    name: string;
    totalHours: number;
    tasks: number;
    avgAHT: number;
    ahtEfficiency: number;
  }>;
}

/**
 * Get report data from Supabase with proper user names
 */
export const getSupabaseReportData = async (filter: GlobalDateFilter): Promise<ReportData> => {
  try {
    const boundaries = getDateBoundaries(filter);
    
    // Use UTC boundaries for consistent database queries
    const query = supabase
      .from('timesheet_sessions')
      .select(`
        id,
        task_id,
        start_at,
        end_at,
        duration_seconds,
        work_date,
        user_id,
        created_at,
        updated_at
      `)
      .gte('start_at', boundaries.utcStart.toISOString())
      .lte('end_at', boundaries.utcEnd.toISOString());

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching timesheet sessions:', error);
      return getEmptyReportData();
    }

    if (!sessions || sessions.length === 0) {
      return getEmptyReportData();
    }

    // Calculate totals
    const totalSeconds = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
    const totalHours = totalSeconds / 3600;

    // Group by task_id for task breakdown
    const taskMap = new Map<string, { hours: number; count: number; ahtTotal: number }>();
    
    sessions.forEach(session => {
      const taskName = session.task_id || 'Unknown Task';
      const hours = (session.duration_seconds || 0) / 3600;
      const existing = taskMap.get(taskName) || { hours: 0, count: 0, ahtTotal: 0 };
      
      taskMap.set(taskName, {
        hours: existing.hours + hours,
        count: existing.count + 1,
        ahtTotal: existing.ahtTotal + ((session.duration_seconds || 0) / 60)
      });
    });

    const tasks = Array.from(taskMap.entries()).map(([name, data]) => ({
      name,
      hours: Number(data.hours.toFixed(1)),
      percentage: Number(((data.hours / totalHours) * 100).toFixed(1)),
      actualAvgTime: Number((data.ahtTotal / data.count).toFixed(1))
    })).sort((a, b) => b.hours - a.hours);

    // Group by user for employee metrics
    const userMap = new Map<string, {
      id: string;
      name: string;
      totalHours: number;
      tasks: number;
      ahtTotal: number;
      taskCount: number;
    }>();

    sessions.forEach(session => {
      const userId = session.user_id || 'unknown';
      const existing = userMap.get(userId) || {
        id: userId,
        name: 'Loading...',
        totalHours: 0,
        tasks: 0,
        ahtTotal: 0,
        taskCount: 0
      };

      userMap.set(userId, {
        ...existing,
        totalHours: existing.totalHours + ((session.duration_seconds || 0) / 3600),
        tasks: existing.tasks + 1,
        ahtTotal: existing.ahtTotal + ((session.duration_seconds || 0) / 60),
        taskCount: existing.taskCount + 1
      });
    });

    // Get display names for all users
    const userIds = Array.from(userMap.keys()).filter(id => id !== 'unknown');
    const displayNames = await getDisplayNames(userIds);

    // Update user names
    userIds.forEach(userId => {
      const user = userMap.get(userId);
      if (user) {
        user.name = displayNames[userId] || 'Unknown User';
      }
    });

    const employees = Array.from(userMap.values()).map(emp => ({
      id: emp.id,
      name: emp.name,
      totalHours: Number(emp.totalHours.toFixed(1)),
      tasks: emp.tasks,
      avgAHT: emp.taskCount > 0 ? Number((emp.ahtTotal / emp.taskCount).toFixed(1)) : 0,
      ahtEfficiency: 85 + Math.random() * 15 // Mock efficiency for now
    }));

    const workingDays = Math.max(1, Math.ceil((boundaries.endDate.getTime() - boundaries.startDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      timeSummary: {
        totalHours: Number(totalHours.toFixed(1)),
        billableHours: Number((totalHours * 0.85).toFixed(1)),
        avgDailyHours: Number((totalHours / workingDays).toFixed(1)),
        utilizationRate: Number(((totalHours / (workingDays * 8)) * 100).toFixed(1)),
        avgAHT: sessions.length > 0 ? Number((sessions.reduce((sum, s) => sum + ((s.duration_seconds || 0) / 60), 0) / sessions.length).toFixed(1)) : 0,
        ahtEfficiency: 90 + Math.random() * 10
      },
      tasks,
      employees
    };

  } catch (error) {
    console.error('Error getting Supabase report data:', error);
    return getEmptyReportData();
  }
};

const getEmptyReportData = (): ReportData => ({
  timeSummary: {
    totalHours: 0,
    billableHours: 0,
    avgDailyHours: 0,
    utilizationRate: 0,
    avgAHT: 0,
    ahtEfficiency: 0
  },
  tasks: [],
  employees: []
});

/**
 * Export report data to CSV with proper user names
 */
export const exportReportWithNames = (reportType: string, reportData: ReportData, filter: GlobalDateFilter): string => {
  const boundaries = getDateBoundaries(filter);
  const filterStr = filter.mode.replace('-', '_');
  const startStr = boundaries.startDate.toISOString().split('T')[0];
  const endStr = boundaries.endDate.toISOString().split('T')[0];
  const timestamp = new Date().toISOString().split('T')[0];
  
  let csvContent = "";
  let filename = "";
  
  const dateRangeStr = `${filterStr}_${startStr}_to_${endStr}`;

  switch (reportType) {
    case "time-summary":
      csvContent = [
        ["Metric", "Value"],
        ["Total Hours", reportData.timeSummary.totalHours],
        ["Billable Hours", reportData.timeSummary.billableHours],
        ["Average Daily Hours", reportData.timeSummary.avgDailyHours],
        ["Utilization Rate", `${reportData.timeSummary.utilizationRate}%`]
      ].map(row => row.join(",")).join("\n");
      filename = `time_summary_${dateRangeStr}_${timestamp}.csv`;
      break;
    case "task-breakdown":
      csvContent = [
        ["Task Name", "Hours", "Percentage", "Actual Avg Time"],
        ...reportData.tasks.map(task => [task.name, task.hours, `${task.percentage}%`, `${task.actualAvgTime}min`])
      ].map(row => row.join(",")).join("\n");
      filename = `task_breakdown_${dateRangeStr}_${timestamp}.csv`;
      break;
    case "employee-summary":
      csvContent = [
        ["Employee ID", "Name", "Total Hours", "Tasks Completed", "Avg AHT", "AHT Efficiency"],
        ...reportData.employees.map(emp => [emp.id, emp.name, emp.totalHours.toFixed(1), emp.tasks, emp.avgAHT.toFixed(1), `${emp.ahtEfficiency.toFixed(1)}%`])
      ].map(row => row.join(",")).join("\n");
      filename = `employee_summary_${dateRangeStr}_${timestamp}.csv`;
      break;
  }

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);

  return filename;
};