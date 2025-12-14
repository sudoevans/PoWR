// Simple test script to verify servers are running
const http = require('http');

function testServer(port, name) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✓ ${name} server is running on port ${port}`);
          resolve(true);
        } else {
          console.log(`✗ ${name} server returned status ${res.statusCode}`);
          reject(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`✗ ${name} server is not running on port ${port}: ${err.message}`);
      reject(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`✗ ${name} server timeout on port ${port}`);
      reject(false);
    });
  });
}

async function testServers() {
  console.log('Testing servers...\n');
  
  try {
    await testServer(3001, 'Backend');
  } catch (e) {
    console.log('  → Start backend with: cd backend && npm run dev\n');
  }
  
  try {
    await testServer(3000, 'Frontend');
  } catch (e) {
    console.log('  → Start frontend with: cd frontend && npm run dev\n');
  }
  
  console.log('\nTest complete!');
}

testServers();

