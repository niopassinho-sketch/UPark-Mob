import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectFinal() {
  // Tentar buscar transações sem join primeiro
  const { data: trans, error: transError } = await supabase.from('transacoes').select('*').limit(5);
  
  if (transError) {
    console.log('Error fetching transacoes:', transError.message);
  } else {
    console.log('Transactions:', JSON.stringify(trans, null, 2));
    
    // Se houver transações, buscar usuários correspondentes
    if (trans && trans.length > 0) {
        const userIds = trans.map(t => t.usuario_id);
        const { data: users, error: userError } = await supabase.from('usuarios').select('*').in('id', userIds);
        if (userError) {
            console.log('Error fetching users:', userError.message);
        } else {
            console.log('Users:', JSON.stringify(users, null, 2));
        }
    } else {
        console.log('No transactions found.');
    }
  }
}

inspectFinal();
