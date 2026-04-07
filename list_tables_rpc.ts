import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  const { data, error } = await supabase
    .rpc('get_tables');
    
  if (error) {
    console.error('Erro ao listar tabelas via RPC:', error);
  } else {
    console.log('Tabelas encontradas:', data);
  }
}

listTables();
