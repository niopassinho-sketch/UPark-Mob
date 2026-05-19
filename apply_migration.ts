import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');

async function applyMigration() {
  const sql = fs.readFileSync('./migrations/001_setup_public_parking.sql', 'utf8');
  
  // Splitting by semicolon and executing might be necessary if exec_sql doesn't handle full script execution
  const statements = sql.split(';').filter(s => s.trim() !== '');

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        console.error('Error executing:', stmt, error);
      } else {
        console.log('Executed:', stmt.substring(0, 50));
      }
    } catch (e) {
      console.error('Exception on:', stmt, e);
    }
  }
}

applyMigration();
