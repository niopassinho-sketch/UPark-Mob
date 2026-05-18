import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function inspectTable() {
  const { data, error } = await supabase
    .from('vagas_estacionamento')
    .select('*')
    .limit(1);                
  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns and types:', Object.keys(data[0]).map(k => `${k}: ${typeof data[0][k]}`));
  }
}

inspectTable();
