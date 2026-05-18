import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkView() {
  const { data, error } = await supabase.from('vagas_com_status_expediente').select('*').limit(5);
  if (error) {
    console.error('Error querying "vagas_com_status_expediente":', error);
  } else {
    console.log('Data from "vagas_com_status_expediente":', data);
  }
}

checkView();
