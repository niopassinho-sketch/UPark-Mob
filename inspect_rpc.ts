
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function inspectRPC() {
  const { data, error } = await supabase
    .rpc('get_function_def', { p_func_name: 'solicitar_reserva_com_estoque' });

  if (error) {
    if (error.code === 'PGRST202') {
        console.log('Função solicitar_reserva_com_estoque não existe ou não foi encontrada.');
    } else {
        console.error('Erro:', error);
    }
  } else {
    console.log('Definição:', data);
  }
}

inspectRPC();
