const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9_-]{30,}/g },
  {
    name: 'Ollama API Key',
    regex: /OLLAMA_API_KEY\s*=\s*(?!"your_api_key"|"")['"][a-zA-Z0-9_-]{16,}['"]/g,
  },
  {
    name: 'Generic Password/Secret',
    regex:
      /(api_key|password|client_secret|private_key)\s*=\s*['"](?!your_api_key|your_password|your_secret|your_db|default_pass)[a-zA-Z0-9_-]{16,}['"]/gi,
  },
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (
      f === 'node_modules' ||
      f === '.git' ||
      f === '.agents' ||
      f === 'demo_project' ||
      f === 'dist'
    ) {
      return;
    }
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

let leaks = 0;
walkDir('.', (filePath) => {
  const ext = path.extname(filePath);
  if (!['.js', '.json', '.env', '.md', '.yml', '.yaml', '.html'].includes(ext)) {
    return;
  }

  if (filePath === '.env.example' || filePath === 'test-deps.js') {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  SECRET_PATTERNS.forEach((pat) => {
    let match;
    while ((match = pat.regex.exec(content)) !== null) {
      console.error(
        `❌ Security Warning: Possible ${pat.name} leak found in ${filePath} at match "${match[0].slice(0, 15)}..."`
      );
      leaks++;
    }
  });
});

if (leaks > 0) {
  console.error(`\n❌ Secret scan failed: Found ${leaks} possible credential leak(s).`);
  process.exit(1);
}

console.log('✅ Security Scan: No credential leaks found in code files.');
process.exit(0);
