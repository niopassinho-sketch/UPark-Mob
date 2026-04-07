import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { error } = await supabase.from('usuarios').select('creditos').limit(1);
  console.log('Select creditos error:', error);
}
checkSchema();
