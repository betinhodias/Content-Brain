import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkClients() {
  console.log('--- Clients Audit ---');
  const { data: clients } = await supabase.from('clients').select('id, name, agency_id');
  console.log('Clients in DB:', clients);

  const { data: agencyUsers } = await supabase.from('agency_users').select('agency_id, user_id');
  console.log('Agency-User Links:', agencyUsers);
}

checkClients();
