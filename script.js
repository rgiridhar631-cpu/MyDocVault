/* ============================================================
   MyDocVault — script.js
   Handles: UI tabs, file upload, Anthropic API (via server.js),
   chat, doc vault, government service checks.
   ============================================================ */

// ── STATE ─────────────────────────────────────────────────────
const state = {
  documents: [],    // { id, name, size, type, base64, extracted, summary }
  chatHistory: [],  // { role, content }[]
  activeTab: 'upload',
};

const SYSTEM_PROMPT = `You are MyDocVault — an offline, privacy-first document assistant.
CORE RULES:
1. Answer ONLY from the documents provided in this conversation. Never guess or fabricate.
2. When extracting data, return valid JSON exactly in this schema:
{
  "document_type": "",
  "holder_name": "",
  "document_number": "",
  "issue_date": "",
  "expiry_date": "",
  "issuing_authority": "",
  "summary": "",
  "confidence": 0.0
}
Leave unknown fields as empty strings. Confidence ∈ [0.0, 1.0]. Never invent values.
3. When explaining a document: state what it is, summarize visible info, note missing/unreadable parts, use plain non-technical wording.
4. For government service checks, format:
• Service: …
• Available documents: … (only those uploaded)
• Missing documents: … (required but not uploaded)
• What to submit: …
• Notes: …
5. If essential data cannot be found, say exactly what is missing and ask for the relevant document.
6. Be accurate, concise, neutral, and privacy-focused.`;

// ── TAB NAVIGATION ────────────────────────────────────────────
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  const labels = { upload: 'Upload Documents', vault: 'Document Vault', ask: 'Ask AI', services: 'Government Services' };
  document.getElementById('breadcrumb').textContent = labels[tab];
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── FILE UPLOAD ───────────────────────────────────────────────
const uploadZone = document.getElementById('upload-zone');
const fileInput  = document.getElementById('file-input');

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  handleFiles([...e.dataTransfer.files]);
});

fileInput.addEventListener('change', () => handleFiles([...fileInput.files]));

function handleFiles(files) {
  if (!files.length) return;
  const queue = document.getElementById('upload-queue');
  const queueList = document.getElementById('queue-list');
  queue.style.display = 'block';

  files.forEach(file => {
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item = createQueueItem(id, file.name);
    queueList.appendChild(item);
    readAndProcess(file, id, item);
  });
}

function createQueueItem(id, name) {
  const div = document.createElement('div');
  div.className = 'queue-item';
  div.id = `qi-${id}`;
  div.innerHTML = `
    <span class="queue-item-name">${escHtml(name)}</span>
    <div class="progress-bar"><div class="progress-fill" id="pf-${id}" style="width:0%"></div></div>
    <span class="queue-status processing" id="qs-${id}">Reading…</span>
  `;
  return div;
}

function readAndProcess(file, id, item) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    const mimeType = file.type || 'application/octet-stream';
    setProgress(id, 30, 'Extracting…');

    try {
      const extracted = await callApiExtract(base64, mimeType, file.name);
      setProgress(id, 100, 'done');
      document.getElementById(`qs-${id}`).textContent = 'Done';
      document.getElementById(`qs-${id}`).className = 'queue-status done';

      const doc = { id, name: file.name, size: file.size, mimeType, base64, extracted };
      state.documents.push(doc);
      updateVaultStats();
      renderVault();
    } catch (err) {
      setProgress(id, 100, 'error');
      document.getElementById(`qs-${id}`).textContent = 'Error';
      document.getElementById(`qs-${id}`).className = 'queue-status error';
      console.error('Extraction failed:', err);
    }
  };
  reader.readAsDataURL(file);
}

function setProgress(id, pct, _label) {
  const bar = document.getElementById(`pf-${id}`);
  if (bar) bar.style.width = pct + '%';
}

