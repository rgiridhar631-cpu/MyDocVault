const deps = [
  'express',
  'cors',
  'better-sqlite3',
  'tesseract.js',
  'node-fetch',
  'pdf-parse',
  '@anthropic-ai/sdk'
];

let failed = false;
deps.forEach(dep => {
  try {
    require(dep);
    console.log(`${dep}: OK`);
  } catch (e) {
    console.error(`${dep}: FAIL - ${e.message}`);
    failed = true;
  }
});

if (failed) {
  process.exit(1);
}
console.log('All dependencies verified successfully.');
process.exit(0);