import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectUsuariosTable() {
  // Buscar um usuário para ver todos os campos
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('User keys:', Object.keys(data[0]));
    console.log('User data:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('No users found.');
  }
}

inspectUsuariosTable();
