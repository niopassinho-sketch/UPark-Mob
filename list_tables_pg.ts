import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  const { data, error } = await supabase
    .from('pg_catalog.pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Tables:', data);
  }
}

listTables();
