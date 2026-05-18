import { supabaseAdmin } from '../src/services/supabase.js';

async function checkAssets() {
  const { data, error } = await supabaseAdmin.from('assets').select('*').limit(1);
  if (error) {
    console.error('Assets table check failed:', error.message);
  } else {
    console.log('Assets table exists!', data);
  }
}

checkAssets().catch(console.error);
