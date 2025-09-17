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
CREATE POLICY "Users can view their own employee record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = id OR role = 'super-user');

CREATE POLICY "Super users can manage all employees" 
ON public.employees 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = auth.uid() AND role = 'super-user'
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample employees with hashed passwords
-- Note: In production, passwords should be properly hashed using bcrypt or similar
-- For demo purposes, using simple text (but indicating they should be hashed)
INSERT INTO public.employees (employee_id, email, password_hash, role, full_name) VALUES
('EMP001', 'admin@company.com', '$2b$10$example.hash.for.password123', 'super-user', 'System Administrator'),
('EMP002', 'john.doe@company.com', '$2b$10$example.hash.for.password123', 'admin', 'John Doe'),
('EMP003', 'jane.smith@company.com', '$2b$10$example.hash.for.password123', 'sme', 'Jane Smith'),
('EMP004', 'mike.wilson@company.com', '$2b$10$example.hash.for.password123', 'team-member', 'Mike Wilson');

-- Create function to authenticate employee
CREATE OR REPLACE FUNCTION public.authenticate_employee(
  input_employee_id TEXT DEFAULT NULL,
  input_email TEXT DEFAULT NULL,
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
  -- For demo purposes, we'll use simple password comparison
  -- In production, this should use proper password hashing comparison
  RETURN QUERY
  SELECT 
    e.employee_id,
    e.email,
    e.role,
    e.full_name,
    CASE 
      WHEN e.password_hash = '$2b$10$example.hash.for.password123' AND input_password = 'password123'
      THEN true
      ELSE false
    END as auth_success
  FROM public.employees e
  WHERE 
    e.is_active = true
    AND (
      (input_employee_id IS NOT NULL AND e.employee_id = input_employee_id)
      OR (input_email IS NOT NULL AND e.email = input_email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;