/**
 * MyDocVault — server.js
 * Express server that:
 * - Serves static files (index.html, style.css, script.js)
 * - Proxies /api/ask → Anthropic API (keeps API key off client)
 * - Optionally proxies /api/ollama → local Ollama (privacy-first fallback)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

// ── Services
const { extractWithOcr } = require('./services/ocr');
const { parsePdf } = require('./services/pdf');
const { askOllama, askOllamaVision, ollamaHealth } = require('./services/ollama');
const { initDb, saveDoc, getDocs, deleteDoc } = require('./services/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JSON_LIMIT = '35mb';

// ── Middleware
app.use(cors());
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.static(path.join(__dirname)));

// ── Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';

// ── Health check
app.get('/api/health', async (req, res) => {
  const ollamaOk = await ollamaHealth();
  res.json({
    status: 'ok',
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    ollama: ollamaOk,
    ollamaAuth: !!process.env.OLLAMA_API_KEY && process.env.OLLAMA_API_KEY !== 'your_api_key',
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
  const cleaned = messages.map((m) => ({
    role: m.role,
    content: Array.isArray(m.content) ? m.content : [{ type: 'text', text: String(m.content) }],
  }));

  try {
    if (!anthropic) {
      const ollamaOk = await ollamaHealth();
      if (!ollamaOk) {
        return res.status(503).json({
          error:
            'No AI backend is configured. Set ANTHROPIC_API_KEY, or start Ollama locally and install a model such as llama3.',
        });
      }

      const prompt = toOllamaPrompt(system || '', cleaned);
      const image = firstImage(cleaned);
      const result = image
        ? await askOllamaVision(prompt, image.data, image.model)
        : await askOllama(prompt);
      return res.json({ content: [{ type: 'text', text: result }] });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: system || '',
      messages: cleaned,
    });

    res.json(response);
  } catch (err) {
    console.error('[/api/ask] Anthropic error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/ollama  — local Ollama fallback (privacy-first)
function toOllamaPrompt(system, messages) {
  const lines = [];
  if (system) lines.push(`System:\n${system}`);

  for (const message of messages) {
    const role = message.role === 'assistant' ? 'Assistant' : 'User';
    const text = message.content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part.type === 'text') return part.text || '';
        return `[${part.type || 'attachment'} omitted: local Ollama text prompt only]`;
      })
      .filter(Boolean)
      .join('\n');
    lines.push(`${role}:\n${text}`);
  }

  lines.push('Assistant:');
  return lines.join('\n\n');
}

function firstImage(messages) {
  for (const message of messages) {
    for (const part of message.content || []) {
      if (part?.type === 'image' && part.source?.type === 'base64') {
        return {
          data: part.source.data,
          model: process.env.OLLAMA_VISION_MODEL,
        };
      }
    }
  }
  return null;
}

app.post('/api/extract/vision', async (req, res) => {
  const { base64, filename } = req.body;
  if (!base64) return res.status(400).json({ error: 'base64 required' });

  try {
    const prompt = `Read this document image carefully. Return ONLY valid JSON with this schema:
{
  "document_type": "",
  "holder_name": "",
  "document_number": "",
  "issue_date": "",
  "expiry_date": "",
  "issuing_authority": "",
  "summary": "",
  "confidence": 0.0,
  "extracted_text": ""
}

File name: ${filename || 'uploaded image'}
Use empty strings for unknown fields. Do not invent values.`;
    const raw = await askOllamaVision(prompt, base64);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.json({ raw });
    res.json(JSON.parse(match[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
app.use((err, _req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Upload is too large. Keep each file under 20 MB.' });
  }
  return next(err);
});

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
