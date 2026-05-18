import { createClient } from '@supabase/supabase-js';

const API_URL = 'http://localhost:4000';

async function testCopyAgent() {
  console.log('Testing login...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'betinho@nosautomacao.com.br',
      pass: 'kiqgew-6zerfe-wazrEr'
    })
  });
  
  if (!loginRes.ok) throw new Error('Login failed');
  const loginData = await loginRes.json();
  const token = loginData.token;

  console.log('Fetching clients...');
  const clientsRes = await fetch(`${API_URL}/clients`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const clientsData = await clientsRes.json();
  const clientId = clientsData.data[0].id;

  console.log(`Creating pipeline for client ${clientId}...`);
  const createRes = await fetch(`${API_URL}/pipelines/copy`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      clientId,
      contentType: 'carousel',
      topic: 'Por que inteligência artificial não é apenas um chatbot e como agentes autônomos resolvem problemas de negócios',
      tone: 'direto, persuasivo, profissional'
    })
  });

  const createData = await createRes.json();
  console.log('Create Response:', createData);

  if (!createData.success) {
    throw new Error('Pipeline creation failed');
  }

  const pollUrl = `${API_URL}${createData.data.pollUrl}`;
  console.log(`Polling ${pollUrl}...`);

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pollData = await pollRes.json();
    console.log(`Status [${i}]: ${pollData.data.status}`);
    
    if (pollData.data.status === 'completed' || pollData.data.status === 'failed') {
      console.log('Final Result:', JSON.stringify(pollData.data, null, 2));
      break;
    }
  }
}

testCopyAgent().catch(console.error);
