/**
 * services/ocr.js
 * OCR text extraction using Tesseract.js (100% local, no cloud).
 * Converts base64 image → plain text via local OCR engine.
 */

const path = require('path');
const { fork } = require('child_process');

/**
 * Extract text from a base64-encoded image using Tesseract.js OCR.
 * @param {string} base64  Raw base64 string (no data: prefix)
 * @param {string} mimeType e.g. "image/png", "image/jpeg"
 * @returns {Promise<string>} Extracted plain text
 */
async function extractWithOcr(base64, mimeType) {
  return new Promise((resolve, reject) => {
    const worker = fork(path.join(__dirname, 'ocr-worker.js'), [], {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });

    const timeout = setTimeout(() => {
      worker.kill();
      reject(new Error('OCR timed out'));
    }, 90000);

    worker.once('message', (message) => {
      clearTimeout(timeout);
      worker.kill();

      if (message.ok) {
        resolve((message.text || '').trim());
      } else {
        reject(new Error(message.error || 'OCR failed'));
      }
    });

    worker.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    worker.once('exit', (code) => {
      clearTimeout(timeout);
      if (code && code !== 0) {
        reject(new Error(`OCR worker exited with code ${code}`));
      }
    });

    worker.send({ base64, mimeType });
  });
}

module.exports = { extractWithOcr };
