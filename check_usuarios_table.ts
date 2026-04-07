import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsuariosTable() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error querying "usuarios":', error.message);
  } else {
    console.log('Data from "usuarios":', data);
  }
}

checkUsuariosTable();
