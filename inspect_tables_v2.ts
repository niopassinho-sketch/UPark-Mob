import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectAllTablesDirectly() {
  // Tentar listar tabelas usando a API do Supabase diretamente se possível, ou query SQL
  const { data, error } = await supabase.rpc('get_tables'); // Supondo que exista ou tentar outra forma
    
  if (error) {
    console.log('Error listing tables via RPC:', error.message);
    // Tentar query SQL direta se RPC falhar
    const { data: data2, error: error2 } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
    if (error2) {
        console.log('Error listing tables via SQL:', error2.message);
    } else {
        console.log('Tables via SQL:', data2.map(t => t.tablename));
    }
  } else {
    console.log('Tables:', data);
  }
}

inspectAllTablesDirectly();
