import { supabase } from "@/integrations/supabase/client";

/**
 * Get display name for a user ID with fallback hierarchy:
 * 1. public.profiles.full_name 
 * 2. auth.users.user_metadata.display_name or full_name
 * 3. email prefix before @
 */
export const getDisplayName = async (userId: string): Promise<string> => {
  try {
    // First try to get from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.full_name) {
      return profile.full_name;
    }

    // Fall back to auth user metadata
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (user?.user) {
      const metadata = user.user.user_metadata;
      const displayName = metadata?.display_name || metadata?.full_name || metadata?.name;
      if (displayName) {
        return displayName;
      }
    }

    // Fall back to email prefix
    const email = profile?.email || user?.user?.email;
    if (email) {
      return email.split('@')[0];
    }

    // Last resort
    return 'Unknown User';
  } catch (error) {
    console.error('Error getting display name:', error);
    return 'Unknown User';
  }
};

/**
 * Get display names for multiple user IDs
 */
export const getDisplayNames = async (userIds: string[]): Promise<Record<string, string>> => {
  try {
    // Get all profiles at once
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const result: Record<string, string> = {};
    
    for (const userId of userIds) {
      const profile = profiles?.find(p => p.id === userId);
      
      if (profile?.full_name) {
        result[userId] = profile.full_name;
      } else if (profile?.email) {
        result[userId] = profile.email.split('@')[0];
      } else {
        result[userId] = 'Unknown User';
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting display names:', error);
    return userIds.reduce((acc, id) => {
      acc[id] = 'Unknown User';
      return acc;
    }, {} as Record<string, string>);
  }
};

/**
 * Get enriched timesheet data with user display names
 */
export const getTimesheetDataWithNames = async (timesheetSessions: any[]) => {
  try {
    // Get all unique user IDs
    const userIds = [...new Set(timesheetSessions.map(session => session.user_id).filter(Boolean))];
    
    if (userIds.length === 0) {
      return timesheetSessions;
    }

    // Get display names for all users
    const displayNames = await getDisplayNames(userIds);

    // Enrich the data
    return timesheetSessions.map(session => ({
      ...session,
      user_display_name: displayNames[session.user_id] || 'Unknown User'
    }));
  } catch (error) {
    console.error('Error enriching timesheet data:', error);
    return timesheetSessions;
  }
};