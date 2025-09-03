-- Create timesheet_sessions table for tracking individual work sessions
CREATE TABLE public.timesheet_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries by task_id and work_date
CREATE INDEX idx_timesheet_sessions_task_id ON public.timesheet_sessions(task_id);
CREATE INDEX idx_timesheet_sessions_work_date ON public.timesheet_sessions(work_date);
CREATE INDEX idx_timesheet_sessions_task_date ON public.timesheet_sessions(task_id, work_date);

-- Enable Row Level Security (we'll allow all operations for now since no auth is implemented)
ALTER TABLE public.timesheet_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication is implemented)
CREATE POLICY "Allow all operations on timesheet_sessions" 
ON public.timesheet_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timesheet_sessions_updated_at
BEFORE UPDATE ON public.timesheet_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();