import { createClient } from '@supabase/supabase-js';

// Usando process.env para acessar os segredos injetados pelo AI Studio
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReservas() {
  const { data, error } = await supabase
    .from('reservas')
    .select('*');
    
  if (error) {
    console.error('Erro ao buscar reservas:', error);
  } else {
    console.log('Reservas encontradas:', data);
  }
}

checkReservas();
