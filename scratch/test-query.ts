import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testQuery() {
  const userId = '6791890e-fd11-4d2e-ab68-55b6c198eb01';
  console.log(`Testing query for userId: ${userId}`);
  
  const { data, error } = await supabaseAdmin
    .from('agency_users')
    .select('agency_id, role')
    .eq('user_id', userId)
    .limit(1);
    
  console.log('Result:', { data, error });
}

testQuery();
