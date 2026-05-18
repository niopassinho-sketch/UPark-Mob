import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function inspectFunction() {
  const { data, error } = await supabase
    .from('information_schema.routines')
    .select('routine_definition')
    .eq('routine_name', 'get_vagas_com_coordenadas')
    .single();

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Definição:', data);
  }
}

inspectFunction();
