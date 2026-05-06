import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsuariosColumns() {
  // Tenta buscar apenas uma linha e pegar as chaves
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error querying "usuarios":', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in "usuarios":', Object.keys(data[0]));
  } else {
    console.log('No data in "usuarios" table.');
  }
}

checkUsuariosColumns();
