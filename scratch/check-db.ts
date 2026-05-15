import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('--- Database Audit ---');
  
  const { data: agencies } = await supabase.from('agencies').select('*');
  console.log('Agencies:', agencies);

  const { data: users } = await supabase.from('agency_users').select('*');
  console.log('Agency Users (Links):', users);

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log('Auth Users:', authUsers.users.map(u => ({ id: u.id, email: u.email })));
}

check();
