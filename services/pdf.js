/**
 * services/pdf.js
 * PDF text extraction using pdf-parse (100% local, no cloud).
 * Converts base64 PDF → plain text string.
 */

/**
 * Parse text from a base64-encoded PDF.
 * @param {string} base64  Raw base64 string (no data: prefix)
 * @returns {Promise<string>} Extracted plain text
 */
async function parsePdf(base64) {
  const pdfParse = require('pdf-parse');
  const buffer   = Buffer.from(base64, 'base64');
  const result   = await pdfParse(buffer);
  return result.text.trim();
}

/**
 * Get page count from a base64-encoded PDF without full text extraction.
 * @param {string} base64
 * @returns {Promise<number>}
 */
async function getPdfPageCount(base64) {
  const pdfParse = require('pdf-parse');
  const buffer   = Buffer.from(base64, 'base64');
  const result   = await pdfParse(buffer, { max: 1 });
  return result.numpages;
}

/**
 * Extract text from a specific page range.
 * @param {string} base64
 * @param {number} maxPages  Max pages to extract (default: all)
 * @returns {Promise<string>}
 */
async function parsePdfPages(base64, maxPages = 0) {
  const pdfParse = require('pdf-parse');
  const buffer   = Buffer.from(base64, 'base64');
  const options  = maxPages > 0 ? { max: maxPages } : {};
  const result   = await pdfParse(buffer, options);
  return result.text.trim();
}

module.exports = { parsePdf, parsePdfPages, getPdfPageCount };