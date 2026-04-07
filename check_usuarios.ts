import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*').limit(1);
  console.log('Usuarios error:', error);
}
checkUsuarios();
