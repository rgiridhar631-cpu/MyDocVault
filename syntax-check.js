const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f === 'node_modules' || f === '.git' || f === '.agents' || f === 'demo_project' || f === 'dist') {
      return;
    }
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

let failed = false;
walkDir('.', (filePath) => {
  if (path.extname(filePath) === '.js') {
    try {
      execSync(`node --check "${filePath}"`, { stdio: 'ignore' });
      console.log(`OK: ${filePath}`);
    } catch (err) {
      console.error(`Syntax error in ${filePath}`);
      failed = true;
    }
  }
});

if (failed) {
  process.exit(1);
}
console.log('All JavaScript files parsed successfully.');
process.exit(0);
