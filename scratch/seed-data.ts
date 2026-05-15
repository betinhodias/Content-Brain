import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function seed(userEmail: string, password: string) {
  console.log('🌱 Creating user and seeding database for:', userEmail);

  // 1. Create or Get User
  let { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: userEmail,
    password: password,
    email_confirm: true
  });

  if (authError) {
     // If user already exists, just get the ID
     const { data: users } = await supabase.auth.admin.listUsers();
     const existingUser = users?.users.find(u => u.email === userEmail);
     if (existingUser) {
       console.log('User already exists, continuing...');
       authUser = { user: existingUser } as any;
     } else {
       console.error('Error creating user:', authError.message);
       return;
     }
  }

  const user = authUser?.user;
  if (!user) return;

  // 2. Create Agency
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .insert({
      name: 'Calie Marketing',
      slug: 'calie-marketing',
    })
    .select()
    .single();

  if (agencyError) {
    console.error('Error creating agency:', agencyError.message);
    // Might already exist, try to fetch it
    const { data: existingAgency } = await supabase.from('agencies').select().eq('slug', 'calie-marketing').single();
    if (!existingAgency) return;
    (agency as any) = existingAgency;
  }

  // 3. Link User to Agency
  await supabase.from('agency_users').upsert({
    agency_id: agency!.id,
    user_id: user.id,
    role: 'admin'
  });

  // 4. Create first Client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      agency_id: agency!.id,
      name: 'Nós Automação (Demo)',
      slug: 'nos-automacao',
      industry: 'Tecnologia / Automação',
      brand_summary: 'Agência de automação focada em agentes inteligentes e eficiência operacional.'
    })
    .select()
    .single();

  if (clientError) {
    console.error('Error creating client:', clientError.message);
  }

  console.log('✅ Database and User seeded successfully!');
  console.log('Agency:', agency!.name);
  console.log('User ID:', user.id);
  console.log('---');
  console.log('You can now login at http://localhost:3000');
}

const email = process.argv[2];
const pass = process.argv[3];
if (email && pass) seed(email, pass);
else console.log('Please provide email and password');
