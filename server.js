'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const DEFAULT_ROOT = __dirname;
const DEFAULT_PUBLIC_DIR = path.join(DEFAULT_ROOT, 'public');
const DEFAULT_DATA_DIR = path.join(DEFAULT_ROOT, 'data');
const DEFAULT_WORDS_FILE = path.join(DEFAULT_DATA_DIR, 'words.json');
const DEFAULT_ENGLISH_FILE = path.join(DEFAULT_DATA_DIR, 'english.json');
const DEFAULT_PORT = Number(process.env.PORT) || 3000;
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

function createServer(options) {
  const opts = options || {};
  const publicDir = opts.publicDir || DEFAULT_PUBLIC_DIR;
  const wordsFile = opts.wordsFile || DEFAULT_WORDS_FILE;
  const englishFile = opts.englishFile || DEFAULT_ENGLISH_FILE;
  const dataDir = opts.dataDir || DEFAULT_DATA_DIR;
  const scoresFile = path.join(dataDir, 'scores.json');
  const host = opts.host || '127.0.0.1';

  let wordsCache = null;
  let englishCache = null;
  let scoreWriteChain = Promise.resolve();

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
    const raw = await fsp.readFile(wordsFile, 'utf8');
    wordsCache = JSON.parse(raw);
    return wordsCache;
  }

  async function loadEnglish() {
    if (englishCache) return englishCache;
    const raw = await fsp.readFile(englishFile, 'utf8');
    englishCache = JSON.parse(raw);
    return englishCache;
  }

  async function loadScores() {
    try {
      const raw = await fsp.readFile(scoresFile, 'utf8');
      const data = JSON.parse(raw);
      return Array.isArray(data.scores) ? data.scores : [];
    } catch (err) {
      return [];
    }
  }

  function saveScores(scores) {
    const tmpFile = `${scoresFile}.tmp`;
    scoreWriteChain = scoreWriteChain
      .then(async () => {
        await fsp.writeFile(tmpFile, JSON.stringify({ scores }, null, 2), 'utf8');
        await fsp.rename(tmpFile, scoresFile);
      })
      .catch((err) => console.error('[scores] 保存失败:', err.message));
    return scoreWriteChain;
  }

  async function serveStatic(req, res, pathname) {
    let relPath = pathname;
    try {
      relPath = decodeURIComponent(pathname);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('400 Bad Request');
    }
    if (relPath === '/' || relPath === '') relPath = '/index.html';

    const filePath = path.normalize(path.join(publicDir, relPath));
    const safeRoot = publicDir.endsWith(path.sep) ? publicDir : publicDir + path.sep;
    if (!filePath.toLowerCase().startsWith(safeRoot.toLowerCase())) {
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
    } catch (err) {
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

      if (req.method === 'GET' && pathname === '/api/english') {
        try {
          return sendJson(res, 200, await loadEnglish());
        } catch (err) {
          console.error('[english] 读取失败:', err.message);
          return sendJson(res, 500, { error: '英语词库读取失败' });
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
        } catch (err) {
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

  async function start(port) {
    await fsp.mkdir(dataDir, { recursive: true });
    const listenPort = Number.isInteger(port) ? port : DEFAULT_PORT;
    return new Promise((resolve, reject) => {
      const onError = (err) => {
        server.removeListener('listening', onListening);
        reject(err);
      };
      const onListening = () => {
        server.removeListener('error', onError);
        resolve({ server, port: server.address().port });
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(listenPort, host);
    });
  }

  return { server, start };
}

if (require.main === module) {
  const app = createServer();
  app.start(DEFAULT_PORT)
    .then(({ port }) => {
      console.log('\n  🧟 植物大战僵尸 · 教学版 已启动');
      console.log(`  ➜  http://localhost:${port}\n`);
    })
    .catch((err) => {
      console.error('启动失败:', err.message);
      process.exit(1);
    });
}

module.exports = { createServer };
