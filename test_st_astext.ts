import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function testSelect() {
  const { data, error } = await supabase
    .from('vagas_estacionamento')
    .select('nome, localizacao_text:ST_AsText(localizacao)')
    .limit(1);                
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Result:', data);
  }
}

testSelect();
