-- Create ticket_history table for storing detailed timesheet submissions
CREATE TABLE public.ticket_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  submission_date DATE NOT NULL,
  ticket_number TEXT NOT NULL,
  university TEXT,
  domain TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  activity_type TEXT,
  task_name TEXT,
  stub_name TEXT,
  client_type TEXT,
  status TEXT NOT NULL DEFAULT 'Completed',
  received_date TEXT,
  ticket_count INTEGER DEFAULT 1,
  time_logged_seconds INTEGER NOT NULL DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own ticket history" 
ON public.ticket_history 
FOR SELECT 
USING (auth.uid()::text = user_id::text OR user_id IN (
  SELECT id::text FROM public.profiles WHERE email = auth.jwt() ->> 'email'
));

CREATE POLICY "Users can insert their own ticket history" 
ON public.ticket_history 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text OR user_id IN (
  SELECT id::text FROM public.profiles WHERE email = auth.jwt() ->> 'email'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ticket_history_updated_at
BEFORE UPDATE ON public.ticket_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ticket_history_user_id ON public.ticket_history(user_id);
CREATE INDEX idx_ticket_history_submission_date ON public.ticket_history(submission_date);
CREATE INDEX idx_ticket_history_ticket_number ON public.ticket_history(ticket_number);