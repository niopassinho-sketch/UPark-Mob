import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugReservas() {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, vagas_estacionamento(nome, endereco), veiculos(marca, modelo, placa), usuarios(nome_completo)')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Raw Reservation Data:', JSON.stringify(data, null, 2));
  }
}

debugReservas();
