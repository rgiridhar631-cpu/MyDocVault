try {
  require('better-sqlite3');
  console.log('better-sqlite3: OK');
} catch(e) {
  console.log('better-sqlite3: FAIL - ' + e.message);
}

try {
  require('tesseract.js');
  console.log('tesseract.js: OK');
} catch(e) {
  console.log('tesseract.js: FAIL - ' + e.message);
}

try {
  const fetch = require('node-fetch');
  console.log('node-fetch: OK');
} catch(e) {
  console.log('node-fetch: FAIL - ' + e.message);
}

try {
  require('pdf-parse');
  console.log('pdf-parse: OK');
} catch(e) {
  console.log('pdf-parse: FAIL - ' + e.message);
}

try {
  require('@anthropic-ai/sdk');
  console.log('@anthropic-ai/sdk: OK');
} catch(e) {
  console.log('@anthropic-ai/sdk: FAIL - ' + e.message);
}