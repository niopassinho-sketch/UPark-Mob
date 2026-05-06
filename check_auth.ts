import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUser() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Auth user:', user);
  
  if (user) {
    const { data: userData, error: userError } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    console.log('User data from DB:', userData);
  }
}

checkAuthUser();
