-- Fix security warning by setting search_path for the authentication function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;