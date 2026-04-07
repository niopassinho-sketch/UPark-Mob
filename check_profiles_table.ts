import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfilesTable() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error querying "profiles":', error.message);
  } else {
    console.log('Data from "profiles":', data);
  }
}

checkProfilesTable();
