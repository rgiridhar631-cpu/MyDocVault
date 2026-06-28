/**
 * MyDocVault — server.js
 * Express server that:
 * - Serves static files (index.html, style.css, script.js)
 * - Proxies /api/ask → Anthropic API (keeps API key off client)
 * - Optionally proxies /api/ollama → local Ollama (privacy-first fallback)
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

// ── Services
const { extractWithOcr }    = require('./services/ocr');
const { parsePdf }          = require('./services/pdf');
const { askOllama, ollamaHealth } = require('./services/ollama');
const { initDb, saveDoc, getDocs, deleteDoc } = require('./services/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname)));

// ── Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

// ── Health check
app.get('/api/health', async (req, res) => {
  const ollamaOk = await ollamaHealth();
  res.json({
    status: 'ok',
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    ollama: ollamaOk,
    model: MODEL,
  });
});

// ── /api/ask  — main AI endpoint (proxies to Anthropic)
app.post('/api/ask', async (req, res) => {
  const { system, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Sanitize: ensure each message has role + content
  const cleaned = messages.map(m => ({
    role: m.role,
    content: Array.isArray(m.content)
      ? m.content
      : [{ type: 'text', text: String(m.content) }],
  }));

  try {
    const response = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 2048,
      system:     system || '',
      messages:   cleaned,
    });

    res.json(response);
  } catch (err) {
    console.error('[/api/ask] Anthropic error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/ollama  — local Ollama fallback (privacy-first)
app.post('/api/ollama', async (req, res) => {
  const { prompt, model } = req.body;
  try {
    const result = await askOllama(prompt, model);
    res.json({ content: [{ type: 'text', text: result }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── /api/extract/pdf  — server-side PDF text extraction
app.post('/api/extract/pdf', async (req, res) => {
  const { base64 } = req.body;
  if (!base64) return res.status(400).json({ error: 'base64 required' });
  try {
    const text = await parsePdf(base64);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── /api/extract/ocr  — server-side OCR for images
app.post('/api/extract/ocr', async (req, res) => {
  const { base64, mimeType } = req.body;
  if (!base64) return res.status(400).json({ error: 'base64 required' });
  try {
    const text = await extractWithOcr(base64, mimeType);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── /api/docs  — persist documents in local SQLite DB
app.get('/api/docs', async (_req, res) => {
  try {
    const docs = await getDocs();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/docs', async (req, res) => {
  const { id, name, size, mimeType, extracted } = req.body;
  // NOTE: we do NOT store base64 on disk — privacy-first
  try {
    await saveDoc({ id, name, size, mimeType, extracted });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/docs/:id', async (req, res) => {
  try {
    await deleteDoc(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   MyDocVault Server · Port ${PORT}      ║
╠══════════════════════════════════════╣
║  UI   → http://localhost:${PORT}        ║
║  API  → http://localhost:${PORT}/api   ║
╚══════════════════════════════════════╝
    `);
  });
});