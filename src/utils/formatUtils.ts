/**
 * Utility functions for formatting data in a human-readable way
 */

/**
 * Format hours into human-readable format
 * @param totalHours - Hours as a decimal number
 * @returns Formatted string like "2.5 hrs", "25 mins", "1 hr 30 mins"
 */
export const formatHours = (totalHours: number): string => {
  if (totalHours === 0) {
    return "0 hrs";
  }

  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  if (hours === 0 && minutes > 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  if (minutes === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }

  if (hours > 0 && minutes > 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  // Fallback for decimal display
  return `${totalHours.toFixed(1)} hrs`;
};

/**
 * Format minutes into human-readable format
 * @param totalMinutes - Minutes as a number
 * @returns Formatted string like "25 mins", "1 hr 5 mins"
 */
export const formatMinutes = (totalMinutes: number): string => {
  if (totalMinutes === 0) {
    return "0 mins";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours === 0) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  if (minutes === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
};

/**
 * Format a task ID or raw identifier into a display name
 * @param taskId - Raw task identifier
 * @returns Human-readable task name
 */
export const formatTaskName = (taskId: string): string => {
  if (!taskId || taskId === 'unknown' || taskId === 'Unknown Task') {
    return 'Miscellaneous Task';
  }

  // Convert common task ID patterns to readable names
  const taskMappings: Record<string, string> = {
    'support_ticket': 'Support Ticket',
    'code_review': 'Code Review',
    'development': 'Development',
    'testing': 'Testing',
    'documentation': 'Documentation',
    'meeting': 'Meeting',
    'planning': 'Planning',
    'bug_fix': 'Bug Fix',
    'feature_development': 'Feature Development',
    'client_call': 'Client Call',
    'training': 'Training',
    'research': 'Research'
  };

  // Check for exact match first
  if (taskMappings[taskId.toLowerCase()]) {
    return taskMappings[taskId.toLowerCase()];
  }

  // Convert snake_case or kebab-case to Title Case
  const formatted = taskId
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();

  return formatted || 'General Task';
};

/**
 * Safely format user display data
 * @param userId - User identifier
 * @param displayName - User display name (may be null/undefined)
 * @returns Safe display values
 */
export const formatUserDisplay = (userId: string, displayName?: string | null): { id: string; name: string } => {
  // Handle user ID
  const safeId = userId && userId !== 'unknown' && userId !== 'null' ? userId : '';

  // Handle display name with proper fallbacks
  let safeName = '';
  if (displayName && displayName !== 'Loading...' && displayName !== 'unknown' && displayName !== 'null') {
    safeName = displayName;
  } else if (safeId) {
    // Try to extract a meaningful name from the ID if it looks like an email
    if (safeId.includes('@')) {
      safeName = safeId.split('@')[0];
    } else {
      safeName = 'N/A';
    }
  } else {
    safeName = 'N/A';
  }

  return {
    id: safeId || 'N/A',
    name: safeName
  };
};