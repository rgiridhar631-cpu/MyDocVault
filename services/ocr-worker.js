// Lazy-load tesseract.js only when needed, to avoid startup crashes
let Tesseract;
try {
  Tesseract = require('tesseract.js');
} catch (e) {
  // Will be caught in the handler
}

process.once('message', async ({ base64 }) => {
  try {
    if (!Tesseract) {
      Tesseract = require('tesseract.js');
    }
    const buffer = Buffer.from(base64, 'base64');
    const result = await Tesseract.recognize(buffer, 'eng');
    process.send({ ok: true, text: result.data.text || '' });
  } catch (err) {
    process.send({ ok: false, error: err.message || String(err) });
  }
});
