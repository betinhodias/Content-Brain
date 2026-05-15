import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clean() {
  console.log('🧹 Cleaning duplicate agency associations...');
  
  const { data: users } = await supabase.from('agency_users').select('user_id');
  const uniqueUsers = Array.from(new Set(users?.map(u => u.user_id)));

  for (const userId of uniqueUsers) {
    const { data: records } = await supabase
      .from('agency_users')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (records && records.length > 1) {
      const idsToDelete = records.slice(1).map(r => r.id);
      await supabase.from('agency_users').delete().in('id', idsToDelete);
      console.log(`Removed ${idsToDelete.length} duplicates for user ${userId}`);
    }
  }
  console.log('✅ Clean complete.');
}

clean();
