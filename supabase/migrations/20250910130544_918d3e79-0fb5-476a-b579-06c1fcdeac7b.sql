-- Add user_id column to timesheet_sessions to link with profiles
ALTER TABLE public.timesheet_sessions 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;