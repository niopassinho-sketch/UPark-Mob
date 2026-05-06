import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTransacoes() {
  // Buscar transações com join explícito e logar o resultado
  const { data, error } = await supabase
    .from('transacoes')
    .select('usuario_id, usuarios(id, full_name, email, name)')
    .limit(5);
    
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Transactions:', JSON.stringify(data, null, 2));
  }
}

inspectTransacoes();
