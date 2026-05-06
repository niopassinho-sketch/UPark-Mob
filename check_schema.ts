import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { data, error } = await supabase.from('usuarios').select('id, email').limit(1);
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Data:', data);
  }
}
checkSchema();
