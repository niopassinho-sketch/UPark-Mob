import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsuariosTable() {
  // Tenta buscar a definição da tabela usando a query do PostgreSQL
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'usuarios' });
    
  if (error) {
    console.log('RPC Error:', error.message);
    // Fallback: tentar buscar via query direta no information_schema se o RPC falhar
    const { data: data2, error: error2 } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'usuarios');
    if (error2) {
      console.log('Query Error:', error2.message);
    } else {
      console.log('Columns (via query):', data2.map(c => c.column_name));
    }
  } else {
    console.log('Columns (via RPC):', data);
  }
}

checkUsuariosTable();
