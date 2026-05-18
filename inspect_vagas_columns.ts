import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function inspectVagasColumns() {
  const { data, error } = await supabase
    .from('vagas_estacionamento')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Keys in "vagas_estacionamento":', Object.keys(data[0]));
  } else {
    console.log('Table "vagas_estacionamento" is empty.');
  }
}

inspectVagasColumns();
