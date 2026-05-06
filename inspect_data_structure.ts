import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTransacoesAndUsuarios() {
  // 1. Buscar uma transação para ver como o objeto 'usuarios' está vindo
  const { data: transacoes, error: transError } = await supabase
    .from('transacoes')
    .select('*, usuarios(*)')
    .limit(1);
    
  if (transError) {
    console.log('Error fetching transacoes:', transError.message);
  } else if (transacoes && transacoes.length > 0) {
    console.log('Transaction object:', JSON.stringify(transacoes[0], null, 2));
  } else {
    console.log('No transactions found.');
  }

  // 2. Buscar um usuário diretamente para ver os campos
  const { data: usuarios, error: userError } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);

  if (userError) {
    console.log('Error fetching usuarios:', userError.message);
  } else if (usuarios && usuarios.length > 0) {
    console.log('User object:', JSON.stringify(usuarios[0], null, 2));
  } else {
    console.log('No users found.');
  }
}

inspectTransacoesAndUsuarios();
