import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function test() {
  console.log('Testing connection to:', supabaseUrl);
  const { data, error } = await supabase.from('clients').select('count');
  if (error) {
    console.error('❌ Connection error:', error.message);
  } else {
    console.log('✅ Connection successful! Data:', data);
  }
}

test();
