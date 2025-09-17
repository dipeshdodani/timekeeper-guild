-- Create employees table for proper authentication
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('team-member', 'sme', 'admin', 'super-user')),
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees table
CREATE POLICY "Employees can view their own record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Allow employee authentication lookup" 
ON public.employees 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample employees with demo credentials
-- Note: In production, passwords should be properly hashed using bcrypt
INSERT INTO public.employees (employee_id, email, password_hash, role, full_name) VALUES
('EMP001', 'admin@company.com', 'password123', 'super-user', 'System Administrator'),
('EMP002', 'john.doe@company.com', 'password123', 'admin', 'John Doe'),
('EMP003', 'jane.smith@company.com', 'password123', 'sme', 'Jane Smith'),
('EMP004', 'mike.wilson@company.com', 'password123', 'team-member', 'Mike Wilson');

-- Create function to authenticate employee
CREATE OR REPLACE FUNCTION public.authenticate_employee(
  input_employee_id TEXT,
  input_email TEXT,
  input_password TEXT
)
RETURNS TABLE(
  employee_id TEXT,
  email TEXT,
  role TEXT,
  full_name TEXT,
  auth_success BOOLEAN
) AS $$
BEGIN
  -- Simple password comparison for demo
  -- In production, use proper password hashing comparison
  RETURN QUERY
  SELECT 
    e.employee_id,
    e.email,
    e.role,
    e.full_name,
    CASE 
      WHEN e.password_hash = input_password
      THEN true
      ELSE false
    END as auth_success
  FROM public.employees e
  WHERE 
    e.is_active = true
    AND (
      (input_employee_id IS NOT NULL AND input_employee_id != '' AND e.employee_id = input_employee_id)
      OR (input_email IS NOT NULL AND input_email != '' AND e.email = input_email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;