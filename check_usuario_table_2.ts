import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsuarioTable() {
  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error querying "usuario":', error.message);
  } else {
    console.log('Data from "usuario":', data);
  }
}

checkUsuarioTable();
