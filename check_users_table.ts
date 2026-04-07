import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsersTable() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error querying "users":', error.message);
  } else {
    console.log('Data from "users":', data);
  }
}

checkUsersTable();
