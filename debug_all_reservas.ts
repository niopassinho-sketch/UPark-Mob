import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAllReservas() {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, vagas_estacionamento(nome, endereco), veiculos(marca, modelo, placa), usuarios(nome_completo)');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('All Reservations Data:', JSON.stringify(data, null, 2));
  }
}

debugAllReservas();
