import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function inspectFunction() {
  const { data, error } = await supabase
    .rpc('get_function_def', { p_func_name: 'get_vagas_com_coordenadas' });

  if (error) {
    console.error('Erro ao buscar definição:', error);
  } else {
    console.log('Definição atual:', data);
  }
}

inspectFunction();
