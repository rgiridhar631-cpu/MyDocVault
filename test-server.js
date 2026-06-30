const http = require('http');

function request(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  // Test health
  try {
    const health = await request('http://localhost:3000/api/health');
    console.log('HEALTH:', JSON.stringify(health, null, 2));
  } catch (e) {
    console.log('Health FAILED:', e.message);
    process.exit(1);
  }

  // Test ask endpoint with Ollama
  try {
    const res = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'You are a test assistant.',
        messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
      }),
    });
    const data = await res.json();
    console.log('ASK response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('ASK FAILED:', e.message);
  }
}

main();
