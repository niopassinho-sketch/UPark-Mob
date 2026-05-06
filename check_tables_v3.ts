import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  const { data: trans, error: transError } = await supabase.from('transacoes').select('*');
  const { data: users, error: userError } = await supabase.from('usuarios').select('*');
  
  console.log('Transacoes:', trans);
  console.log('Usuarios:', users);
}

checkTables();
