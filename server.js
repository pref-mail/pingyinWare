'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY = 16 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

let wordsCache = null;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function loadWords() {
  if (wordsCache) return wordsCache;
  const raw = await fsp.readFile(WORDS_FILE, 'utf8');
  wordsCache = JSON.parse(raw);
  return wordsCache;
}

async function loadScores() {
  try {
    const raw = await fsp.readFile(SCORES_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.scores) ? data.scores : [];
  } catch {
    return [];
  }
}

let scoreWriteChain = Promise.resolve();
function saveScores(scores) {
  const tmpFile = `${SCORES_FILE}.tmp`;
  scoreWriteChain = scoreWriteChain
    .then(async () => {
      await fsp.writeFile(tmpFile, JSON.stringify({ scores }, null, 2), 'utf8');
      await fsp.rename(tmpFile, SCORES_FILE);
    })
    .catch((err) => console.error('[scores] 保存失败:', err.message));
  return scoreWriteChain;
}

async function serveStatic(req, res, pathname) {
  let relPath = pathname;
  try {
    relPath = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('400 Bad Request');
  }
  if (relPath === '/' || relPath === '') relPath = '/index.html';

  const filePath = path.normalize(path.join(PUBLIC_DIR, relPath));
  const safeRoot = PUBLIC_DIR.endsWith(path.sep) ? PUBLIC_DIR : PUBLIC_DIR + path.sep;
  const normalized = filePath.toLowerCase();
  if (!normalized.startsWith(safeRoot.toLowerCase())) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }

  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) throw new Error('not a file');
    const data = await fsp.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}

const server = http.createServer(async (req, res) => {
  let pathname = '/';
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, time: Date.now() });
    }

    if (req.method === 'GET' && pathname === '/api/words') {
      try {
        return sendJson(res, 200, await loadWords());
      } catch (err) {
        console.error('[words] 读取失败:', err.message);
        return sendJson(res, 500, { error: '词库读取失败' });
      }
    }

    if (req.method === 'GET' && pathname === '/api/scores') {
      const scores = (await loadScores()).sort((a, b) => b.score - a.score).slice(0, 10);
      return sendJson(res, 200, {
        best: scores[0] ? scores[0].score : 0,
        scores: scores.map(({ score, waves }) => ({ score, waves })),
      });
    }

    if (req.method === 'POST' && pathname === '/api/score') {
      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch {
        return sendJson(res, 400, { error: '请求格式错误' });
      }

      const score = Number(payload && payload.score);
      if (!Number.isFinite(score) || score < 0 || score > 1e7) {
        return sendJson(res, 400, { error: '分数无效' });
      }
      const waves = Math.max(0, Math.min(99, Math.floor(Number(payload.waves) || 0)));

      const scores = await loadScores();
      const entry = { score: Math.round(score), waves, date: new Date().toISOString() };
      scores.push(entry);
      scores.sort((a, b) => b.score - a.score);
      const trimmed = scores.slice(0, 20);
      await saveScores(trimmed);

      const rank = trimmed.indexOf(entry) + 1;
      return sendJson(res, 200, {
        ok: true,
        best: trimmed[0] ? trimmed[0].score : entry.score,
        rank: rank || null,
        scores: trimmed.slice(0, 10).map(({ score: s, waves: w }) => ({ score: s, waves: w })),
      });
    }

    if (req.method === 'GET') {
      return serveStatic(req, res, pathname);
    }

    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
  } catch (err) {
    console.error('[server]', err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: '服务器内部错误' });
    } else {
      res.end();
    }
  }
});

fsp.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

server.listen(PORT, () => {
  console.log('\n  🧟 植物大战僵尸 · 拼音版 已启动');
  console.log(`  ➜  http://localhost:${PORT}\n`);
});
