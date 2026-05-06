import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectUsuariosTable() {
  // Tenta buscar um registro qualquer para ver as chaves
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Keys in "usuarios":', Object.keys(data[0]));
  } else {
    console.log('Table "usuarios" is empty.');
  }
}

inspectUsuariosTable();
