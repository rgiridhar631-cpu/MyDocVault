const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

const filesToCopy = [
  'index.html',
  'style.css',
  'script.js',
  'server.js',
  'package.json'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
    console.log(`Copied ${file} to dist/`);
  }
});

// Copy services folder
const servicesDir = path.join(__dirname, 'services');
const distServicesDir = path.join(distDir, 'services');
if (fs.existsSync(servicesDir)) {
  if (!fs.existsSync(distServicesDir)) {
    fs.mkdirSync(distServicesDir);
  }
  fs.readdirSync(servicesDir).forEach(file => {
    fs.copyFileSync(path.join(servicesDir, file), path.join(distServicesDir, file));
    console.log(`Copied services/${file} to dist/services/`);
  });
}
console.log('Packaging complete.');
process.exit(0);
