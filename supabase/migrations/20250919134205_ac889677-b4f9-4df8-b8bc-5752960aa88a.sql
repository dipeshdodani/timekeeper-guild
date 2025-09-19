-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION public.update_employee_last_active()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_active = CURRENT_DATE;
  RETURN NEW;
END;
$$;