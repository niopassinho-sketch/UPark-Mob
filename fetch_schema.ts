import * as fs from 'fs';

async function fetchSchema() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    console.error('Missing env vars');
    return;
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`);
  const json = await res.json();
  
  const vagas = json.definitions.vagas_estacionamento;
  console.log(JSON.stringify(vagas, null, 2));
}

fetchSchema();
