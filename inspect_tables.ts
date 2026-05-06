import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectAllTables() {
  // Tentar listar todas as tabelas via query no information_schema
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
    
  if (error) {
    console.log('Error listing tables:', error.message);
  } else {
    console.log('Tables:', data.map(t => t.table_name));
  }
}

inspectAllTables();
