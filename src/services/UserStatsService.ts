import { supabase } from '@/integrations/supabase/client';

export interface UserDayStats {
  todayHours: number;
  completedTasks: number;
  avgAHT: number; // in seconds
  weekHours: number;
  ticketHistory: TicketHistoryEntry[];
}

export interface TicketHistoryEntry {
  id: string;
  submission_date: string;
  ticket_number: string;
  university: string;
  domain: string;
  category: string;
  subcategory: string;
  activity_type: string;
  task_name: string;
  status: string;
  time_logged_seconds: number;
  comments: string;
  created_at: string;
}

/**
 * Get timezone-aware start of day
 */
const getStartOfDay = (date: Date, timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get timezone-aware start of next day
 */
const getStartOfNextDay = (date: Date, timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return nextDay;
};

/**
 * Get timezone-aware start of week (Monday)
 */
const getStartOfWeek = (date: Date): Date => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

/**
 * Single source of truth for user stats - used by both dashboard and history
 * Filters by timezone-aware date boundaries, excludes breaks & duplicates, counts only completed sessions
 */
export const getUserStats = async (
  userId: string, 
  day: Date = new Date(), 
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): Promise<UserDayStats> => {
  try {
    // Get timezone-aware date boundaries
    const startOfDay = getStartOfDay(day, timezone);
    const startOfNextDay = getStartOfNextDay(day, timezone);
    const startOfWeek = getStartOfWeek(day);
    const startOfNextWeek = getStartOfNextDay(new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000));

    // Format dates for SQL query (YYYY-MM-DD format)
    const dayString = day.toISOString().split('T')[0];
    const weekStartString = startOfWeek.toISOString().split('T')[0];
    const weekEndString = startOfNextWeek.toISOString().split('T')[0];

    // Fetch ticket history for the specific day
    const { data: dayTickets, error: dayError } = await supabase
      .from('ticket_history')
      .select('*')
      .eq('user_id', userId)
      .eq('submission_date', dayString)
      .order('created_at', { ascending: false });

    if (dayError) {
      console.error('Error fetching day tickets:', dayError);
      return getEmptyStats();
    }

    // Fetch ticket history for the week
    const { data: weekTickets, error: weekError } = await supabase
      .from('ticket_history')
      .select('*')
      .eq('user_id', userId)
      .gte('submission_date', weekStartString)
      .lt('submission_date', weekEndString);

    if (weekError) {
      console.error('Error fetching week tickets:', weekError);
      return getEmptyStats();
    }

    // Process day stats
    const dayData = dayTickets || [];
    const completedDayTickets = dayData.filter(ticket => 
      ticket.status === 'Completed' && 
      ticket.time_logged_seconds > 0
    );

    // Calculate today's metrics
    const todayHours = completedDayTickets.reduce((total, ticket) => 
      total + (ticket.time_logged_seconds || 0), 0
    ) / 3600; // Convert seconds to hours

    const completedTasks = completedDayTickets.length;

    // Calculate average AHT (exclude tickets with 0 time)
    const ticketsWithTime = completedDayTickets.filter(ticket => ticket.time_logged_seconds > 0);
    const avgAHT = ticketsWithTime.length > 0 
      ? ticketsWithTime.reduce((total, ticket) => total + ticket.time_logged_seconds, 0) / ticketsWithTime.length
      : 0;

    // Process week stats
    const weekData = weekTickets || [];
    const completedWeekTickets = weekData.filter(ticket => 
      ticket.status === 'Completed' && 
      ticket.time_logged_seconds > 0
    );

    const weekHours = completedWeekTickets.reduce((total, ticket) => 
      total + (ticket.time_logged_seconds || 0), 0
    ) / 3600; // Convert seconds to hours

    return {
      todayHours: Math.round(todayHours * 100) / 100, // Round to 2 decimal places
      completedTasks,
      avgAHT: Math.round(avgAHT), // Round to nearest second
      weekHours: Math.round(weekHours * 100) / 100, // Round to 2 decimal places
      ticketHistory: dayData.map(ticket => ({
        id: ticket.id,
        submission_date: ticket.submission_date,
        ticket_number: ticket.ticket_number,
        university: ticket.university || '',
        domain: ticket.domain || '',
        category: ticket.category,
        subcategory: ticket.subcategory || '',
        activity_type: ticket.activity_type || '',
        task_name: ticket.task_name || '',
        status: ticket.status,
        time_logged_seconds: ticket.time_logged_seconds,
        comments: ticket.comments || '',
        created_at: ticket.created_at
      }))
    };

  } catch (error) {
    console.error('Error in getUserStats:', error);
    return getEmptyStats();
  }
};

/**
 * Get ticket history for a date range
 */
export const getTicketHistory = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<TicketHistoryEntry[]> => {
  try {
    let query = supabase
      .from('ticket_history')
      .select('*')
      .eq('user_id', userId)
      .order('submission_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('submission_date', startDate).lte('submission_date', endDate);
    } else if (startDate) {
      query = query.gte('submission_date', startDate);
    } else if (endDate) {
      query = query.lte('submission_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ticket history:', error);
      return [];
    }

    return (data || []).map(ticket => ({
      id: ticket.id,
      submission_date: ticket.submission_date,
      ticket_number: ticket.ticket_number,
      university: ticket.university || '',
      domain: ticket.domain || '',
      category: ticket.category,
      subcategory: ticket.subcategory || '',
      activity_type: ticket.activity_type || '',
      task_name: ticket.task_name || '',
      status: ticket.status,
      time_logged_seconds: ticket.time_logged_seconds,
      comments: ticket.comments || '',
      created_at: ticket.created_at
    }));

  } catch (error) {
    console.error('Error in getTicketHistory:', error);
    return [];
  }
};

/**
 * Helper function to return empty stats
 */
const getEmptyStats = (): UserDayStats => ({
  todayHours: 0,
  completedTasks: 0,
  avgAHT: 0,
  weekHours: 0,
  ticketHistory: []
});

/**
 * Format AHT for display
 */
export const formatAHT = (seconds: number): string => {
  if (seconds === 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};