// ── ANTHROPIC API ─────────────────────────────────────────────
async function callApi(messages, extraSystemNote = '') {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: SYSTEM_PROMPT + (extraSystemNote ? '\n\n' + extraSystemNote : ''),
      messages,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callApiExtract(base64, mimeType, filename) {
  const isImage = mimeType.startsWith('image/');
  const isPdf   = mimeType === 'application/pdf';

  let contentPart;
  if (isImage) {
    contentPart = { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } };
  } else if (isPdf) {
    contentPart = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };
  } else {
    throw new Error('Unsupported file type');
  }

  const messages = [
    {
      role: 'user',
      content: [
        contentPart,
        { type: 'text', text: `This file is named "${filename}". Extract all structured data and return ONLY the JSON schema defined in your instructions. No other text.` },
      ],
    },
  ];

  const raw = await callApi(messages);
  // Parse JSON from response
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

// ── VAULT RENDERING ───────────────────────────────────────────
function renderVault() {
  const grid = document.getElementById('vault-grid');
  if (!state.documents.length) {
    grid.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 64 64" fill="none"><rect x="12" y="8" width="40" height="48" rx="3" stroke="#2DD4BF" stroke-width="1.5"/><path d="M20 22h24M20 30h24M20 38h16" stroke="#2DD4BF" stroke-width="1.5" stroke-linecap="round"/></svg>
      <p>No documents yet.<br/>Upload files to begin.</p>
    </div>`;
    return;
  }

  grid.innerHTML = state.documents.map(doc => {
    const ex = doc.extracted || {};
    const conf = ex.confidence ? Math.round(ex.confidence * 100) : 0;
    return `<div class="doc-card" onclick="openDocModal('${doc.id}')">
      <span class="doc-type-badge">${escHtml(ex.document_type || 'Unknown')}</span>
      <h4>${escHtml(doc.name)}</h4>
      <div class="doc-meta">
        ${ex.holder_name    ? `<div>👤 ${escHtml(ex.holder_name)}</div>` : ''}
        ${ex.document_number? `<div>🔢 ${escHtml(ex.document_number)}</div>` : ''}
        ${ex.issue_date     ? `<div>📅 ${escHtml(ex.issue_date)}</div>` : ''}
        ${ex.expiry_date    ? `<div>⏳ ${escHtml(ex.expiry_date)}</div>` : ''}
      </div>
      <div class="confidence-bar"><div class="confidence-fill" style="width:${conf}%"></div></div>
    </div>`;
  }).join('');
}

function updateVaultStats() {
  document.getElementById('doc-count').textContent = state.documents.length;
  const bytes = state.documents.reduce((a, d) => a + d.size, 0);
  document.getElementById('doc-size').textContent = formatBytes(bytes);
}

// ── DOC MODAL ─────────────────────────────────────────────────
function openDocModal(id) {
  const doc = state.documents.find(d => d.id === id);
  if (!doc) return;
  const ex = doc.extracted || {};
  const json = JSON.stringify(ex, null, 2);

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-doc-title">${escHtml(doc.name)}</div>
    <span class="modal-doc-type">${escHtml(ex.document_type || 'Unknown Document')}</span>
    ${ex.summary ? `<div class="summary-box">${escHtml(ex.summary)}</div>` : ''}
    <div class="field-grid">
      ${field('Holder Name', ex.holder_name)}
      ${field('Document No.', ex.document_number)}
      ${field('Issue Date', ex.issue_date)}
      ${field('Expiry Date', ex.expiry_date)}
      ${field('Issuing Authority', ex.issuing_authority)}
      ${field('AI Confidence', ex.confidence ? (ex.confidence * 100).toFixed(0) + '%' : '')}
    </div>
    <div class="json-block">${escHtml(json)}</div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function field(label, value) {
  if (!value) return '';
  return `<div class="field-item"><label>${label}</label><span>${escHtml(value)}</span></div>`;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── CHAT ──────────────────────────────────────────────────────
function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  appendMsg('user', text);

  // Build doc context
  const docContext = state.documents.map(d => {
    const ex = d.extracted || {};
    return `Document: ${d.name}\nExtracted: ${JSON.stringify(ex)}`;
  }).join('\n\n---\n\n');

  const systemNote = docContext
    ? `VAULT CONTENTS (use ONLY these for answers):\n\n${docContext}`
    : 'The vault is currently empty. Ask the user to upload documents.';

  // Build messages with images/PDFs
  const userContent = [];

  // Attach doc files
  state.documents.forEach(doc => {
    if (doc.mimeType.startsWith('image/')) {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: doc.mimeType, data: doc.base64 } });
    } else if (doc.mimeType === 'application/pdf') {
      userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.base64 } });
    }
  });

  userContent.push({ type: 'text', text });

  // Build message history (keep last 8 turns + new)
  const history = state.chatHistory.slice(-8);
  const messages = [...history, { role: 'user', content: userContent }];

  const typingId = appendTyping();
  document.getElementById('send-btn').disabled = true;

  try {
    const reply = await callApi(messages, systemNote);
    removeTyping(typingId);
    appendMsg('assistant', reply);
    state.chatHistory.push({ role: 'user', content: text });
    state.chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    removeTyping(typingId);
    appendMsg('assistant', `⚠️ Error: ${err.message}. Make sure the server is running.`);
  }

  document.getElementById('send-btn').disabled = false;
}

function appendMsg(role, text) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = `chat-message ${role}`;
  const avatar = role === 'assistant' ? 'V' : 'U';
  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">${formatMarkdown(text)}</div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'chat-message assistant';
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">V</div>
    <div class="msg-body"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ── GOV SERVICES ─────────────────────────────────────────────
const SERVICE_REQUIREMENTS = {
  passport: {
    name: 'Passport Application',
    required: ['Birth Certificate', 'Photo ID (Aadhaar/National ID)', 'Address Proof', 'Passport Photo'],
  },
  driving: {
    name: 'Driving Licence',
    required: ['Address Proof', 'Age Proof (Birth Cert / Class X)', 'Medical Certificate'],
  },
  bank: {
    name: 'Bank Account KYC',
    required: ['Photo ID (Aadhaar/PAN/Passport)', 'Address Proof', 'PAN Card / Tax Number'],
  },
  visa: {
    name: 'Visa Application',
    required: ['Valid Passport', 'Bank Statement', 'Employment / Income Proof', 'Travel Insurance'],
  },
};

async function checkService(serviceKey) {
  const svc = SERVICE_REQUIREMENTS[serviceKey];
  if (!svc) return;

  const resultDiv = document.getElementById('service-result');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `<h3>${svc.name}</h3><div class="spinner"></div> Checking your vault…`;

  const vaultSummary = state.documents.map(d => {
    const ex = d.extracted || {};
    return `File: ${d.name} | Type: ${ex.document_type || 'unknown'} | Holder: ${ex.holder_name || '-'} | Expiry: ${ex.expiry_date || '-'}`;
  }).join('\n');

  const prompt = `Government service: ${svc.name}
Required documents: ${svc.required.join(', ')}

Documents currently in the vault:
${vaultSummary || 'NONE'}

Check which required documents are satisfied by the vault contents and which are missing. Format your response as:
• Service: ${svc.name}
• Available documents: [list only vault docs that satisfy requirements]
• Missing documents: [list required docs not in vault]
• What the user should submit: [full list]
• Notes: [any caveats]`;

  try {
    const reply = await callApi([{ role: 'user', content: prompt }]);
    resultDiv.innerHTML = `<h3>${svc.name}</h3><div class="msg-body" style="background:none;border:none;padding:0;">${formatMarkdown(reply)}</div>`;
  } catch (err) {
    resultDiv.innerHTML = `<h3>${svc.name}</h3><p style="color:var(--danger)">Error: ${err.message}</p>`;
  }
}

// ── UTILS ─────────────────────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatMarkdown(text) {
  // Very light markdown: bold, code blocks, bullets, line breaks
  return escHtml(text)
    .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg-deep);padding:2px 5px;border-radius:3px;font-family:var(--font-mono);color:var(--teal)">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
}