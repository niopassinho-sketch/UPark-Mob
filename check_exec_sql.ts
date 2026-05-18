import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

async function tryExecSql() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: 'CREATE OR REPLACE FUNCTION test_func() RETURNS text AS $$ BEGIN RETURN \'ok\'; END; $$ LANGUAGE plpgsql;' 
  });
  if (error) {
    console.log('exec_sql not found or error:', error.message);
  } else {
    console.log('exec_sql worked');
  }
}

tryExecSql();
