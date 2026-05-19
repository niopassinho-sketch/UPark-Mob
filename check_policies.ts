import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

async function checkPolicies() {
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'vagas_estacionamento');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Policies:', data);
  }
}
checkPolicies();
