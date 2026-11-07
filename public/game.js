/* 植物大战僵尸 · 教学版 —— 语文 / 数学 / 英语 三科塔防 */
(function () {
  'use strict';

  // ---------------- 常量 ----------------
  const W = 980;
  const H = 560;
  const HOUSE_W = 78;
  const GRID_X = HOUSE_W + 6;
  const GRID_TOP = 10;
  const COLS = 9;
  const ROWS = 5;
  const CELL_W = (W - GRID_X - 10) / COLS;
  const CELL_H = (H - GRID_TOP * 2) / ROWS;
  const HOUSE_LINE = GRID_X - 4;
  const TOTAL_WAVES = 5;
  const SUNFLOWER_INTERVAL = 7000;
  const PEASHOOTER_INTERVAL = 1500;

  const PLANT_TYPES = {
    sunflower: { name: '向日葵', emoji: '🌻', cost: 50 },
    peashooter: { name: '豌豆射手', emoji: '🌱', cost: 100 },
  };

  const WAVE_COUNTS = { 1: 4, 2: 6, 3: 7, 4: 8, 5: 10 };

  const SUBJECT_META = {
    chinese: {
      name: '语文',
      icon: '📖',
      desc: '拼音练习 · 90 个常用字',
      stages: ['单韵母基础字', '复韵母生活字', '整体认读挑战字'],
      winText: '拼音小达人！',
    },
    math: {
      name: '数学',
      icon: '🔢',
      desc: '常规练习 · 颠倒数练习',
      stages: ['1-9 分解', '10 以内加减', '20 以内加减', '颠倒和差'],
      winText: '口算小达人！',
    },
    english: {
      name: '英语',
      icon: '🔤',
      desc: '生活常用单词',
      stages: ['水果类单词', '动物类单词'],
      winText: '单词小达人！',
    },
  };

  const FALLBACK_WORDS = [
    { char: '爸', pinyin: 'bà' }, { char: '妈', pinyin: 'mā' },
    { char: '大', pinyin: 'dà' }, { char: '米', pinyin: 'mǐ' },
    { char: '土', pinyin: 'tǔ' }, { char: '女', pinyin: 'nǚ' },
    { char: '绿', pinyin: 'lǜ' }, { char: '哥', pinyin: 'gē' },
    { char: '可', pinyin: 'kě' }, { char: '河', pinyin: 'hé' },
    { char: '鸡', pinyin: 'jī' }, { char: '西', pinyin: 'xī' },
    { char: '猪', pinyin: 'zhū' }, { char: '吃', pinyin: 'chī' },
    { char: '书', pinyin: 'shū' }, { char: '日', pinyin: 'rì' },
    { char: '字', pinyin: 'zì' }, { char: '四', pinyin: 'sì' },
    { char: '花', pinyin: 'huā' }, { char: '水', pinyin: 'shuǐ' },
    { char: '山', pinyin: 'shān' }, { char: '人', pinyin: 'rén' },
    { char: '白', pinyin: 'bái' }, { char: '黑', pinyin: 'hēi' },
    { char: '飞', pinyin: 'fēi' }, { char: '手', pinyin: 'shǒu' },
    { char: '走', pinyin: 'zǒu' }, { char: '牛', pinyin: 'niú' },
    { char: '狗', pinyin: 'gǒu' }, { char: '猫', pinyin: 'māo' },
    { char: '鸟', pinyin: 'niǎo' }, { char: '草', pinyin: 'cǎo' },
    { char: '星', pinyin: 'xīng' }, { char: '龙', pinyin: 'lóng' },
    { char: '红', pinyin: 'hóng' }, { char: '中', pinyin: 'zhōng' },
  ];

  const MATH_MODES = {
    normal: {
      name: '常规练习',
      stages: ['1-9 的分解', '10 以内加减法', '20 以内加减法'],
    },
    inverse: {
      name: '颠倒数练习',
      stages: ['两位数颠倒和与差', '三位数颠倒和与差', '两三位数综合挑战'],
    },
  };

  const FALLBACK_ENGLISH = [
    {
      id: 'fruit',
      name: '水果类',
      words: [
        { emoji: '🍎', zh: '苹果', word: 'apple' },
        { emoji: '🍌', zh: '香蕉', word: 'banana' },
        { emoji: '🍊', zh: '橙子', word: 'orange' },
        { emoji: '🍇', zh: '葡萄', word: 'grape' },
        { emoji: '🍉', zh: '西瓜', word: 'watermelon' },
        { emoji: '🍓', zh: '草莓', word: 'strawberry' },
        { emoji: '🍐', zh: '梨', word: 'pear' },
        { emoji: '🍑', zh: '桃子', word: 'peach' },
      ],
    },
    {
      id: 'animal',
      name: '动物类',
      words: [
        { emoji: '🐶', zh: '狗', word: 'dog' },
        { emoji: '🐱', zh: '猫', word: 'cat' },
        { emoji: '🐰', zh: '兔子', word: 'rabbit' },
        { emoji: '🐼', zh: '熊猫', word: 'panda' },
        { emoji: '🐯', zh: '老虎', word: 'tiger' },
        { emoji: '🦁', zh: '狮子', word: 'lion' },
        { emoji: '🐘', zh: '大象', word: 'elephant' },
        { emoji: '🐒', zh: '猴子', word: 'monkey' },
      ],
    },
  ];

  // ---------------- DOM ----------------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hudSun = document.getElementById('hud-sun');
  const hudLives = document.getElementById('hud-lives');
  const hudWave = document.getElementById('hud-wave');
  const hudScore = document.getElementById('hud-score');
  const hudCombo = document.getElementById('hud-combo');
  const hudSubject = document.getElementById('hud-subject');
  const menuBgm = document.getElementById('menu-bgm');
  const battleBgm = document.getElementById('battle-bgm');
  const btnMute = document.getElementById('btn-mute');
  const btnPause = document.getElementById('btn-pause');
  const bannerEl = document.getElementById('banner');
  const toastEl = document.getElementById('toast');
  const overlay = document.getElementById('overlay');
  const overlayCard = document.getElementById('overlay-card');
  const pauseVeil = document.getElementById('pause-veil');
  const quizPanel = document.getElementById('quiz');
  const quizChar = document.getElementById('quiz-char');
  const quizHint = document.getElementById('quiz-hint');
  const quizOptions = document.getElementById('quiz-options');

  canvas.width = W;
  canvas.height = H;

  menuBgm.volume = 0.35;
  battleBgm.volume = 0.3;

  function playMenuMusic() {
    if (!menuBgm || state.muted || state.phase !== 'menu') return;
    const played = menuBgm.play();
    if (played && typeof played.catch === 'function') {
      played.catch(() => { /* 浏览器自动播放受限时等首次交互 */ });
    }
  }

  function stopMenuMusic() {
    if (!menuBgm) return;
    menuBgm.pause();
    menuBgm.currentTime = 0;
  }

  function playBattleMusic() {
    if (!battleBgm) return;
    if (state.muted || state.paused) return;
    if (state.phase !== 'playing' && state.phase !== 'break') return;
    const played = battleBgm.play();
    if (played && typeof played.catch === 'function') {
      played.catch(() => { /* 等用户交互后重试 */ });
    }
  }

  function stopBattleMusic() {
    if (!battleBgm) return;
    battleBgm.pause();
    battleBgm.currentTime = 0;
  }

  function pauseBattleMusic() {
    if (!battleBgm) return;
    battleBgm.pause();
  }

  const plantImages = { peashooter: null };
  (function preloadPlantImages() {
    const img = new Image();
    img.onload = () => { plantImages.peashooter = img; };
    img.src = '/plants/peashooter.svg';
  })();

  // ---------------- 状态 ----------------
  let words = [];
  let wordsByLevel = { 1: [], 2: [], 3: [] };
  let englishCategories = [];
  let bestScore = 0;

  const state = {
    phase: 'menu',
    subject: 'chinese',
    mathMode: 'normal',
    paused: false,
    time: 0,
    sun: 75,
    lives: 3,
    score: 0,
    combo: 0,
    maxCombo: 0,
    wave: 0,
    zombies: [],
    plants: [],
    peas: [],
    floaters: [],
    particles: [],
    beams: [],
    nextZombieId: 1,
    nextPlantId: 1,
    spawnQueue: [],
    spawnTimer: 0,
    breakTimer: 0,
    activeId: null,
    question: null,
    questionLocked: false,
    resolveTimer: 0,
    selectedSeed: null,
    hoverCell: null,
    shake: 0,
    hudTimer: 0,
    muted: false,
  };

  // ---------------- 工具函数 ----------------
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function randInt(a, b) {
    return Math.floor(rand(a, b + 1));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function cellCenter(row, col) {
    return {
      x: GRID_X + (col + 0.5) * CELL_W,
      y: GRID_TOP + (row + 0.5) * CELL_H,
    };
  }

  function pointToCell(x, y) {
    if (x < GRID_X || y < GRID_TOP) return null;
    const col = Math.floor((x - GRID_X) / CELL_W);
    const row = Math.floor((y - GRID_TOP) / CELL_H);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return { row, col };
  }

  function roundRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawEmoji(text, x, y, size) {
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // ---------------- 音效 ----------------
  const AudioFX = {
    ac: null,
    init() {
      if (this.ac) {
        if (this.ac.state === 'suspended') this.ac.resume().catch(() => {});
        return;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ac = new AC();
      } catch (err) {
        this.ac = null;
      }
    },
    tone(freq, delay, dur, type, vol) {
      if (!this.ac || state.muted) return;
      try {
        const t0 = this.ac.currentTime + delay;
        const osc = this.ac.createOscillator();
        const gain = this.ac.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol || 0.07, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain).connect(this.ac.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
      } catch (err) {
        /* 忽略音频异常 */
      }
    },
    correct() {
      this.tone(660, 0, 0.12, 'triangle', 0.09);
      this.tone(990, 0.09, 0.18, 'triangle', 0.08);
    },
    wrong() {
      this.tone(180, 0, 0.2, 'sawtooth', 0.06);
      this.tone(130, 0.1, 0.25, 'sawtooth', 0.05);
    },
    shoot() {
      this.tone(520, 0, 0.06, 'square', 0.025);
    },
    plant() {
      this.tone(330, 0, 0.08, 'sine', 0.07);
      this.tone(440, 0.06, 0.1, 'sine', 0.06);
    },
    sun() {
      this.tone(880, 0, 0.08, 'sine', 0.05);
      this.tone(1180, 0.06, 0.1, 'sine', 0.04);
    },
    hurt() {
      this.tone(120, 0, 0.3, 'square', 0.08);
    },
    explode() {
      this.tone(90, 0, 0.28, 'sawtooth', 0.09);
      this.tone(55, 0.03, 0.32, 'square', 0.07);
      this.tone(200, 0, 0.1, 'triangle', 0.05);
    },
    wave() {
      this.tone(392, 0, 0.12, 'triangle', 0.07);
      this.tone(523, 0.12, 0.18, 'triangle', 0.07);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.12, 0.25, 'triangle', 0.07));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => this.tone(f, i * 0.16, 0.35, 'sawtooth', 0.06));
    },
  };

  // ---------------- 题库加载 ----------------
  async function fetchJson(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (err) {
      /* 网络异常时使用内置题库兜底 */
    }
    return null;
  }

  async function loadContent() {
    const [cnData, enData] = await Promise.all([
      fetchJson('/api/words'),
      fetchJson('/api/english'),
    ]);

    words = [];
    wordsByLevel = { 1: [], 2: [], 3: [] };

    const levels = cnData && Array.isArray(cnData.levels) && cnData.levels.length
      ? cnData.levels
      : [{ id: 1, name: '基础', words: FALLBACK_WORDS }];

    levels.forEach((lv, idx) => {
      const id = Number(lv.id) || idx + 1;
      const list = (Array.isArray(lv.words) ? lv.words : [])
        .filter((w) => w && typeof w.char === 'string' && typeof w.pinyin === 'string')
        .map((w) => ({ char: w.char, pinyin: w.pinyin, level: id }));
      if (!wordsByLevel[id]) wordsByLevel[id] = [];
      wordsByLevel[id] = wordsByLevel[id].concat(list);
      words = words.concat(list);
    });

    if (!words.length) {
      words = FALLBACK_WORDS.map((w) => ({ char: w.char, pinyin: w.pinyin, level: 1 }));
      wordsByLevel[1] = words;
    }

    const cats = enData && Array.isArray(enData.categories) ? enData.categories : [];
    englishCategories = cats
      .map((cat, idx) => ({
        id: String(cat.id || idx),
        name: String(cat.name || '单词'),
        words: (Array.isArray(cat.words) ? cat.words : [])
          .filter((w) => w && typeof w.emoji === 'string' && typeof w.zh === 'string' && typeof w.word === 'string')
          .map((w) => ({ emoji: w.emoji, zh: w.zh, word: w.word })),
      }))
      .filter((cat) => cat.words.length >= 4);

    if (!englishCategories.length) englishCategories = FALLBACK_ENGLISH;
  }

  async function loadBest() {
    try {
      const res = await fetch('/api/scores', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.best === 'number') bestScore = data.best;
      }
    } catch (err) {
      /* 本地单机也能玩，忽略 */
    }
  }

  async function submitScore() {
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: state.score, waves: state.wave }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.best === 'number') bestScore = Math.max(bestScore, data.best);
        else bestScore = Math.max(bestScore, state.score);
      }
    } catch (err) {
      bestScore = Math.max(bestScore, state.score);
    }
  }

  function stageIndexForWave(wave) {
    if (state.subject === 'english') return wave <= 3 ? 0 : 1;
    return wave <= 2 ? 0 : wave <= 4 ? 1 : 2;
  }

  function stageNameForWave(wave) {
    const stages = state.subject === 'math'
      ? (MATH_MODES[state.mathMode] || MATH_MODES.normal).stages
      : SUBJECT_META[state.subject].stages;
    return stages[stageIndexForWave(wave)] || '';
  }

  function poolForWave(wave) {
    const level = stageIndexForWave(wave) + 1;
    const pool = wordsByLevel[level];
    return pool && pool.length ? pool : words;
  }

  // ---------------- 题目 ----------------
  function numericOptions(answer, min, max) {
    const ans = Number(answer);
    const lo = Number.isFinite(min) ? min : 0;
    const hi = Number.isFinite(max) ? Math.max(max, ans) : ans + 5;
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < 4 && guard < 80) {
      guard += 1;
      const cand = ans + randInt(-3, 3);
      if (cand < lo || cand > hi || cand === ans) continue;
      set.add(cand);
    }
    let extra = lo;
    while (set.size < 4 && extra <= hi) {
      if (extra !== ans) set.add(extra);
      extra += 1;
    }
    return shuffle([...set]).map(String);
  }

  function makeMathItem(stage) {
    if (stage === 0) {
      const n = randInt(2, 9);
      const a = randInt(1, n - 1);
      return {
        sign: String(n),
        prompt: `${n} = ${a} + ?`,
        answer: String(n - a),
        hint: `${n} 可以分成 ${a} 和几？`,
        optionsMin: 1,
        optionsMax: 9,
      };
    }

    const max = stage === 1 ? 10 : 20;
    if (Math.random() < 0.5) {
      const a = randInt(1, max - 3);
      const b = randInt(1, max - a);
      return {
        sign: `${a}+${b}`,
        prompt: `${a} + ${b} = ?`,
        answer: String(a + b),
        hint: '算一算，答案是多少？',
        optionsMin: 0,
        optionsMax: max,
      };
    }
    const a = randInt(2, max);
    const b = randInt(1, a - 1);
    return {
      sign: `${a}−${b}`,
      prompt: `${a} − ${b} = ?`,
      answer: String(a - b),
      hint: '算一算，答案是多少？',
      optionsMin: 0,
      optionsMax: max,
    };
  }

  function makeReversalMathItem(stage) {
    const threeDigits = stage === 1 || (stage === 2 && Math.random() < 0.5);

    if (!threeDigits) {
      const a = randInt(1, 9);
      let b = randInt(1, 9);
      while (b === a) b = randInt(1, 9);
      const n = a * 10 + b;
      const r = b * 10 + a;
      const isSum = Math.random() < 0.5;
      const hi = Math.max(n, r);
      const lo = Math.min(n, r);
      const answer = isSum ? n + r : hi - lo;
      return {
        sign: String(n),
        prompt: isSum ? `${n} + ${r} = ?` : `${hi} − ${lo} = ?`,
        answer: String(answer),
        hint: isSum ? '规律：和 = 11 ×（十位 + 个位）' : '规律：差 = 9 ×（十位 − 个位）',
        optionsMin: 0,
        optionsMax: Math.max(100, answer + 20),
      };
    }

    const a = randInt(1, 9);
    let c = randInt(1, 9);
    while (c === a) c = randInt(1, 9);
    const b = randInt(0, 9);
    const n = a * 100 + b * 10 + c;
    const r = c * 100 + b * 10 + a;
    const isSum = Math.random() < 0.5;
    const hi = Math.max(n, r);
    const lo = Math.min(n, r);
    const answer = isSum ? n + r : hi - lo;
    return {
      sign: String(n),
      prompt: isSum ? `${n} + ${r} = ?` : `${hi} − ${lo} = ?`,
      answer: String(answer),
      hint: isSum
        ? '规律：和 = 101 ×（百位 + 个位）+ 20 × 十位'
        : '规律：差 = 99 ×（百位 − 个位）',
      optionsMin: 0,
      optionsMax: Math.max(1000, answer + 50),
    };
  }

  function makeEnglishItem(stage) {
    const cat = englishCategories[Math.min(stage, englishCategories.length - 1)] || englishCategories[0];
    const item = pick(cat.words);
    return { emoji: item.emoji, zh: item.zh, word: item.word, category: cat.id };
  }

  function makeItemForStage(stage) {
    if (state.subject === 'math') {
      return state.mathMode === 'inverse' ? makeReversalMathItem(stage) : makeMathItem(stage);
    }
    if (state.subject === 'english') return makeEnglishItem(stage);
    const pool = wordsByLevel[stage + 1];
    return { ...pick(pool && pool.length ? pool : words), stage };
  }

  function makeChineseQuestion(zombie) {
    const pool = poolForWave(state.wave);
    const correct = zombie.item.pinyin;
    const seen = new Set([correct]);
    const options = [correct];

    const candidates = shuffle(pool.map((w) => w.pinyin).filter((p) => p && !seen.has(p)));
    for (let i = 0; i < candidates.length && options.length < 4; i += 1) {
      const p = candidates[i];
      if (seen.has(p)) continue;
      seen.add(p);
      options.push(p);
    }

    if (options.length < 4) {
      const all = shuffle(words.map((w) => w.pinyin));
      for (let i = 0; i < all.length && options.length < 4; i += 1) {
        const p = all[i];
        if (seen.has(p)) continue;
        seen.add(p);
        options.push(p);
      }
    }

    return {
      prompt: zombie.item.char,
      answer: correct,
      hint: `「${zombie.item.char}」的拼音是？点选项发射豌豆`,
      options: shuffle(options),
      targetId: zombie.id,
    };
  }

  function makeEnglishQuestion(zombie) {
    const item = zombie.item;
    const cat = englishCategories.find((c) => c.id === item.category) || englishCategories[0];
    const correct = item.word;
    const seen = new Set([correct]);
    const options = [correct];

    const candidates = shuffle(cat.words.map((w) => w.word).filter((w) => !seen.has(w)));
    for (let i = 0; i < candidates.length && options.length < 4; i += 1) {
      if (seen.has(candidates[i])) continue;
      seen.add(candidates[i]);
      options.push(candidates[i]);
    }

    if (options.length < 4) {
      const all = shuffle(englishCategories.flatMap((c) => c.words.map((w) => w.word)));
      for (let i = 0; i < all.length && options.length < 4; i += 1) {
        if (seen.has(all[i])) continue;
        seen.add(all[i]);
        options.push(all[i]);
      }
    }

    return {
      prompt: item.emoji,
      answer: correct,
      hint: `「${item.zh}」的英文单词是？`,
      options: shuffle(options),
      targetId: zombie.id,
    };
  }

  function makeQuestion(zombie) {
    const item = zombie.item;
    if (state.subject === 'math') {
      return {
        prompt: item.prompt,
        answer: item.answer,
        hint: item.hint,
        options: numericOptions(Number(item.answer), item.optionsMin, item.optionsMax),
        targetId: zombie.id,
      };
    }
    if (state.subject === 'english') return makeEnglishQuestion(zombie);
    return makeChineseQuestion(zombie);
  }

  function renderQuiz() {
    const q = state.question;
    if (!q) {
      quizChar.textContent = '？';
      quizHint.textContent = '草坪暂时安全，专心种植物吧';
      quizOptions.innerHTML = '';
      quizPanel.classList.add('idle');
      return;
    }
    quizPanel.classList.remove('idle');
    quizChar.textContent = q.prompt;
    const len = [...q.prompt].length;
    quizChar.style.fontSize = len > 12 ? '20px' : len > 9 ? '22px' : len > 7 ? '24px' : len > 5 ? '28px' : len > 3 ? '36px' : '';
    quizHint.textContent = q.hint;
    quizOptions.innerHTML = '';
    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.textContent = opt;
      btn.addEventListener('click', () => answer(opt, btn));
      quizOptions.appendChild(btn);
    });
  }

  function refreshActive() {
    if (state.phase !== 'playing') return;

    const alive = state.zombies.filter((z) => !z.dead);
    if (!alive.length) {
      if (state.question) {
        state.question = null;
        state.activeId = null;
        renderQuiz();
      }
      return;
    }

    let target = alive[0];
    for (let i = 1; i < alive.length; i += 1) {
      if (alive[i].x < target.x) target = alive[i];
    }
    state.activeId = target.id;
    state.question = makeQuestion(target);
    renderQuiz();
  }

  function selectZombie(zombie) {
    if (state.phase !== 'playing' || state.paused || state.questionLocked) return;
    if (state.activeId === zombie.id && state.question) return;
    state.selectedSeed = null;
    state.activeId = zombie.id;
    state.question = makeQuestion(zombie);
    renderQuiz();
    updateHUD();
  }

  function answer(optionText, btn) {
    const q = state.question;
    if (!q || state.phase !== 'playing' || state.paused || state.questionLocked) return;
    AudioFX.init();

    if (optionText === q.answer) {
      state.questionLocked = true;
      state.resolveTimer = 0.34;
      btn.classList.add('correct');
      Array.from(quizOptions.children).forEach((b) => { b.disabled = true; });

      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      const gain = 100 + (state.combo - 1) * 25;
      state.score += gain;
      state.sun += 25;

      const z = state.zombies.find((item) => item.id === q.targetId);
      const fx = z ? { x: z.x, y: z.y } : { x: W / 2, y: H / 2 };
      floater(fx.x, fx.y - 78, `+${gain}`, '#ffe066', 1.1);
      floater(fx.x + 44, fx.y - 106, '+25 ☀️', '#ffe066', 1.0);
      AudioFX.correct();
      state.shake = Math.max(state.shake, 5);

      if (z && !z.dead) {
        z.dead = true;
        state.beams.push({
          x1: GRID_X - 6, y1: z.y - 10, x2: z.x, y2: z.y - 10,
          life: 0.3, max: 0.3, color: '#ffe066',
        });
        addParticles(z.x, z.y - 10, '#ffe066', 20);
        setTimeout(() => {
          if (state.zombies.includes(z)) removeZombie(z);
        }, 240);
      }
      updateHUD();
    } else {
      state.questionLocked = true;
      state.resolveTimer = 0.65;
      btn.classList.add('wrong');
      btn.disabled = true;
      Array.from(quizOptions.children).forEach((b) => {
        if (b.textContent === q.answer) b.classList.add('reveal');
      });

      state.combo = 0;
      state.sun = Math.max(0, state.sun - 10);
      const z = state.zombies.find((item) => item.id === q.targetId);
      if (z) z.speedBoost = Math.min(1.7, z.speedBoost * 1.12);
      AudioFX.wrong();
      floater(W * 0.5, 96, '答错啦 -10 ☀️', '#ff8b83', 1.2, true);
      updateHUD();

      setTimeout(() => {
        Array.from(quizOptions.children).forEach((b) => b.classList.remove('reveal'));
      }, 700);
    }
  }

  // ---------------- 特效 ----------------
  function floater(x, y, text, color, life, centered) {
    state.floaters.push({
      x, y, text, color: color || '#fff',
      life: life || 1, max: life || 1, centered: !!centered,
    });
  }

  function addParticles(x, y, color, count) {
    const n = count || 10;
    for (let i = 0; i < n; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 220);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: rand(0.35, 0.8),
        max: 0.8,
        color,
        size: rand(2, 5),
      });
    }
  }

  function updateEffects(dt) {
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.life -= dt;
      f.y -= dt * 38;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.vy += 420 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.beams.length - 1; i >= 0; i -= 1) {
      state.beams[i].life -= dt;
      if (state.beams[i].life <= 0) state.beams.splice(i, 1);
    }
  }

  // ---------------- 波次 / 僵尸 ----------------
  function startWave(n) {
    state.phase = 'playing';
    state.wave = n;
    const count = WAVE_COUNTS[n] || 10;
    const stage = stageIndexForWave(n);

    state.spawnQueue = [];
    for (let i = 0; i < count; i += 1) {
      state.spawnQueue.push({
        type: rollZombieType(n),
        lane: randInt(0, ROWS - 1),
        item: makeItemForStage(stage),
      });
    }
    state.spawnTimer = 1.1;

    showBanner(`第 ${n} 波来袭！· ${stageNameForWave(n)}`, 1800);
    AudioFX.wave();
    updateHUD();
  }

  function rollZombieType(wave) {
    if (wave <= 1) return 'normal';
    const r = Math.random();
    if (wave >= 4) {
      if (r < 0.3) return 'armor';
      if (r < 0.7) return 'fast';
      return 'normal';
    }
    if (wave === 3) {
      if (r < 0.2) return 'armor';
      if (r < 0.5) return 'fast';
      return 'normal';
    }
    return r < 0.3 ? 'fast' : 'normal';
  }

  function spawnZombie(spec) {
    const center = cellCenter(spec.lane, 0);
    const base = 24 + state.wave * 3.5;
    let speed = base;
    let hp = 2;
    let scale = 1;

    if (spec.type === 'fast') {
      speed = base * 1.55;
    } else if (spec.type === 'armor') {
      speed = base * 0.82;
      hp = 4;
      scale = 1.08;
    }

    state.zombies.push({
      id: state.nextZombieId++,
      row: spec.lane,
      x: W + 40,
      y: center.y,
      item: spec.item,
      hp,
      maxHp: hp,
      speed,
      speedBoost: 1,
      type: spec.type,
      wobble: rand(0, Math.PI * 2),
      hitFlash: 0,
      scale,
      dead: false,
    });
  }

  function removeZombie(zombie) {
    const idx = state.zombies.indexOf(zombie);
    if (idx === -1) return;
    state.zombies.splice(idx, 1);
    if (state.activeId === zombie.id) {
      state.activeId = null;
      state.question = null;
      renderQuiz();
    }
  }

  function killZombieByPea(zombie) {
    if (!state.zombies.includes(zombie)) return;
    state.score += 40;
    addParticles(zombie.x, zombie.y - 10, '#b8f37a', 10);
    floater(zombie.x, zombie.y - 70, '+40', '#b8f37a', 0.9);
    removeZombie(zombie);
    updateHUD();
  }

  function nearestZombieInRow(row, fromX) {
    let best = null;
    for (let i = 0; i < state.zombies.length; i += 1) {
      const z = state.zombies[i];
      if (z.dead || z.row !== row || z.x < fromX) continue;
      if (!best || z.x < best.x) best = z;
    }
    return best;
  }

  // ---------------- 更新 ----------------
  function update(dt) {
    state.time += dt;
    updateEffects(dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);

    if (state.phase === 'playing') {
      updateSpawning(dt);
      updateZombies(dt);
      updatePlantCollisions();
      updatePlants(dt);
      updatePeas(dt);

      if (state.resolveTimer > 0) {
        state.resolveTimer -= dt;
        if (state.resolveTimer <= 0) {
          state.resolveTimer = 0;
          state.questionLocked = false;
        }
      }
      if (!state.questionLocked && !state.question) refreshActive();

      if (!state.spawnQueue.length && !state.zombies.length) beginBreak();
    } else if (state.phase === 'break') {
      state.breakTimer -= dt;
      if (state.breakTimer <= 0) {
        if (state.wave >= TOTAL_WAVES) winGame();
        else startWave(state.wave + 1);
      }
    }

    state.hudTimer += dt;
    if (state.hudTimer >= 0.12) {
      state.hudTimer = 0;
      updateHUD();
    }
  }

  function updateSpawning(dt) {
    if (!state.spawnQueue.length) return;
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const spec = state.spawnQueue.shift();
      spawnZombie(spec);
      state.spawnTimer = Math.max(1.5, 4.4 - state.wave * 0.55);
    }
  }

  function updateZombies(dt) {
    for (let i = state.zombies.length - 1; i >= 0; i -= 1) {
      const z = state.zombies[i];
      if (z.dead) continue;
      z.x -= z.speed * z.speedBoost * dt;
      if (z.hitFlash > 0) z.hitFlash -= dt;
      if (z.x < HOUSE_LINE) {
        state.zombies.splice(i, 1);
        onZombieBreach(z);
      }
    }
  }

  function updatePlantCollisions() {
    for (let i = state.zombies.length - 1; i >= 0; i -= 1) {
      const z = state.zombies[i];
      if (z.dead) continue;

      let plantIndex = -1;
      let bestDist = Infinity;
      for (let j = 0; j < state.plants.length; j += 1) {
        const p = state.plants[j];
        if (p.row !== z.row) continue;
        const dist = Math.abs(p.x - z.x);
        if (dist <= 30 && dist < bestDist) {
          bestDist = dist;
          plantIndex = j;
        }
      }
      if (plantIndex === -1) continue;

      const plant = state.plants[plantIndex];
      state.plants.splice(plantIndex, 1);
      state.zombies.splice(i, 1);

      AudioFX.explode();
      addParticles(plant.x, plant.y - 6, '#ffd23f', 16);
      addParticles(z.x, z.y - 10, '#8ee04a', 12);
      floater((plant.x + z.x) / 2, plant.y - 46, '💥 爆炸', '#ffd23f', 1.2, true);
      state.shake = Math.max(state.shake, 6);

      if (state.activeId === z.id) {
        state.activeId = null;
        state.question = null;
        state.questionLocked = false;
        renderQuiz();
      }
      updateHUD();
    }
  }

  function onZombieBreach(zombie) {
    state.lives -= 1;
    state.combo = 0;
    state.shake = 10;
    AudioFX.hurt();
    addParticles(zombie.x, zombie.y, '#ff6b6b', 16);
    floater(zombie.x + 30, zombie.y - 40, '脑子被吃掉了！', '#ff8b83', 1.6);
    if (state.activeId === zombie.id) {
      state.activeId = null;
      state.question = null;
      state.questionLocked = false;
      renderQuiz();
    }
    updateHUD();
    if (state.lives <= 0) gameOver();
  }

  function updatePlants(dt) {
    for (let i = 0; i < state.plants.length; i += 1) {
      const p = state.plants[i];
      if (p.type === 'sunflower') {
        p.timer += dt * 1000;
        if (p.timer >= SUNFLOWER_INTERVAL) {
          p.timer = 0;
          state.sun += 25;
          floater(p.x + rand(-8, 8), p.y - 34, '+25 ☀️', '#ffe066', 1.1);
          addParticles(p.x, p.y - 10, '#ffd23f', 6);
          AudioFX.sun();
          updateHUD();
        }
      } else if (p.type === 'peashooter') {
        p.shootTimer += dt * 1000;
        if (p.shootTimer >= PEASHOOTER_INTERVAL) {
          p.shootTimer = 0;
          const target = nearestZombieInRow(p.row, p.x);
          if (target) {
            state.peas.push({ x: p.x + 24, y: p.y, vx: 420, damage: 1, row: p.row });
            AudioFX.shoot();
          }
        }
      }
    }
  }

  function updatePeas(dt) {
    for (let i = state.peas.length - 1; i >= 0; i -= 1) {
      const pea = state.peas[i];
      pea.x += pea.vx * dt;
      if (pea.x > W + 30) {
        state.peas.splice(i, 1);
        continue;
      }
      let hit = null;
      for (let j = 0; j < state.zombies.length; j += 1) {
        const z = state.zombies[j];
        if (z.dead || z.row !== pea.row) continue;
        if (Math.abs(z.x - pea.x) < 28) {
          hit = z;
          break;
        }
      }
      if (hit) {
        state.peas.splice(i, 1);
        addParticles(pea.x, pea.y, '#9be15d', 6);
        hit.hp -= pea.damage;
        hit.hitFlash = 0.15;
        if (hit.hp <= 0) killZombieByPea(hit);
      }
    }
  }

  function beginBreak() {
    state.phase = 'break';
    state.breakTimer = 3.5;
    state.activeId = null;
    state.question = null;
    state.questionLocked = false;
    renderQuiz();
    const isLast = state.wave >= TOTAL_WAVES;
    showBanner(isLast ? '最后一波已清除！' : `第 ${state.wave} 波清除！准备迎接下一波…`, 2600);
    updateHUD();
  }

  // ---------------- 种植 ----------------
  function plantAt(cell) {
    const type = state.selectedSeed;
    if (!type || type === 'shovel') return;
    const cost = PLANT_TYPES[type].cost;

    if (state.plants.some((p) => p.row === cell.row && p.col === cell.col)) {
      toast('这个格子已经有植物啦');
      return;
    }
    if (state.sun < cost) {
      toast(`阳光不够，需要 ${cost} 阳光`);
      return;
    }

    state.sun -= cost;
    const center = cellCenter(cell.row, cell.col);
    state.plants.push({
      id: state.nextPlantId++,
      type,
      row: cell.row,
      col: cell.col,
      x: center.x,
      y: center.y,
      timer: 0,
      shootTimer: 0,
      sway: rand(0, Math.PI * 2),
    });
    AudioFX.plant();
    addParticles(center.x, center.y + 14, '#8ee04a', 8);
    state.selectedSeed = null;
    updateHUD();
  }

  function shovelAt(cell) {
    const idx = state.plants.findIndex((p) => p.row === cell.row && p.col === cell.col);
    if (idx === -1) {
      toast('这里没有植物');
      return;
    }
    const plant = state.plants[idx];
    state.plants.splice(idx, 1);
    addParticles(plant.x, plant.y, '#b98a56', 8);
    AudioFX.plant();
    state.selectedSeed = null;
    updateHUD();
  }

  function hitZombie(x, y) {
    for (let i = state.zombies.length - 1; i >= 0; i -= 1) {
      const z = state.zombies[i];
      if (z.dead) continue;
      if (Math.abs(x - z.x) < 34 && y > z.y - 78 && y < z.y + 42) return z;
    }
    return null;
  }

  // ---------------- 渲染 ----------------
  function drawLawn() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#7fbf4a');
    g.addColorStop(1, '#5c9a33');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const x = GRID_X + c * CELL_W;
        const y = GRID_TOP + r * CELL_H;
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
        ctx.fillRect(x, y, CELL_W, CELL_H);
      }
    }

    ctx.strokeStyle = 'rgba(20,50,10,.18)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c += 1) {
      const x = GRID_X + c * CELL_W;
      ctx.beginPath();
      ctx.moveTo(x, GRID_TOP);
      ctx.lineTo(x, GRID_TOP + ROWS * CELL_H);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r += 1) {
      const y = GRID_TOP + r * CELL_H;
      ctx.beginPath();
      ctx.moveTo(GRID_X, y);
      ctx.lineTo(GRID_X + COLS * CELL_W, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(GRID_X, GRID_TOP, COLS * CELL_W, ROWS * CELL_H);
  }

  function drawHouse() {
    const g = ctx.createLinearGradient(0, 0, HOUSE_W, 0);
    g.addColorStop(0, '#8a5a34');
    g.addColorStop(1, '#b98256');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, HOUSE_W, H);

    ctx.strokeStyle = 'rgba(60,30,10,.35)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < H; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(HOUSE_W, y);
      ctx.stroke();
      const offset = Math.floor(y / 26) % 2 === 0 ? 0 : 22;
      for (let x = offset; x < HOUSE_W; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 26);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#4a2f1b';
    roundRectPath(ctx, 14, H - 150, HOUSE_W - 28, 110, 10);
    ctx.fill();
    ctx.fillStyle = '#e0b070';
    ctx.beginPath();
    ctx.arc(HOUSE_W - 24, H - 95, 3.5, 0, Math.PI * 2);
    ctx.fill();

    drawEmoji('🏠', HOUSE_W / 2, 32, 30);

    const shadow = ctx.createLinearGradient(HOUSE_W, 0, HOUSE_W + 26, 0);
    shadow.addColorStop(0, 'rgba(0,0,0,.28)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(HOUSE_W, 0, 26, H);
  }

  function drawHover() {
    if (state.phase !== 'playing' || state.paused) return;
    if (!state.selectedSeed || !state.hoverCell) return;
    const { row, col } = state.hoverCell;
    const x = GRID_X + col * CELL_W;
    const y = GRID_TOP + row * CELL_H;
    const occupied = state.plants.some((p) => p.row === row && p.col === col);
    const ok = state.selectedSeed === 'shovel' ? true : !occupied;

    ctx.fillStyle = ok ? 'rgba(255,255,255,.22)' : 'rgba(255,80,80,.28)';
    ctx.fillRect(x, y, CELL_W, CELL_H);
    ctx.strokeStyle = ok ? 'rgba(255,255,255,.7)' : 'rgba(255,120,120,.9)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
    ctx.setLineDash([]);
  }

  function drawPlants() {
    for (let i = 0; i < state.plants.length; i += 1) {
      const p = state.plants[i];
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 24, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3f7f22';
      ctx.beginPath();
      ctx.ellipse(p.x - 14, p.y + 16, 12, 7, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.x + 14, p.y + 16, 12, 7, 0.5, 0, Math.PI * 2);
      ctx.fill();

      const sway = Math.sin(state.time * 2 + p.sway) * 2.2;
      if (p.type === 'peashooter' && plantImages.peashooter) {
        ctx.drawImage(plantImages.peashooter, p.x - 31 + sway, p.y - 46, 62, 62);
      } else {
        drawEmoji(PLANT_TYPES[p.type].emoji, p.x + sway, p.y - 4, 46);
      }

      if (p.type === 'sunflower') {
        const ratio = Math.max(0, Math.min(1, p.timer / SUNFLOWER_INTERVAL));
        ctx.strokeStyle = 'rgba(255,224,102,.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 4, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();
      }
    }
  }

  function zombieSign(z) {
    if (state.subject === 'english') {
      return { emoji: z.item.emoji, w: 46, h: 44, emojiSize: 26 };
    }
    if (state.subject === 'math') {
      const text = z.item.sign;
      const wide = [...text].length > 3;
      return { text, w: wide ? 64 : 44, h: 34, fontSize: wide ? 17 : 21 };
    }
    return { text: z.item.char, w: 44, h: 34, fontSize: 21 };
  }

  function drawZombies() {
    for (let i = 0; i < state.zombies.length; i += 1) {
      const z = state.zombies[i];
      const bob = Math.sin(state.time * 4 + z.wobble) * 2.5;
      const x = z.x;
      const y = z.y + bob;

      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath();
      ctx.ellipse(x, z.y + 26, 26 * z.scale, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      if (z.dead) ctx.globalAlpha = 0.55;
      drawEmoji('🧟', x, y + 2, 50 * z.scale);
      ctx.globalAlpha = 1;

      if (z.hitFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      const card = zombieSign(z);
      const signW = card.w;
      const signH = card.h;
      const sx = x - signW / 2;
      const sy = y - 30 - signH;

      ctx.strokeStyle = '#8a6a2f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, sy + signH);
      ctx.lineTo(x, y - 26);
      ctx.stroke();

      ctx.fillStyle = '#f6e2b3';
      roundRectPath(ctx, sx, sy, signW, signH, 7);
      ctx.fill();
      ctx.strokeStyle = '#8a6a2f';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (card.emoji) {
        drawEmoji(card.emoji, x, sy + signH / 2, card.emojiSize);
      } else {
        ctx.fillStyle = '#3b2b12';
        ctx.font = `700 ${card.fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.text, x, sy + signH / 2 + 1);
      }

      if (z.maxHp > 1) {
        const barW = 40;
        const barH = 5;
        const bx = x - barW / 2;
        const by = sy - 12;
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        roundRectPath(ctx, bx, by, barW, barH, 2.5);
        ctx.fill();
        ctx.fillStyle = '#ff6b6b';
        roundRectPath(ctx, bx, by, barW * Math.max(0, z.hp / z.maxHp), barH, 2.5);
        ctx.fill();
      }

      if (z.id === state.activeId && !z.dead) {
        const pulse = 0.5 + Math.sin(state.time * 6) * 0.5;
        ctx.strokeStyle = `rgba(255,210,63,${0.5 + pulse * 0.45})`;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([7, 7]);
        ctx.beginPath();
        ctx.ellipse(x, y + 4, 34, 46, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffd23f';
        ctx.beginPath();
        ctx.moveTo(x, sy - 20 - pulse * 3);
        ctx.lineTo(x - 8, sy - 33 - pulse * 3);
        ctx.lineTo(x + 8, sy - 33 - pulse * 3);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawPeas() {
    for (let i = 0; i < state.peas.length; i += 1) {
      const pea = state.peas[i];
      ctx.fillStyle = '#8ee04a';
      ctx.beginPath();
      ctx.arc(pea.x, pea.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath();
      ctx.arc(pea.x - 2, pea.y - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEffects() {
    for (let i = 0; i < state.beams.length; i += 1) {
      const b = state.beams[i];
      const alpha = Math.max(0, b.life / b.max);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = 'round';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < state.particles.length; i += 1) {
      const p = state.particles[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < state.floaters.length; i += 1) {
      const f = state.floaters[i];
      ctx.globalAlpha = Math.min(1, (f.life / f.max) * 1.4);
      ctx.font = '800 18px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.22)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (state.shake > 0.05) {
      ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake));
    }
    drawLawn();
    drawHouse();
    drawHover();
    drawPlants();
    drawZombies();
    drawPeas();
    drawEffects();
    ctx.restore();
    drawVignette();
  }

  // ---------------- HUD / 提示 ----------------
  function updateHUD() {
    hudSun.textContent = String(Math.floor(state.sun));
    const hearts = '❤️'.repeat(Math.max(0, state.lives)) + '🖤'.repeat(Math.max(0, 3 - state.lives));
    hudLives.textContent = hearts;
    hudWave.textContent = `${Math.max(1, state.wave)}/${TOTAL_WAVES}`;
    hudScore.textContent = String(state.score);
    hudCombo.textContent = `×${state.combo}`;
    const meta = SUBJECT_META[state.subject] || SUBJECT_META.chinese;
    let subjectLabel = `${meta.icon} ${meta.name}`;
    if (state.subject === 'math') {
      subjectLabel += ` · ${(MATH_MODES[state.mathMode] || MATH_MODES.normal).name}`;
    }
    if (hudSubject) hudSubject.textContent = subjectLabel;

    const seeds = document.querySelectorAll('.seed');
    for (let i = 0; i < seeds.length; i += 1) {
      const btn = seeds[i];
      const seed = btn.dataset.seed;
      if (seed === 'shovel') {
        btn.classList.toggle('selected', state.selectedSeed === 'shovel');
        continue;
      }
      const cost = PLANT_TYPES[seed].cost;
      btn.classList.toggle('disabled', state.sun < cost);
      btn.classList.toggle('selected', state.selectedSeed === seed);
    }
  }

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  let bannerTimer = null;
  function showBanner(text, ms) {
    bannerEl.textContent = text;
    bannerEl.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => bannerEl.classList.remove('show'), ms || 1600);
  }

  function showOverlay(html) {
    overlayCard.innerHTML = html;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  // ---------------- 流程 ----------------
  function showMenu() {
    state.phase = 'menu';
    const cards = Object.entries(SUBJECT_META).map(([key, meta]) => `
      <button class="subject-card" data-subject="${key}" type="button">
        <span class="subject-icon">${meta.icon}</span>
        <span class="subject-name">${meta.name}</span>
        <span class="subject-desc">${meta.desc}</span>
        <span class="subject-stages">${meta.stages.join(' · ')}</span>
      </button>
    `).join('');

    showOverlay(`
      <h1>植物大战僵尸 <span>教学版</span></h1>
      <p>选一个科目，边守草坪边练习</p>
      <div class="subject-grid">${cards}</div>
      <ul class="rules">
        <li>🧟 僵尸举着题目，选出正确答案即可立即消灭它</li>
        <li>🌻 向日葵每隔几秒自动产出阳光；🌱 豌豆射手会帮你补刀</li>
        <li>🖱️ 点击任意僵尸可切换题目目标，别让它们走到房子前</li>
      </ul>
      <p class="best">历史最高分：<b>${bestScore}</b></p>
    `);
    overlayCard.querySelectorAll('.subject-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.subject === 'math') showMathMenu();
        else startGame(btn.dataset.subject);
      });
    });
    stopBattleMusic();
    playMenuMusic();
  }

  function showMathMenu() {
    state.phase = 'menu';
    showOverlay(`
      <h2>🔢 数学 · 选择练习方式</h2>
      <p>两种模式都是 5 波，答对题目即可消灭僵尸</p>
      <div class="subject-grid mode-grid">
        <button class="subject-card" data-mode="normal" type="button">
          <span class="subject-icon">🧮</span>
          <span class="subject-name">常规练习</span>
          <span class="subject-desc">按数域循序渐进</span>
          <span class="subject-stages">1-9 分解 · 10 以内加减 · 20 以内加减</span>
        </button>
        <button class="subject-card" data-mode="inverse" type="button">
          <span class="subject-icon">🔄</span>
          <span class="subject-name">颠倒数练习</span>
          <span class="subject-desc">两位数、三位数颠倒后的和与差</span>
          <span class="subject-stages">52 − 25 = 27 · 52 + 25 = 77 · 521 ± 125</span>
        </button>
      </div>
      <button class="btn-ghost" id="btn-back-subjects" type="button">返回科目选择</button>
    `);
    overlayCard.querySelectorAll('.mode-grid .subject-card').forEach((btn) => {
      btn.addEventListener('click', () => startGame('math', btn.dataset.mode));
    });
    const back = document.getElementById('btn-back-subjects');
    if (back) back.addEventListener('click', showMenu);
    stopBattleMusic();
    playMenuMusic();
  }

  function startGame(subject, mode) {
    AudioFX.init();
    stopMenuMusic();
    stopBattleMusic();
    state.subject = SUBJECT_META[subject] ? subject : state.subject;
    if (MATH_MODES[mode]) state.mathMode = mode;
    Object.assign(state, {
      phase: 'playing',
      paused: false,
      time: 0,
      sun: 75,
      lives: 3,
      score: 0,
      combo: 0,
      maxCombo: 0,
      wave: 0,
      zombies: [],
      plants: [],
      peas: [],
      floaters: [],
      particles: [],
      beams: [],
      nextZombieId: 1,
      nextPlantId: 1,
      spawnQueue: [],
      spawnTimer: 0,
      breakTimer: 0,
      activeId: null,
      question: null,
      questionLocked: false,
      resolveTimer: 0,
      selectedSeed: null,
      hoverCell: null,
      shake: 0,
      hudTimer: 0,
    });
    state.selectedSeed = null;
    hideOverlay();
    pauseVeil.classList.add('hidden');
    btnPause.textContent = '⏸️';
    renderQuiz();
    updateHUD();
    startWave(1);
    playBattleMusic();
  }

  function gameOver() {
    state.phase = 'over';
    state.paused = false;
    stopBattleMusic();
    state.question = null;
    state.activeId = null;
    state.questionLocked = false;
    renderQuiz();
    AudioFX.lose();
    showOverlay(`
      <h2>🧟 僵尸吃掉了你的脑子…</h2>
      <p>本局得分 <b style="color:#ffd23f">${state.score}</b> · 最高连击 ×${state.maxCombo}</p>
      <p>你坚持到了第 <b>${state.wave}</b> 波</p>
      <div class="overlay-actions">
        <button class="btn-primary" id="btn-again" type="button">再玩一次</button>
        <button class="btn-ghost" id="btn-menu" type="button">换科目</button>
      </div>
      <p class="best">历史最高分：<b>${bestScore}</b></p>
    `);
    wireEndButtons();
    submitScore().then(() => {
      const b = overlayCard.querySelector('.best b');
      if (b) b.textContent = String(bestScore);
    });
  }

  function winGame() {
    state.phase = 'win';
    state.paused = false;
    stopBattleMusic();
    state.question = null;
    state.activeId = null;
    state.questionLocked = false;
    renderQuiz();
    AudioFX.win();
    const winText = state.subject === 'math' && state.mathMode === 'inverse'
      ? '颠倒数小达人！'
      : SUBJECT_META[state.subject].winText;
    showOverlay(`
      <h2>🎉 你守住了草坪！</h2>
      <p>本局得分 <b style="color:#ffd23f">${state.score}</b> · 最高连击 ×${state.maxCombo}</p>
      <p>成功挡下全部 ${TOTAL_WAVES} 波僵尸，${winText}</p>
      <div class="overlay-actions">
        <button class="btn-primary" id="btn-again" type="button">再玩一次</button>
        <button class="btn-ghost" id="btn-menu" type="button">换科目</button>
      </div>
      <p class="best">历史最高分：<b>${bestScore}</b></p>
    `);
    wireEndButtons();
    submitScore().then(() => {
      const b = overlayCard.querySelector('.best b');
      if (b) b.textContent = String(bestScore);
    });
  }

  function wireEndButtons() {
    const again = document.getElementById('btn-again');
    if (again) again.addEventListener('click', () => startGame(state.subject));
    const menu = document.getElementById('btn-menu');
    if (menu) menu.addEventListener('click', showMenu);
  }

  function togglePause() {
    if (state.phase !== 'playing' && state.phase !== 'break') return;
    state.paused = !state.paused;
    pauseVeil.classList.toggle('hidden', !state.paused);
    btnPause.textContent = state.paused ? '▶️' : '⏸️';
    if (state.paused) pauseBattleMusic();
    else playBattleMusic();
  }

  // ---------------- 交互 ----------------
  function selectSeed(seed) {
    if (state.phase !== 'playing' || state.paused) return;
    AudioFX.init();
    if (seed !== 'shovel') {
      const cost = PLANT_TYPES[seed].cost;
      if (state.sun < cost) {
        toast(`阳光不够，${PLANT_TYPES[seed].name}需要 ${cost} 阳光`);
        return;
      }
    }
    state.selectedSeed = state.selectedSeed === seed ? null : seed;
    updateHUD();
  }

  document.querySelectorAll('.seed').forEach((btn) => {
    btn.addEventListener('click', () => selectSeed(btn.dataset.seed));
  });

  function getCanvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height),
    };
  }

  canvas.addEventListener('click', (event) => {
    if (state.phase !== 'playing' || state.paused) return;
    AudioFX.init();
    const pos = getCanvasPos(event);
    const cell = pointToCell(pos.x, pos.y);

    if (state.selectedSeed && cell) {
      if (state.selectedSeed === 'shovel') shovelAt(cell);
      else plantAt(cell);
      return;
    }

    const zombie = hitZombie(pos.x, pos.y);
    if (zombie) selectZombie(zombie);
  });

  canvas.addEventListener('mousemove', (event) => {
    if (state.phase !== 'playing' || state.paused) {
      state.hoverCell = null;
      return;
    }
    const pos = getCanvasPos(event);
    state.hoverCell = pointToCell(pos.x, pos.y);
  });

  canvas.addEventListener('mouseleave', () => {
    state.hoverCell = null;
  });

  btnPause.addEventListener('click', togglePause);
  document.getElementById('btn-resume').addEventListener('click', togglePause);

  btnMute.addEventListener('click', () => {
    state.muted = !state.muted;
    btnMute.textContent = state.muted ? '🔇' : '🔊';
    menuBgm.muted = state.muted;
    battleBgm.muted = state.muted;
    if (!state.muted) {
      playMenuMusic();
      playBattleMusic();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      state.selectedSeed = null;
      updateHUD();
    } else if (event.key === '1') {
      selectSeed('sunflower');
    } else if (event.key === '2') {
      selectSeed('peashooter');
    } else if (event.key === ' ') {
      event.preventDefault();
      togglePause();
    }
  });

  // ---------------- 主循环 ----------------
  let lastTs = 0;
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    dt = Math.min(0.05, Math.max(0, dt));
    if (!state.paused) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  async function boot() {
    updateHUD();
    render();
    await Promise.all([loadContent(), loadBest()]);
    const kickMenuMusic = () => playMenuMusic();
    window.addEventListener('click', kickMenuMusic, { once: true });
    window.addEventListener('keydown', kickMenuMusic, { once: true });
    showMenu();
    requestAnimationFrame(loop);
  }

  boot();
})();
