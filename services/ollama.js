/**
 * services/ollama.js
 * Interface to a locally running Ollama instance.
 * Used as the privacy-first AI fallback when the user prefers
 * no external API calls at all.
 *
 * Requires: Ollama running at http://localhost:11434
 * Recommended models: llama3, mistral, phi3
 */

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const DEFAULT_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || DEFAULT_MODEL;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);

// node-fetch v2 — CommonJS compatible
const fetch = require('node-fetch');

function ollamaHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (OLLAMA_API_KEY && OLLAMA_API_KEY !== 'your_api_key') {
    headers.Authorization = `Bearer ${OLLAMA_API_KEY}`;
  }
  return headers;
}

/**
 * Check if Ollama is running locally.
 * @returns {Promise<boolean>}
 */
async function ollamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      headers: ollamaHeaders(),
      timeout: 2000,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Send a prompt to Ollama and return the response text.
 * @param {string} prompt      Full prompt text (system + user combined)
 * @param {string} [model]     Ollama model name
 * @returns {Promise<string>}
 */
async function askOllama(prompt, model = DEFAULT_MODEL) {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: ollamaHeaders(),
    timeout: OLLAMA_TIMEOUT_MS,
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.1, // Low temp for factual doc extraction
        num_predict: 2048,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.response?.trim() || '';
}

async function askOllamaVision(prompt, base64Image, model = DEFAULT_VISION_MODEL) {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: ollamaHeaders(),
    timeout: OLLAMA_TIMEOUT_MS,
    body: JSON.stringify({
      model,
      prompt,
      images: [base64Image],
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 2048,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama vision error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.response?.trim() || '';
}

/**
 * List available Ollama models.
 * @returns {Promise<string[]>} model names
 */
async function listOllamaModels() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      headers: ollamaHeaders(),
    });
    const data = await res.json();
    return (data.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

module.exports = { askOllama, askOllamaVision, ollamaHealth, listOllamaModels };
