import { createClient } from '@supabase/supabase-js';

const API_URL = 'http://localhost:4000';

async function testVisualAgent() {
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

  console.log('Fetching pipelines to find completed one...');
  const pipelinesRes = await fetch(`${API_URL}/pipelines?limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const pipelinesData = await pipelinesRes.json();
  const completedPipeline = pipelinesData.data.find((p: any) => p.status === 'completed' && p.content_type === 'carousel');

  if (!completedPipeline) {
    throw new Error('No completed pipeline found. Please run test-copy-agent.ts first.');
  }

  const pipelineId = completedPipeline.id;
  console.log(`Triggering Visual Agent for pipeline ${pipelineId}...`);

  const visualRes = await fetch(`${API_URL}/pipelines/visual`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      pipelineId,
      imageCount: 1
    })
  });

  const visualData = await visualRes.json();
  console.log('Visual Response:', visualData);

  if (!visualData.success) {
    throw new Error('Visual Agent trigger failed');
  }

  const pollUrl = `${API_URL}${visualData.pollUrl}`;
  console.log(`Polling ${pollUrl}...`);

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pollData = await pollRes.json();
    console.log(`Status [${i}]: ${pollData.data.status}`);
    
    if (pollData.data.visual_output) {
      console.log('Visual Output Results:', JSON.stringify(pollData.data.visual_output, null, 2));
      break;
    }
    if (pollData.data.status === 'failed') {
      console.log('Failed details:', pollData.data.error);
      break;
    }
  }
}

testVisualAgent().catch(console.error);
