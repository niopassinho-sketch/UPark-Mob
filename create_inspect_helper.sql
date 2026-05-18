
CREATE OR REPLACE FUNCTION get_function_source(p_func_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT prosrc FROM pg_proc WHERE proname = p_func_name);
END;
$$ LANGUAGE plpgsql;
