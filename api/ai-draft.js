/* QNA CHINESE · AI 批改草稿後端
   金鑰放在 Vercel 的環境變數 GEMINI_API_KEY，不會出現在網頁原始碼裡。
   這支只負責「產生草稿」，不會寫入任何資料，也不會送東西給學生。 */

const MODELS = (process.env.GEMINI_MODEL || 'gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash')
  .split(',').map(s => s.trim()).filter(Boolean);

const SYS = [
  '你是一位華語老師的「批改助理」。老師姓黃，教越南學生學繁體中文。',
  '你的工作是幫老師寫「修改建議的草稿」，老師會親自看過、修改後才送給學生。',
  '規則：',
  '1. 一律用繁體中文（臺灣用語）。',
  '2. 只根據老師提供的題目、參考答案、學生實際寫的內容來寫，絕對不要編造學生沒有寫的東西。',
  '3. 每一題的建議寫一到兩句：先說對或錯在哪，再說要怎麼改。答對的題目可以只寫簡短肯定，或留空字串。',
  '4. 語氣鼓勵但具體，避免空泛的「很好」。指出錯字、語法或詞語搭配的問題時，要把正確寫法寫出來。',
  '5. 越南學生常見的偏誤（聲調、量詞、「了」的位置、把字句、語序）如果出現，請點出來。',
  '6. 整體評語 3 到 5 句：先肯定做得好的地方，再指出最需要加強的一兩點，最後給一個具體的練習建議。',
  '7. 不要用 Markdown 符號、不要加標題，純文字即可。'
].join('\n');

const SCHEMA = {
  type: 'object',
  properties: {
    per: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, fb: { type: 'string' } },
        required: ['id', 'fb']
      }
    },
    overall: { type: 'string' }
  },
  required: ['per', 'overall']
};

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; if (d.length > 400000) { d = d.slice(0, 400000); } });
    req.on('end', () => resolve(d));
    req.on('error', () => resolve(''));
  });
}

function buildPrompt(b) {
  const lines = [];
  lines.push('學生：' + (b.student || '（未提供）'));
  lines.push('課次：' + (b.lesson || '（未提供）'));
  if (b.note) lines.push('老師補充：' + b.note);
  lines.push('');
  lines.push('以下是這位學生的作答，請針對每一題寫建議：');
  (b.items || []).slice(0, 40).forEach((it, i) => {
    lines.push('---');
    lines.push('題號 ' + (i + 1) + '（id=' + it.id + '，題型：' + (it.type || '') + '）');
    lines.push('題目：' + String(it.prompt || '').slice(0, 600));
    if (it.ref) lines.push('參考答案：' + String(it.ref).slice(0, 400));
    lines.push('學生寫的：' + (String(it.ans || '').slice(0, 800) || '（未作答）'));
    if (it.mark === true) lines.push('系統判定：正確');
    if (it.mark === false) lines.push('系統判定：錯誤');
  });
  lines.push('---');
  lines.push('請回傳 JSON：per 是每一題的 {id, fb}，id 必須與上面的 id 完全一致；overall 是整體評語。');
  return lines.join('\n');
}

/* 問 Google 現在這把金鑰可以用哪些模型，名稱改版也不怕 */
async function listModels(key) {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=' + encodeURIComponent(key));
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
  return ((j && j.models) || [])
    .filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0)
    .map(m => String(m.name || '').replace(/^models\//, ''));
}
function pickModel(names) {
  const bad = /embedding|aqa|vision|image|tts|audio|native-audio|live|thinking-exp/i;
  const ok = names.filter(n => !bad.test(n));
  const order = [/^gemini-flash-latest$/, /^gemini-2\.5-flash$/, /^gemini-2\.0-flash$/,
                 /^gemini-2\.5-flash-lite$/, /flash-latest/, /2\.5-flash/, /2\.0-flash/, /flash/, /gemini/];
  for (const re of order) { const hit = ok.find(n => re.test(n)); if (hit) return hit; }
  return ok[0] || '';
}

async function callGemini(model, key, prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYS }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA
      }
    })
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = (j && j.error && j.error.message) || ('HTTP ' + r.status);
    const e = new Error(msg); e.status = r.status; throw e;
  }
  const c = j && j.candidates && j.candidates[0];
  const txt = c && c.content && c.content.parts && c.content.parts.map(p => p.text || '').join('');
  if (!txt) throw new Error('AI 沒有回傳內容');
  return JSON.parse(txt);
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: '只接受 POST' })); }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(typeof body === 'string' && body ? body : (await readBody(req)) || '{}'); }
    catch (e) { body = {}; }
  }

  const key = process.env.GEMINI_API_KEY || '';
  res.setHeader('content-type', 'application/json; charset=utf-8');

  if (body && body.ping) {
    return res.end(JSON.stringify({ ok: !!key, models: MODELS }));
  }
  if (body && body.list) {
    if (!key) return res.end(JSON.stringify({ error: 'NO_KEY' }));
    try {
      const names = await listModels(key);
      return res.end(JSON.stringify({ ok: true, available: names }));
    } catch (e) { return res.end(JSON.stringify({ error: String((e && e.message) || e) })); }
  }
  if (!key) {
    return res.end(JSON.stringify({
      error: 'NO_KEY',
      hint: '還沒設定 AI 金鑰。到 Vercel → 專案 → Settings → Environment Variables 新增 GEMINI_API_KEY，存檔後重新部署一次就會生效。'
    }));
  }
  if (!body || !Array.isArray(body.items) || !body.items.length) {
    return res.end(JSON.stringify({ error: '沒有可以批改的題目' }));
  }

  const prompt = buildPrompt(body);
  let lastErr = null;
  for (const m of MODELS) {
    try {
      const out = await callGemini(m, key, prompt);
      return res.end(JSON.stringify({ ok: true, model: m, per: out.per || [], overall: out.overall || '' }));
    } catch (e) {
      lastErr = e;
      if (e.status && e.status !== 404 && e.status !== 400) break;
    }
  }
  /* 名單裡的都不能用（Google 常改名），就直接問它現在有哪些，挑一個 flash 再試一次 */
  try {
    const names = await listModels(key);
    const pick = pickModel(names);
    if (pick) {
      const out = await callGemini(pick, key, prompt);
      return res.end(JSON.stringify({ ok: true, model: pick, per: out.per || [], overall: out.overall || '' }));
    }
  } catch (e) { lastErr = e; }
  return res.end(JSON.stringify({ error: (lastErr && lastErr.message) || 'AI 服務沒有回應' }));
};
