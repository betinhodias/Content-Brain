
const API_URL = 'http://localhost:4000';

async function testAuth() {
  console.log('Testing login...');
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'betinho@nosautomacao.com.br',
        pass: 'kiqgew-6zerfe-wazrEr'
      })
    });
    
    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} ${errText}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful! Token acquired.');
    
    console.log('\nTesting /clients...');
    const clientsRes = await fetch(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Clients Status:', clientsRes.status);
    console.log('Clients Data:', await clientsRes.json());
    
    console.log('\nTesting /stats...');
    const statsRes = await fetch(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Stats Status:', statsRes.status);
    console.log('Stats Data:', await statsRes.json());
    
    console.log('\nTesting /pipelines?limit=5...');
    const pipeRes = await fetch(`${API_URL}/pipelines?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Pipelines Status:', pipeRes.status);
    console.log('Pipelines Data:', await pipeRes.json());
    
  } catch (err: any) {
    console.error('ERROR OCCURRED:', err.message);
  }
}

testAuth();
