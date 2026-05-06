import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTransactions() {
  const { data, error } = await supabase
    .from('transacoes')
    .select('id, usuario_id, usuarios(id, nome_completo, email)')
    .order('data_criacao', { ascending: false });
    
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Transactions:', JSON.stringify(data, null, 2));
  }
}

inspectTransactions();
