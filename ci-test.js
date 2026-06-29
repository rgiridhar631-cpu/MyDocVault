const { spawn } = require('child_process');
const http = require('http');

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  const testPort = '3123';
  console.log(`Starting MyDocVault server on test port ${testPort}...`);
  
  const env = { ...process.env, PORT: testPort };
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env
  });

  // Give the server 4 seconds to boot
  await new Promise(resolve => setTimeout(resolve, 4000));

  let success = false;
  try {
    const res = await request(`http://localhost:${testPort}/api/health`);
    console.log('Health check HTTP Status:', res.statusCode);
    console.log('Health check Response Body:', res.body);
    
    if (res.statusCode === 200 && res.body && res.body.status === 'ok') {
      console.log('✅ Server started and health check passed successfully!');
      success = true;
    } else {
      console.error('❌ Unexpected response from health check endpoint');
    }
  } catch (err) {
    console.error('❌ Failed to connect to health check endpoint:', err.message);
  }

  console.log('Stopping server...');
  server.kill('SIGTERM');
  
  // Wait a moment for server to exit
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Double check and force kill if still running
  try {
    process.kill(server.pid, 0);
    console.log('Server still running, sending SIGKILL...');
    server.kill('SIGKILL');
  } catch (e) {
    // Process is already dead
  }

  if (!success) {
    process.exit(1);
  }
  console.log('CI test complete.');
  process.exit(0);
}

main();
