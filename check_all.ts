import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAll() {
  const { data: trans, error: transError } = await supabase.from('transacoes').select('*');
  const { data: users, error: userError } = await supabase.from('usuarios').select('*');
  
  console.log('Transacoes count:', trans?.length);
  console.log('Usuarios count:', users?.length);
  console.log('Transacoes:', JSON.stringify(trans, null, 2));
  console.log('Usuarios:', JSON.stringify(users, null, 2));
}

checkAll();
