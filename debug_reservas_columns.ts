import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugReservasColumns() {
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

debugReservasColumns();
