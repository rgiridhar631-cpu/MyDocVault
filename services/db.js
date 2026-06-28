/**
 * services/db.js
 * Local SQLite database for storing document metadata.
 * NOTE: Raw file bytes (base64) are intentionally NOT stored to disk —
 *       only extracted metadata and summaries are persisted.
 *
 * Uses: better-sqlite3 (synchronous, zero-config, file-based)
 */

const path = require('path');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'vault.db');

let db = null;

/**
 * Initialise the database and create tables if they don't exist.
 * @returns {Promise<void>}
 */
async function initDb() {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH, { verbose: null });

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      size        INTEGER,
      mime_type   TEXT,
      doc_type    TEXT,
      holder_name TEXT,
      doc_number  TEXT,
      issue_date  TEXT,
      expiry_date TEXT,
      authority   TEXT,
      summary     TEXT,
      extracted_text TEXT,
      confidence  REAL,
      created_at  INTEGER DEFAULT (strftime('%s','now'))
    );
  `);

  const columns = db.prepare('PRAGMA table_info(documents)').all().map(col => col.name);
  if (!columns.includes('extracted_text')) {
    db.exec('ALTER TABLE documents ADD COLUMN extracted_text TEXT DEFAULT ""');
  }

  console.log(`[DB] Vault database ready: ${DB_PATH}`);
}

/**
 * Save document metadata (never stores the raw file bytes).
 * @param {{ id, name, size, mimeType, extracted }} doc
 */
async function saveDoc({ id, name, size, mimeType, extracted = {} }) {
  ensureReady();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO documents
      (id, name, size, mime_type, doc_type, holder_name, doc_number,
       issue_date, expiry_date, authority, summary, extracted_text, confidence)
    VALUES
      (@id, @name, @size, @mimeType, @docType, @holderName, @docNumber,
       @issueDate, @expiryDate, @authority, @summary, @extractedText, @confidence)
  `);

  stmt.run({
    id,
    name,
    size:        size || 0,
    mimeType:    mimeType || '',
    docType:     extracted.document_type    || '',
    holderName:  extracted.holder_name      || '',
    docNumber:   extracted.document_number  || '',
    issueDate:   extracted.issue_date       || '',
    expiryDate:  extracted.expiry_date      || '',
    authority:   extracted.issuing_authority || '',
    summary:     extracted.summary          || '',
    extractedText: extracted.extracted_text  || '',
    confidence:  extracted.confidence       || 0,
  });
}

/**
 * Retrieve all stored document metadata.
 * @returns {Promise<object[]>}
 */
async function getDocs() {
  ensureReady();
  const rows = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
  return rows.map(rowToDoc);
}

/**
 * Retrieve a single document by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getDoc(id) {
  ensureReady();
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  return row ? rowToDoc(row) : null;
}

/**
 * Delete a document record.
 * @param {string} id
 */
async function deleteDoc(id) {
  ensureReady();
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

/**
 * Search documents by holder name or document type.
 * @param {string} query
 * @returns {Promise<object[]>}
 */
async function searchDocs(query) {
  ensureReady();
  const like = `%${query}%`;
  const rows = db.prepare(`
    SELECT * FROM documents
    WHERE holder_name LIKE ? OR doc_type LIKE ? OR name LIKE ?
    ORDER BY created_at DESC
  `).all(like, like, like);
  return rows.map(rowToDoc);
}

// ── Internal helpers ──────────────────────────────────────────

function ensureReady() {
  if (!db) throw new Error('Database not initialised. Call initDb() first.');
}

function rowToDoc(row) {
  return {
    id:       row.id,
    name:     row.name,
    size:     row.size,
    mimeType: row.mime_type,
    extracted: {
      document_type:      row.doc_type,
      holder_name:        row.holder_name,
      document_number:    row.doc_number,
      issue_date:         row.issue_date,
      expiry_date:        row.expiry_date,
      issuing_authority:  row.authority,
      summary:            row.summary,
      extracted_text:     row.extracted_text,
      confidence:         row.confidence,
    },
    createdAt: row.created_at,
  };
}

module.exports = { initDb, saveDoc, getDoc, getDocs, deleteDoc, searchDocs };
