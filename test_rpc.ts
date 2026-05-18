
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function testSpots() {
  const { data, error } = await supabase.rpc('get_vagas_com_coordenadas', { p_lat: -2.5307, p_lng: -44.3028 });
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Primeiro spot:', data && data.length > 0 ? data[0] : 'nenhum spot');
  }
}

testSpots();
