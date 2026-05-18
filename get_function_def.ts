import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getFunctionDefinition() {
  const { data, error } = await supabase
    .rpc('get_function_def', { p_func_name: 'get_vagas_com_coordenadas' });
    
  if (error) {
    console.error('Erro ao buscar definição da função:', error);
  } else {
    console.log('Definição da função:', data);
  }
}

// Note: This assumes a helper function 'get_function_def' exists. 
// If it doesn't, I'll need to ask the user.
getFunctionDefinition();
