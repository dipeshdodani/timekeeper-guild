interface TimesheetRow {
  id: string;
  ticketNumber: string;
  category: string;
  subCategory: string;
  activityType: string;
  taskName: string;
  university: string;
  domain: string;
  
  status: string;
  receivedDate: string;
  ticketCount: number;
  comments: string;
  totalTime?: number; // Optional for submission
}

interface TimesheetSubmission {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  rows: TimesheetRow[];
  totalHours: number;
  submittedAt: string;
}

const SUBMITTED_TIMESHEETS_KEY = 'submittedTimesheets';
const SESSION_ENTRIES_KEY = 'sessionTimesheetEntries';

// Save individual timesheet entry to session storage
export const saveSessionEntry = (entry: TimesheetRow) => {
  try {
    const existingEntries = getSessionEntries();
    const newEntry = {
      ...entry,
      savedAt: new Date().toISOString()
    };
    existingEntries.push(newEntry);
    sessionStorage.setItem(SESSION_ENTRIES_KEY, JSON.stringify(existingEntries));
    return newEntry;
  } catch (error) {
    console.error('Error saving session entry:', error);
    throw error;
  }
};

// Get all saved entries from current session
export const getSessionEntries = (): (TimesheetRow & { savedAt: string; totalTime?: number })[] => {
  try {
    const data = sessionStorage.getItem(SESSION_ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading session entries:', error);
    return [];
  }
};

// Clear session entries (called on logout)
export const clearSessionEntries = () => {
  sessionStorage.removeItem(SESSION_ENTRIES_KEY);
};

// Save submitted timesheet data
export const saveSubmittedTimesheet = (rows: TimesheetRow[], employeeInfo?: { id: string; name: string }) => {
  try {
    const existingData = localStorage.getItem(SUBMITTED_TIMESHEETS_KEY);
    const submissions: TimesheetSubmission[] = existingData ? JSON.parse(existingData) : [];
    
    const totalHours = rows.reduce((total, row) => total + ((row.totalTime || 0) / 3600), 0); // Convert seconds to hours
    
    const submission: TimesheetSubmission = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      employeeId: employeeInfo?.id || 'current-user',
      employeeName: employeeInfo?.name || 'Current User',
      rows: rows,
      totalHours,
      submittedAt: new Date().toISOString()
    };
    
    submissions.push(submission);
    localStorage.setItem(SUBMITTED_TIMESHEETS_KEY, JSON.stringify(submissions));
    
    return submission;
  } catch (error) {
    console.error('Error saving submitted timesheet:', error);
    throw error;
  }
};

// Get all submitted timesheets
export const getSubmittedTimesheets = (): TimesheetSubmission[] => {
  try {
    const data = localStorage.getItem(SUBMITTED_TIMESHEETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading submitted timesheets:', error);
    return [];
  }
};

// Get timesheets within a date range
export const getTimesheetsInRange = (startDate: Date, endDate: Date): TimesheetSubmission[] => {
  const submissions = getSubmittedTimesheets();
  return submissions.filter(submission => {
    const submissionDate = new Date(submission.date);
    return submissionDate >= startDate && submissionDate <= endDate;
  });
};

// Get aggregated report data from submitted timesheets
export const getReportData = (startDate?: Date, endDate?: Date) => {
  const submissions = startDate && endDate 
    ? getTimesheetsInRange(startDate, endDate)
    : getSubmittedTimesheets();
  
  if (submissions.length === 0) {
    return {
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
    };
  }
  
  const totalHours = submissions.reduce((sum, sub) => sum + sub.totalHours, 0);
  const allRows = submissions.flatMap(sub => sub.rows);
  
  // Calculate task breakdown
  const taskMap = new Map<string, { hours: number; count: number; ahtTotal: number }>();
  
  allRows.forEach(row => {
    const taskName = row.taskName || `${row.category} - ${row.subCategory}`;
    const hours = (row.totalTime || 0) / 3600; // Convert seconds to hours
    const existing = taskMap.get(taskName) || { hours: 0, count: 0, ahtTotal: 0 };
    
    taskMap.set(taskName, {
      hours: existing.hours + hours,
      count: existing.count + 1,
      ahtTotal: existing.ahtTotal + ((row.totalTime || 0) / 60) // Convert to minutes for AHT
    });
  });
  
  const tasks = Array.from(taskMap.entries()).map(([name, data]) => ({
    name,
    hours: Number(data.hours.toFixed(1)),
    percentage: Number(((data.hours / totalHours) * 100).toFixed(1)),
    actualAvgTime: Number((data.ahtTotal / data.count).toFixed(1))
  })).sort((a, b) => b.hours - a.hours);
  
  // Calculate employee metrics
  const employeeMap = new Map<string, { 
    id: string; 
    name: string; 
    totalHours: number; 
    tasks: number; 
    ahtTotal: number; 
    taskCount: number; 
  }>();
  
  submissions.forEach(submission => {
    const existing = employeeMap.get(submission.employeeId) || {
      id: submission.employeeId,
      name: submission.employeeName,
      totalHours: 0,
      tasks: 0,
      ahtTotal: 0,
      taskCount: 0
    };
    
    const submissionAHT = submission.rows.reduce((sum, row) => sum + ((row.totalTime || 0) / 60), 0);
    
    employeeMap.set(submission.employeeId, {
      ...existing,
      totalHours: existing.totalHours + submission.totalHours,
      tasks: existing.tasks + submission.rows.length,
      ahtTotal: existing.ahtTotal + submissionAHT,
      taskCount: existing.taskCount + submission.rows.length
    });
  });
  
  const employees = Array.from(employeeMap.values()).map(emp => ({
    id: emp.id,
    name: emp.name,
    totalHours: Number(emp.totalHours.toFixed(1)),
    tasks: emp.tasks,
    avgAHT: emp.taskCount > 0 ? Number((emp.ahtTotal / emp.taskCount).toFixed(1)) : 0,
    ahtEfficiency: 85 + Math.random() * 15 // Mock efficiency for now
  }));
  
  const workingDays = startDate && endDate 
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : Math.max(1, submissions.length);
  
  return {
    timeSummary: {
      totalHours: Number(totalHours.toFixed(1)),
      billableHours: Number((totalHours * 0.85).toFixed(1)), // Assume 85% billable
      avgDailyHours: Number((totalHours / workingDays).toFixed(1)),
      utilizationRate: Number(((totalHours / (workingDays * 8)) * 100).toFixed(1)),
      avgAHT: allRows.length > 0 ? Number((allRows.reduce((sum, row) => sum + ((row.totalTime || 0) / 60), 0) / allRows.length).toFixed(1)) : 0,
      ahtEfficiency: 90 + Math.random() * 10 // Mock efficiency
    },
    tasks,
    employees
  };
};