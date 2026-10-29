#!/usr/bin/env node

/**
 * ============================================================================
 * HSK5_Study Automated Local QA Validation Suite (Step 3 Gatekeeper)
 * ============================================================================
 * Performs full automated testing of:
 * 1. Syntax & Console error (0 errors)
 * 2. JSON dataset schema integrity (vocab/*.json & ielts/*.json)
 * 3. DOM & Mobile Responsive Viewport checks
 * 4. Logic & Storage stability (5-Question simulation + F5 reload persistence)
 * 5. Audio playback speed (0.8x, 1.0x, 1.2x, 1.5x) verification
 *
 * Emits gatekeeper signal: [PASS] HSK5_Study Local Stable
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

let allTestsPassed = true;
const testLogs = [];

function logPass(msg) {
  testLogs.push(`  ${colors.green('✔')} ${msg}`);
}

function logFail(msg, err) {
  allTestsPassed = false;
  testLogs.push(`  ${colors.red('✖')} ${msg}${err ? `\n    ${colors.red(String(err))}` : ''}`);
}

console.log(colors.cyan(colors.bold('\n======================================================')));
console.log(colors.cyan(colors.bold(' 🛡️ HSK5_Study Local Validation Suite (Step 3 QA) ')));
console.log(colors.cyan(colors.bold('======================================================\n')));

// -----------------------------------------------------------------------------
// Test 1: Node Syntax Check across all .js files
// -----------------------------------------------------------------------------
console.log(colors.bold('1. JavaScript Syntax Verification (node --check)'));
const jsFiles = ['app.js', 'auth.js', 'vocab_data.js', 'build_data.js'];
jsFiles.forEach((file) => {
  const filePath = path.join(REPO_ROOT, file);
  if (!fs.existsSync(filePath)) {
    logFail(`Missing file: ${file}`);
    return;
  }
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    logPass(`Syntax valid: ${file}`);
  } catch (err) {
    logFail(`Syntax error in ${file}`, err.stderr ? err.stderr.toString() : err.message);
  }
});

// -----------------------------------------------------------------------------
// Test 2: JSON Datasets Schema Integrity
// -----------------------------------------------------------------------------
console.log(colors.bold('\n2. JSON Dataset Integrity (vocab/*.json, vocab/levels/*.json, ielts/*.json, jlpt/*.json & jlpt/levels/*.json)'));
const dataDirs = ['vocab', 'vocab/levels', 'ielts', 'jlpt', 'jlpt/levels'];
let totalJsonCount = 0;
let totalItemCount = 0;

dataDirs.forEach((dir) => {
  const fullDir = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) {
    logFail(`Missing directory: ${dir}`);
    return;
  }
  const files = fs.readdirSync(fullDir).filter((f) => f.endsWith('.json'));
  files.forEach((f) => {
    totalJsonCount++;
    const fullPath = path.join(fullDir, f);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          throw new Error('Dataset array is empty');
        }
        const sample = parsed[0];
        if (!sample.id && !sample.chinese && !sample.word && !sample.question && !sample.dialogue) {
          throw new Error('Items missing essential question/word attributes');
        }
        totalItemCount += parsed.length;
        logPass(`Valid array schema: ${dir}/${f} (${parsed.length} entries)`);
      } else if (parsed && typeof parsed === 'object') {
        // Object schema for level packs (vocab/levels/hsk*.json), custom_questions.json, or QUESTION_TEMPLATE.json
        let subCount = 0;
        ['vocab', 'grammar', 'listening', 'chengyu', 'idioms', 'cloze', 'reading', 'dictation'].forEach((k) => {
          if (Array.isArray(parsed[k])) subCount += parsed[k].length;
        });
        if (parsed.hskLevels && typeof parsed.hskLevels === 'object') {
          Object.values(parsed.hskLevels).forEach((lvObj) => {
            if (lvObj && typeof lvObj === 'object') {
              ['vocab', 'grammar', 'listening', 'chengyu', 'cloze'].forEach((k) => {
                if (Array.isArray(lvObj[k])) subCount += lvObj[k].length;
              });
            }
          });
        }
        totalItemCount += subCount;
        logPass(`Valid object schema: ${dir}/${f} (${subCount} modular entries)`);
      } else {
        throw new Error('Root element must be a JSON array or structured dataset object');
      }
    } catch (err) {
      logFail(`Invalid JSON in ${dir}/${f}`, err.message);
    }
  });
});
logPass(`Total dataset files checked: ${totalJsonCount}, Total entries: ${totalItemCount}`);

// -----------------------------------------------------------------------------
// Test 3: DOM Elements & Mobile Responsive CSS Verification
// -----------------------------------------------------------------------------
console.log(colors.bold('\n3. DOM Structure & Mobile Responsive CSS Verification'));
const htmlPath = path.join(REPO_ROOT, 'index.html');
const cssPath = path.join(REPO_ROOT, 'style.css');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const requiredDomIds = [
  'lang-hsk-btn',
  'lang-ielts-btn',
  'lang-jlpt-btn',
  'hsk-level-bar',
  'jlpt-level-bar',
  'tier-label-elem',
  'tier-label-inter',
  'tier-label-adv',
  'jlpt-tier-elem',
  'jlpt-tier-inter',
  'jlpt-tier-adv',
  'ui-lang-switcher',
  'tts-speed',
  'opt-speed-slow',
  'opt-speed-normal',
  'opt-speed-fast',
  'opt-speed-vfast',
  'tts-voice-select',
  'auto-tts-toggle',
  'srs-mastered-count',
  'srs-review-count',
  'srs-new-count',
  'reset-progress-btn',
  'mode-grid',
  'start-btn',
  'quiz-view',
  'quiz-timer-badge',
  'timer-display',
  'timer-bar-fill',
  'timer-hint-box',
  'diff-timer-easy',
  'diff-timer-mid',
  'diff-timer-hard',
  'options-list',
  'dictation-box',
  'listening-player-box',
  'reading-box',
  'history-modal',
  'main-mode-nav',
  'nav-mode-study',
  'nav-mode-quiz',
  'study-view',
  'study-cat-vocab',
  'study-cat-grammar',
  'study-cat-listening',
  'study-cat-chengyu',
  'flashcard-scene',
  'flashcard',
  'card-primary-text',
  'card-secondary-text',
  'card-meaning-ko',
  'card-meaning-en',
  'card-meaning-zh',
  'study-prev-btn',
  'study-flip-btn',
  'study-next-btn',
  'bridge-start-quiz-btn',
  'open-json-btn',
  'json-modal',
  'reload-json-btn',
  'apply-json-btn'
];

requiredDomIds.forEach((id) => {
  if (htmlContent.includes(`id="${id}"`)) {
    logPass(`DOM ID confirmed: #${id}`);
  } else {
    logFail(`Missing required DOM ID in index.html: #${id}`);
  }
});

// Check CSS Responsive media query for <= 480px
if (cssContent.includes('@media (max-width: 480px)')) {
  logPass('Mobile responsive media query (@media (max-width: 480px)) detected in style.css');
  if (cssContent.includes('.srs-stats-grid') && cssContent.includes('#start-btn')) {
    logPass('Defensive styling for SRS summary boxes & #start-btn mobile alignment present');
  } else {
    logFail('Missing responsive rules for .srs-stats-grid or #start-btn under max-width: 480px');
  }
} else {
  logFail('Missing @media (max-width: 480px) block in style.css');
}

// -----------------------------------------------------------------------------
// Test 4: VM Sandboxed Browser Runtime & 0 Console Error Verification
// -----------------------------------------------------------------------------
console.log(colors.bold('\n4. Sandboxed Browser Runtime & Logic Verification'));

function createMockEnvironment() {
  const localStorageStore = {
    loggedInUser: 'test_student'
  };

  const localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(localStorageStore, key) ? localStorageStore[key] : null),
    setItem: (key, val) => {
      localStorageStore[key] = String(val);
    },
    removeItem: (key) => {
      delete localStorageStore[key];
    },
    clear: () => {
      Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
    }
  };

  class MockClassList {
    constructor(el) {
      this.el = el;
      this.classes = new Set();
    }
    add(...names) {
      names.forEach((n) => {
        if (n) this.classes.add(n);
      });
      this.el._className = Array.from(this.classes).join(' ');
    }
    remove(...names) {
      names.forEach((n) => this.classes.delete(n));
      this.el._className = Array.from(this.classes).join(' ');
    }
    toggle(name, force) {
      if (typeof force !== 'undefined') {
        if (force) this.add(name);
        else this.remove(name);
        return force;
      }
      if (this.classes.has(name)) {
        this.remove(name);
        return false;
      } else {
        this.add(name);
        return true;
      }
    }
    contains(name) {
      return this.classes.has(name);
    }
  }

  class MockElement {
    constructor(tagName = 'div', id = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this._className = '';
      this.classList = new MockClassList(this);
      this.attributes = {};
      this.style = {};
      this.children = [];
      this.childNodes = [];
      this.parentNode = null;
      this.listeners = {};
      this.textContent = '';
      this._innerHTML = '';
      this.value = '';
      this.checked = true;
      this.title = '';
    }

    set className(val) {
      this._className = val || '';
      this.classList.classes = new Set(this._className.split(/\s+/).filter(Boolean));
    }
    get className() {
      return this._className;
    }

    set innerHTML(val) {
      this._innerHTML = val || '';
      this.children = [];
      this.childNodes = [];
      if (!val) return;

      const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>([\s\S]*?)<\/\1>/g;
      let m;
      let hasTags = false;
      while ((m = tagRegex.exec(val)) !== null) {
        hasTags = true;
        const tagName = m[1];
        const attrStr = m[2];
        const inner = m[3];
        const child = new MockElement(tagName);
        const classMatch = attrStr.match(/class="([^"]+)"/);
        if (classMatch) child.className = classMatch[1];
        const idMatch = attrStr.match(/id="([^"]+)"/);
        if (idMatch) child.id = idMatch[1];
        child.textContent = inner.replace(/<[^>]+>/g, '').trim();
        child.innerHTML = inner;
        this.appendChild(child);
      }
      if (!hasTags) {
        this.textContent = val.replace(/<[^>]+>/g, '').trim();
      }
    }
    get innerHTML() {
      return this._innerHTML;
    }

    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k === 'id') this.id = String(v);
      if (k === 'class') this.className = String(v);
    }
    getAttribute(k) {
      return this.attributes[k] || (k === 'id' ? this.id : null);
    }
    removeAttribute(k) {
      delete this.attributes[k];
    }
    hasAttribute(k) {
      return Object.prototype.hasOwnProperty.call(this.attributes, k);
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      this.childNodes.push(child);
      return child;
    }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }

    addEventListener(event, handler) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
    }
    removeEventListener(event, handler) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
    dispatchEvent(event) {
      const type = event.type || event;
      if (this.listeners[type]) {
        this.listeners[type].forEach((fn) => fn(event));
      }
    }
    click() {
      this.dispatchEvent({ type: 'click', target: this });
    }

    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    }

    querySelectorAll(sel) {
      const results = [];
      function walk(node) {
        if (!node || !node.children) return;
        for (const child of node.children) {
          let match = false;
          if (sel === '.hsk-level-tab:not(.jlpt-level-tab)') {
            match = child.classList.contains('hsk-level-tab') && !child.classList.contains('jlpt-level-tab');
          } else if (sel.startsWith('#') && child.id === sel.slice(1)) match = true;
          else if (sel.startsWith('.') && child.classList.contains(sel.slice(1))) match = true;
          else if (child.tagName.toLowerCase() === sel.toLowerCase()) match = true;
          else if (sel.includes('[data-diff=')) {
            const val = sel.match(/data-diff="([^"]+)"/);
            if (val && child.getAttribute('data-diff') === val[1]) match = true;
          }

          if (match) results.push(child);
          walk(child);
        }
      }
      walk(this);
      return results;
    }
  }

  const elementsById = new Map();

  function getOrCreateElement(id, tag = 'div') {
    if (!elementsById.has(id)) {
      const el = new MockElement(tag, id);
      elementsById.set(id, el);
    }
    return elementsById.get(id);
  }

  // Populate known IDs from index.html regex
  const idRegex = /id="([^"]+)"/g;
  let match;
  while ((match = idRegex.exec(htmlContent)) !== null) {
    getOrCreateElement(match[1]);
  }

  const documentElement = new MockElement('html');
  const body = new MockElement('body');
  documentElement.appendChild(body);

  const appContainer = new MockElement('div');
  appContainer.className = 'app-container';
  body.appendChild(appContainer);

  // Append cached elements to body for querySelector searches
  elementsById.forEach((el) => {
    appContainer.appendChild(el);
    body.appendChild(el);
  });

  // Specialized attributes for inputs and buttons
  const autoTts = getOrCreateElement('auto-tts-toggle', 'input');
  autoTts.type = 'checkbox';
  autoTts.checked = true;

  const ttsSpeedSelect = getOrCreateElement('tts-speed', 'select');
  ttsSpeedSelect.value = '1.0';

  const ttsVoiceSelect = getOrCreateElement('tts-voice-select', 'select');
  ttsVoiceSelect.value = 'auto';

  // Setup diff buttons and count buttons in body
  ['5', '10', '15', 'all'].forEach((c) => {
    const btn = getOrCreateElement(`count-btn-${c}`, 'button');
    btn.classList.add('count-btn');
    btn.setAttribute('data-count', c);
    if (c === '5') btn.classList.add('active');
  });

  ['하', '중', '상'].forEach((d) => {
    const btn = new MockElement('button');
    btn.classList.add('diff-btn');
    btn.setAttribute('data-diff', d);
    if (d === '중') btn.classList.add('active');
    const badge = new MockElement('span');
    badge.classList.add('diff-badge');
    badge.textContent = d;
    btn.appendChild(badge);
    const desc = new MockElement('div');
    desc.classList.add('diff-desc');
    btn.appendChild(desc);
    body.appendChild(btn);
  });

  ['1', '2', '3', '4', '5', '6', '7-9'].forEach((lv) => {
    const btn = new MockElement('button', `hsk-level-tab-${lv}`);
    btn.classList.add('hsk-level-tab');
    btn.setAttribute('data-hsk-level', lv);
    if (lv === '5') btn.classList.add('active');
    body.appendChild(btn);
  });

  ['N5', 'N4', 'N3', 'N2', 'N1'].forEach((lv) => {
    const btn = new MockElement('button', `jlpt-level-tab-${lv}`);
    btn.classList.add('jlpt-level-tab');
    btn.setAttribute('data-jlpt-level', lv);
    if (lv === 'N2') btn.classList.add('active');
    body.appendChild(btn);
  });

  ['zh', 'ko', 'en', 'ja'].forEach((u) => {
    const btn = new MockElement('button', `ui-lang-tab-${u}`);
    btn.classList.add('ui-lang-tab');
    btn.setAttribute('data-ui-lang', u);
    if (u === 'ko') btn.classList.add('active');
    body.appendChild(btn);
  });

  ['vocab', 'grammar', 'listening', 'chengyu'].forEach((cat) => {
    const btn = getOrCreateElement(`study-cat-${cat}`, 'button');
    btn.classList.add('study-cat-btn');
    btn.setAttribute('data-study-cat', cat);
    if (cat === 'vocab') btn.classList.add('active');
  });

  const lastSpokenUtterances = [];

  class MockSpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
      this.lang = 'zh-CN';
      this.rate = 1.0;
      this.voice = null;
      this.onend = null;
      this.onerror = null;
    }
  }

  const speechSynthesis = {
    speak: (utterance) => {
      lastSpokenUtterances.push(utterance);
      setTimeout(() => {
        if (typeof utterance.onend === 'function') utterance.onend();
      }, 5);
    },
    cancel: () => {},
    getVoices: () => [
      { name: 'Tingting', lang: 'zh-CN' },
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Kyoko', lang: 'ja-JP' }
    ],
    onvoiceschanged: null
  };

  const uncaughtErrors = [];

  const windowMock = {
    document: {
      addEventListener: (evt, handler) => {
        if (evt === 'DOMContentLoaded') {
          setTimeout(handler, 0);
        }
      },
      getElementById: (id) => elementsById.get(id) || null,
      querySelector: (sel) => body.querySelector(sel),
      querySelectorAll: (sel) => body.querySelectorAll(sel),
      createElement: (tag) => new MockElement(tag),
      body
    },
    localStorage,
    speechSynthesis,
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
    SpeechRecognition: function () {
      this.start = () => {};
      this.stop = () => {};
    },
    webkitSpeechRecognition: function () {
      this.start = () => {};
      this.stop = () => {};
    },
    AudioContext: function () {
      this.currentTime = 0;
      this.createOscillator = () => ({
        type: 'sine',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      });
      this.createGain = () => ({
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
      });
      this.destination = {};
      this.state = 'running';
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console: {
      log: () => {},
      warn: (msg) => {
        // Warning captured
      },
      error: (...args) => {
        uncaughtErrors.push(args.join(' '));
      }
    },
    location: { reload: () => {} },
    alert: () => {}
  };

  windowMock.window = windowMock;
  windowMock.global = windowMock;
  windowMock.self = windowMock;

  return { windowMock, elementsById, localStorage, localStorageStore, lastSpokenUtterances, uncaughtErrors };
}

async function runVMHarness() {
  const env = createMockEnvironment();
  const context = vm.createContext(env.windowMock);

  const vocabDataCode = fs.readFileSync(path.join(REPO_ROOT, 'vocab_data.js'), 'utf8');
  const authCode = fs.readFileSync(path.join(REPO_ROOT, 'auth.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(REPO_ROOT, 'app.js'), 'utf8');

  try {
    vm.runInContext(vocabDataCode, context);
    logPass('vocab_data.js executed in VM context without error');
  } catch (err) {
    logFail('Error executing vocab_data.js in VM', err);
  }

  try {
    vm.runInContext(authCode, context);
    logPass('auth.js executed in VM context without error');
  } catch (err) {
    logFail('Error executing auth.js in VM', err);
  }

  try {
    vm.runInContext(appCode, context);
    logPass('app.js executed in VM context without error');
  } catch (err) {
    logFail('Error executing app.js in VM', err);
  }

  // Wait for DOMContentLoaded to fire
  await new Promise((r) => setTimeout(r, 60));

  if (env.uncaughtErrors.length === 0) {
    logPass('Zero (0) Uncaught Errors during app initialization');
  } else {
    logFail(`Encountered ${env.uncaughtErrors.length} console errors during init`, env.uncaughtErrors.join('; '));
  }

  // ---------------------------------------------------------------------------
  // Test 5: Audio Playback Speed Verification (0.8x, 1.0x, 1.2x, 1.5x)
  // ---------------------------------------------------------------------------
  console.log(colors.bold('\n5. Audio Playback Speed Verification'));
  console.log(colors.bold('6. 5-Question Quiz Simulation & SRS F5 Persistence Verification'));

  const startBtn = env.elementsById.get('start-btn');
  const optionsList = env.elementsById.get('options-list');
  const nextBtn = env.elementsById.get('next-btn');
  const ttsSpeedSelect = env.elementsById.get('tts-speed');
  const ttsBtn = env.elementsById.get('tts-btn');
  const masteredCountEl = env.elementsById.get('srs-mastered-count');
  const reviewCountEl = env.elementsById.get('srs-review-count');

  if (startBtn) {
    startBtn.click();
    await new Promise((r) => setTimeout(r, 40));
    logPass('Started quiz via #start-btn.click()');

    // Answer first question so post-answer pronunciation and currentSpeechText are fully active
    if (optionsList.children.length > 0) {
      optionsList.children[0].click();
      await new Promise((r) => setTimeout(r, 20));
    }

    // Test Audio Speeds on the active question
    const speeds = ['0.8', '1.0', '1.2', '1.5'];
    for (const sp of speeds) {
      ttsSpeedSelect.value = sp;
      ttsSpeedSelect.dispatchEvent({ type: 'change', target: { value: sp } });

      env.lastSpokenUtterances.length = 0;
      if (ttsBtn) ttsBtn.click();
      await new Promise((r) => setTimeout(r, 20));

      const latestUtterance = env.lastSpokenUtterances[env.lastSpokenUtterances.length - 1];
      if (latestUtterance && Math.abs(latestUtterance.rate - parseFloat(sp)) < 0.01) {
        logPass(`Audio playback speed ${sp}x applied accurately to SpeechSynthesisUtterance.rate`);
      } else {
        const actual = latestUtterance ? latestUtterance.rate : 'none';
        logFail(`Failed setting speed ${sp}x (Actual rate: ${actual})`);
      }
    }

    // Advance and simulate answering remaining 4 questions
    for (let q = 2; q <= 5; q++) {
      if (nextBtn) {
        nextBtn.click();
        await new Promise((r) => setTimeout(r, 10));
      }
      const optionButtons = optionsList.children;
      if (optionButtons.length > 0) {
        optionButtons[0].click();
        await new Promise((r) => setTimeout(r, 10));
      }
    }
    logPass('Simulated completion of 5 quiz questions');

    const masteryKey = Object.keys(env.localStorageStore || {}).find((k) => k.startsWith('polyglot_quiz_mastery_'));
    const masteryData = masteryKey ? JSON.parse(env.localStorage.getItem(masteryKey)) : {};
    const recordedEntries = Object.keys(masteryData).length;

    if (recordedEntries > 0) {
      logPass(`SRS state successfully saved to localStorage (${recordedEntries} questions recorded)`);
    } else {
      logFail('No SRS records found in localStorage after 5-question simulation');
    }

    const preReloadMastered = masteredCountEl.textContent;
    const preReloadReview = reviewCountEl.textContent;

    // Simulate F5 Browser Reload (Re-initialize app with the persisted localStorage)
    const env2 = createMockEnvironment();
    // Copy localStorage into new env
    Object.keys(env.localStorageStore || {}).forEach((k) => {
      env2.localStorage.setItem(k, env.localStorage.getItem(k));
    });

    const context2 = vm.createContext(env2.windowMock);
    vm.runInContext(vocabDataCode, context2);
    vm.runInContext(authCode, context2);
    vm.runInContext(appCode, context2);
    await new Promise((r) => setTimeout(r, 60));

    const postReloadMastered = env2.elementsById.get('srs-mastered-count').textContent;
    const postReloadReview = env2.elementsById.get('srs-review-count').textContent;

    if (postReloadMastered === preReloadMastered && postReloadReview === preReloadReview) {
      logPass(`F5 Browser Reload persistence check PASSED (Mastered: ${postReloadMastered}, Review: ${postReloadReview})`);
    } else {
      logFail(`SRS counts mismatched after reload (Pre: M=${preReloadMastered}/R=${preReloadReview}, Post: M=${postReloadMastered}/R=${postReloadReview})`);
    }

    // -------------------------------------------------------------------------
    // Test 7: Per-Question Timer (하=30s, 중=60s, 상=300s) & Timeout Hint Verification
    // -------------------------------------------------------------------------
    console.log(colors.bold('\n7. Per-Question Timer (30s / 1m / 5m) & Auto Timeout Hint Verification'));
    const timerApi = env.windowMock.__HSK5_TIMER_TEST__;
    if (timerApi && typeof timerApi.getQuestionTimeLimit === 'function') {
      const easySec = timerApi.getQuestionTimeLimit('하');
      const midSec = timerApi.getQuestionTimeLimit('중');
      const hardSec = timerApi.getQuestionTimeLimit('상');

      if (easySec === 30 && midSec === 60 && hardSec === 300) {
        logPass(`Difficulty time limits verified: 하=${easySec}s (30초), 중=${midSec}s (1분), 상=${hardSec}s (5분)`);
      } else {
        logFail(`Unexpected time limits: 하=${easySec}, 중=${midSec}, 상=${hardSec}`);
      }

      // Start a fresh quiz and test timeout hint trigger
      startBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      const timerHintBox = env.elementsById.get('timer-hint-box');
      const timerHintContent = env.elementsById.get('timer-hint-content');
      const timerDisplay = env.elementsById.get('timer-display');

      if (timerHintBox && timerHintBox.classList.contains('hidden')) {
        logPass('Timer hint box is initially hidden when question starts');
      } else {
        logFail('Timer hint box should be hidden before timeout');
      }

      timerApi.triggerQuestionTimeoutHint();
      const stateAfterTimeout = timerApi.getTimerState();
      if (
        stateAfterTimeout.expired &&
        timerDisplay.textContent === '00:00' &&
        timerHintBox &&
        !timerHintBox.classList.contains('hidden') &&
        timerHintContent &&
        timerHintContent.innerHTML.includes('timer-hint-row')
      ) {
        logPass('Timeout (00:00) automatically unlocks and renders context-aware Smart Hint box');
      } else {
        logFail('Timeout hint box failed to unlock or render hint content');
      }
      timerApi.stopQuestionTimer(false);
    } else {
      logFail('Missing window.__HSK5_TIMER_TEST__ interface in app.js');
    }

    // -------------------------------------------------------------------------
    // Test 8: New HSK 3.0 Multi-Level (1~6, 7-9급) & Vocab/Grammar/Listening Modes
    // -------------------------------------------------------------------------
    console.log(colors.bold('\n8. New HSK 3.0 Multi-Level (1~6, 7~9급) & Vocab/Grammar/Listening Study Verification'));
    const hskLevels = env.windowMock.APP_DATA && env.windowMock.APP_DATA.hskLevels;
    const expectedLevels = ['1', '2', '3', '4', '5', '6', '7-9'];
    if (hskLevels && expectedLevels.every((lv) => hskLevels[lv] && Array.isArray(hskLevels[lv].vocab) && Array.isArray(hskLevels[lv].grammar) && Array.isArray(hskLevels[lv].listening))) {
      logPass('All 7 New HSK 3.0 levels (1, 2, 3, 4, 5, 6, 7-9) loaded with vocab, grammar, and listening datasets');
    } else {
      logFail('Missing or incomplete APP_DATA.hskLevels datasets');
    }

    const levelTabs = env.windowMock.document.querySelectorAll('.hsk-level-tab');
    const logoBadgeEl = env.elementsById.get('logo-badge');
    const navStudyBtn = env.elementsById.get('nav-mode-study');
    const studyListenBtn = env.elementsById.get('study-cat-listening');
    const cardCatBadgeEl = env.elementsById.get('card-cat-badge');

    // Switch to Level 1, 3, 7-9, and back to 5
    for (const targetLv of ['1', '3', '7-9', '5']) {
      const tab = levelTabs.find((b) => b.getAttribute('data-hsk-level') === targetLv);
      if (tab) {
        tab.click();
        await new Promise((r) => setTimeout(r, 15));
      }
      if (logoBadgeEl && logoBadgeEl.textContent === `HSK ${targetLv}`) {
        logPass(`New HSK Level switch verified: HSK ${targetLv} active badge & dataset loaded`);
      } else {
        logFail(`Level switch failed for HSK ${targetLv} (badge=${logoBadgeEl ? logoBadgeEl.textContent : 'null'})`);
      }
    }

    // Verify Study Mode Listening Category on Level 3
    const tab3 = levelTabs.find((b) => b.getAttribute('data-hsk-level') === '3');
    if (tab3) tab3.click();
    if (navStudyBtn) navStudyBtn.click();
    await new Promise((r) => setTimeout(r, 20));
    if (studyListenBtn) studyListenBtn.click();
    await new Promise((r) => setTimeout(r, 20));
    if (cardCatBadgeEl && cardCatBadgeEl.textContent.includes('3급') && cardCatBadgeEl.textContent.includes('듣기')) {
      logPass(`Study Mode Flashcard Listening category verified on New HSK 3급 (${cardCatBadgeEl.textContent})`);
    } else {
      logFail(`Study Mode Listening category badge mismatch: ${cardCatBadgeEl ? cardCatBadgeEl.textContent : 'null'}`);
    }

    // -------------------------------------------------------------------------
    // Test 9: Decoupled JSON Question & Explanation Hot-Update Verification
    // -------------------------------------------------------------------------
    console.log(colors.bold('\n9. Decoupled JSON Question & Explanation Hot-Update Verification'));
    const jsonLoader = env.windowMock.__HSK_JSON_LOADER__;
    if (jsonLoader && typeof jsonLoader.applyCustomJsonPayload === 'function') {
      const beforeCount = env.windowMock.APP_DATA.hskLevels['3'].grammar.length;
      const customGrammarItem = {
        id: 99301,
        pattern: '越 A 越 B (심화)',
        meaning: 'A할수록 더욱 B하다',
        question: '雨 ( ___ ) 下越大。',
        options: ['越', '更', '最', '太'],
        answer: 1,
        explanation: 'JSON 핫업데이트 테스트 해설: 越 A 越 B 구문은 앞의 조건이 심해질수록 뒤의 정도도 깊어짐을 뜻합니다.',
        tip: '소프트웨어 수정 없이 JSON만으로 해설과 팁을 즉시 업데이트할 수 있습니다.'
      };
      const patchResult = jsonLoader.applyCustomJsonPayload([customGrammarItem], '3', 'grammar');
      const addedCount = patchResult && typeof patchResult === 'object' ? patchResult.addedCount : patchResult;
      const afterDataset = jsonLoader.getActiveLevelDataset('3');
      const injected = afterDataset && afterDataset.grammar && afterDataset.grammar.find((g) => g.id === 99301);
      if (addedCount === 1 && afterDataset.grammar.length === beforeCount + 1 && injected && injected.explanation.includes('JSON 핫업데이트 테스트 해설')) {
        logPass('Hot-loaded new grammar question + custom explanation purely via JSON without software modification');
      } else {
        logFail('Failed to hot-load custom JSON question/explanation into HSK Level 3 dataset');
      }
      jsonLoader.clearCustomJsonPatches();
    } else {
      logFail('Missing window.__HSK_JSON_LOADER__ interface in app.js');
    }

    // -------------------------------------------------------------------------
    // Test 10: JLPT Japanese Subject (N5~N1), Study Mode Flashcards, 5-Question Quiz, Japanese TTS (`ja-JP`), & Japanese UI (`ja`) Verification
    // -------------------------------------------------------------------------
    console.log(colors.bold('\n10. JLPT Japanese Subject (N5~N1), Study Mode, Quiz, TTS (ja-JP) & Japanese UI (ja) Verification'));
    const jlptLevels = env.windowMock.APP_DATA && env.windowMock.APP_DATA.jlptLevels;
    const expectedJlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
    if (
      jlptLevels &&
      expectedJlptLevels.every(
        (lv) =>
          jlptLevels[lv] &&
          Array.isArray(jlptLevels[lv].vocab) &&
          Array.isArray(jlptLevels[lv].grammar) &&
          Array.isArray(jlptLevels[lv].listening) &&
          Array.isArray(jlptLevels[lv].idioms) &&
          Array.isArray(jlptLevels[lv].cloze) &&
          Array.isArray(jlptLevels[lv].reading) &&
          Array.isArray(jlptLevels[lv].dictation)
      )
    ) {
      logPass('All 5 JLPT levels (N5, N4, N3, N2, N1) loaded with full 7-part datasets (vocab, grammar, listening, idioms, cloze, reading, dictation)');
    } else {
      logFail('Missing or incomplete APP_DATA.jlptLevels datasets');
    }

    const langJlptBtn = env.elementsById.get('lang-jlpt-btn');
    const jlptLevelTabs = env.windowMock.document.querySelectorAll('.jlpt-level-tab');
    const navQuizBtn = env.elementsById.get('nav-mode-quiz');
    const studyVocabBtn = env.elementsById.get('study-cat-vocab');
    const studyChengyuBtn = env.elementsById.get('study-cat-chengyu');

    if (langJlptBtn) {
      langJlptBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      if (logoBadgeEl && logoBadgeEl.textContent === 'JLPT N2') {
        logPass('Switched subject to JLPT Japanese (#lang-jlpt-btn) -> Badge: JLPT N2');
      } else {
        logFail(`Failed switching to JLPT subject (badge=${logoBadgeEl ? logoBadgeEl.textContent : 'null'})`);
      }

      // Test switching across JLPT levels N5, N3, N1, and back to N2
      for (const jLv of ['N5', 'N3', 'N1', 'N2']) {
        const jTab = jlptLevelTabs.find((b) => b.getAttribute('data-jlpt-level') === jLv);
        if (jTab) {
          jTab.click();
          await new Promise((r) => setTimeout(r, 15));
        }
        if (logoBadgeEl && logoBadgeEl.textContent === `JLPT ${jLv}`) {
          logPass(`JLPT Level switch verified: JLPT ${jLv} active badge & dataset loaded`);
        } else {
          logFail(`JLPT Level switch failed for ${jLv} (badge=${logoBadgeEl ? logoBadgeEl.textContent : 'null'})`);
        }
      }

      // Verify Study Mode Flashcard on JLPT N2 (Vocab & Idioms/慣用句)
      if (navStudyBtn) navStudyBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      if (studyVocabBtn) studyVocabBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      const cardPrimaryEl = env.elementsById.get('card-primary-text');
      const cardSecondaryEl = env.elementsById.get('card-secondary-text');
      if (
        cardCatBadgeEl &&
        cardCatBadgeEl.textContent.includes('JLPT N2') &&
        cardPrimaryEl &&
        cardPrimaryEl.textContent.length > 0 &&
        cardSecondaryEl &&
        cardSecondaryEl.textContent.length > 0
      ) {
        logPass(`JLPT Study Mode Flashcard (문자·어휘) verified: ${cardPrimaryEl.textContent} [${cardSecondaryEl.textContent}]`);
      } else {
        logFail('JLPT Study Mode Flashcard failed to render Japanese vocabulary & furigana');
      }

      if (studyChengyuBtn) studyChengyuBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      if (cardCatBadgeEl && cardCatBadgeEl.textContent.includes('JLPT N2') && cardCatBadgeEl.textContent.includes('관용구')) {
        logPass(`JLPT Study Mode Flashcard (관용구·속담) verified: ${cardPrimaryEl ? cardPrimaryEl.textContent : ''}`);
      } else {
        logFail('JLPT Study Mode Flashcard failed to render Japanese idioms (慣用句)');
      }

      // Switch to Quiz Mode and run a 5-question JLPT N2 Quiz + verify Japanese TTS (`ja-JP`)
      if (navQuizBtn) navQuizBtn.click();
      await new Promise((r) => setTimeout(r, 20));
      env.lastSpokenUtterances.length = 0;
      startBtn.click();
      await new Promise((r) => setTimeout(r, 30));

      for (let q = 1; q <= 5; q++) {
        if (optionsList.children.length > 0) {
          optionsList.children[0].click();
          await new Promise((r) => setTimeout(r, 15));
        }
        if (q === 1 && ttsBtn) {
          env.lastSpokenUtterances.length = 0;
          ttsBtn.click();
          await new Promise((r) => setTimeout(r, 15));
          const jaUtterance = env.lastSpokenUtterances[env.lastSpokenUtterances.length - 1];
          if (jaUtterance && jaUtterance.lang === 'ja-JP') {
            logPass(`JLPT Native Japanese TTS verified: utterance.lang === "ja-JP" (text="${jaUtterance.text}")`);
          } else {
            logFail(`JLPT TTS language mismatch: ${jaUtterance ? jaUtterance.lang : 'no utterance'}`);
          }
        }
        if (q < 5 && nextBtn) {
          nextBtn.click();
          await new Promise((r) => setTimeout(r, 15));
        }
      }

      const jlptMasteryData = masteryKey ? JSON.parse(env.localStorage.getItem(masteryKey)) : {};
      const jlptEntries = Object.keys(jlptMasteryData).filter((k) => k.startsWith('jlpt_N2_'));
      if (jlptEntries.length > 0) {
        logPass(`JLPT 5-Question Quiz & SRS persistence verified (${jlptEntries.length} jlpt_N2_* items recorded)`);
      } else {
        logFail('No jlpt_N2_* SRS records found after JLPT 5-question quiz');
      }

      // Verify Japanese UI Language (`data-ui-lang="ja"`)
      const uiLangTabs = env.windowMock.document.querySelectorAll('.ui-lang-tab');
      const jaUiTab = uiLangTabs.find((b) => b.getAttribute('data-ui-lang') === 'ja');
      const appTitleEl = env.elementsById.get('app-title');
      if (jaUiTab) {
        jaUiTab.click();
        await new Promise((r) => setTimeout(r, 20));
        if (appTitleEl && appTitleEl.textContent.includes('JLPT') && appTitleEl.textContent.includes('スマートクイズ')) {
          logPass(`Japanese UI language (🇯🇵 日本語) verified: "${appTitleEl.textContent}"`);
        } else {
          logFail(`Japanese UI language title mismatch: "${appTitleEl ? appTitleEl.textContent : 'null'}"`);
        }
      } else {
        logFail('Missing .ui-lang-tab[data-ui-lang="ja"]');
      }
    } else {
      logFail('Missing #lang-jlpt-btn element');
    }
  } else {
    logFail('Missing #start-btn');
  }

  // ---------------------------------------------------------------------------
  // Summary & Gatekeeper Verdict
  // ---------------------------------------------------------------------------
  console.log(colors.cyan('\n------------------------------------------------------'));
  console.log(colors.bold('Validation Summary:'));
  testLogs.forEach((l) => console.log(l));
  console.log(colors.cyan('------------------------------------------------------\n'));

  if (allTestsPassed) {
    console.log(colors.green(colors.bold('🎉 [PASS] HSK5_Study Local Stable\n')));
    process.exit(0);
  } else {
    console.log(colors.red(colors.bold('❌ [FAIL] HSK5_Study Validation Errors Detected. Action required.\n')));
    process.exit(1);
  }
}

runVMHarness().catch((err) => {
  console.error(colors.red('Fatal test harness execution error:'), err);
  process.exit(1);
});
