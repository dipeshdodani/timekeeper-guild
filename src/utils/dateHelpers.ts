/**
 * Date filtering utilities with timezone-aware boundary helpers
 * Provides single source of truth for date ranges in Reports & Analytics
 */

export type DateFilterMode = 'today' | 'this-week' | 'this-month' | 'custom-range';

export interface GlobalDateFilter {
  mode: DateFilterMode;
  startDate?: Date;
  endDate?: Date;
}

export interface DateBoundaries {
  startDate: Date;
  endDate: Date;
  utcStart: Date;
  utcEnd: Date;
}

/**
 * Get start of today in local timezone (00:00:00)
 */
export const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

/**
 * Get end of today in local timezone (23:59:59.999)
 */
export const endOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
};

/**
 * Get start of current week (Monday 00:00:00 in local timezone)
 */
export const startOfWeek = (localeMonday: boolean = true): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = localeMonday ? (day === 0 ? -6 : 1 - day) : -day;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + diff);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

/**
 * Get end of current week (Sunday 23:59:59.999 in local timezone)
 */
export const endOfWeek = (localeMonday: boolean = true): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = localeMonday ? (day === 0 ? 0 : 7 - day) : 6 - day;
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + diff);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};

/**
 * Get start of current month (1st day 00:00:00 in local timezone)
 */
export const startOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

/**
 * Get end of current month (last day 23:59:59.999 in local timezone)
 */
export const endOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Convert local date to UTC boundary for database queries
 */
export const toUTCBoundary = (localDate: Date): Date => {
  return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
};

/**
 * Get date boundaries based on filter mode
 */
export const getDateBoundaries = (filter: GlobalDateFilter): DateBoundaries => {
  let startDate: Date;
  let endDate: Date;

  switch (filter.mode) {
    case 'today':
      startDate = startOfToday();
      endDate = endOfToday();
      break;
    case 'this-week':
      startDate = startOfWeek(true);
      endDate = endOfWeek(true);
      break;
    case 'this-month':
      startDate = startOfMonth();
      endDate = endOfMonth();
      break;
    case 'custom-range':
      if (!filter.startDate || !filter.endDate) {
        throw new Error('Custom range requires both start and end dates');
      }
      startDate = new Date(filter.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error(`Unknown filter mode: ${filter.mode}`);
  }

  return {
    startDate,
    endDate,
    utcStart: toUTCBoundary(startDate),
    utcEnd: toUTCBoundary(endDate)
  };
};

/**
 * Format filter mode for display
 */
export const formatFilterMode = (filter: GlobalDateFilter): string => {
  switch (filter.mode) {
    case 'today':
      return 'Today';
    case 'this-week':
      return 'This Week';
    case 'this-month':
      return 'This Month';
    case 'custom-range':
      if (filter.startDate && filter.endDate) {
        return `${filter.startDate.toLocaleDateString()} - ${filter.endDate.toLocaleDateString()}`;
      }
      return 'Custom Range';
    default:
      return 'Unknown';
  }
};

/**
 * Get timezone display name
 */
export const getTimezoneDisplay = (): string => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const shortName = now.toLocaleDateString('en', { timeZoneName: 'short' }).split(', ')[1];
  return `${shortName}`;
};

/**
 * Generate cache key for date filter
 */
export const getFilterCacheKey = (filter: GlobalDateFilter): string => {
  return JSON.stringify({
    mode: filter.mode,
    startDate: filter.startDate?.toISOString(),
    endDate: filter.endDate?.toISOString()
  });
};