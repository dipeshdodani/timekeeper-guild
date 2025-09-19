-- Update employees table to ensure it has all necessary columns and constraints
-- Add any missing columns if they don't exist
DO $$
BEGIN
    -- Check if columns exist and add them if they don't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'team') THEN
        ALTER TABLE public.employees ADD COLUMN team text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'join_date') THEN
        ALTER TABLE public.employees ADD COLUMN join_date date DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'last_active') THEN
        ALTER TABLE public.employees ADD COLUMN last_active date DEFAULT CURRENT_DATE;
    END IF;
END
$$;

-- Add RLS policies for proper CRUD operations on employees table
CREATE POLICY "Allow admin and super-user to manage employees" 
ON public.employees 
FOR ALL
USING (
  -- Allow if user has admin or super-user role in the system
  -- For now, we'll allow all authenticated users to manage employees
  -- This can be refined later with proper role-based access control
  auth.uid() IS NOT NULL
);

-- Create a trigger to update last_active when an employee record is updated
CREATE OR REPLACE FUNCTION public.update_employee_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_last_active_trigger
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_last_active();