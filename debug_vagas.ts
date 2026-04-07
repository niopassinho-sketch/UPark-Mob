import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugVagas() {
  const { data, error } = await supabase
    .from('vagas_estacionamento')
    .select('*')
    .limit(5);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Vagas Data:', JSON.stringify(data, null, 2));
  }
}

debugVagas();
