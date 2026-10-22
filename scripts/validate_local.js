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
console.log(colors.bold('\n2. JSON Dataset Integrity (vocab/*.json & ielts/*.json)'));
const dataDirs = ['vocab', 'ielts'];
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
      if (!Array.isArray(parsed)) {
        throw new Error('Root element must be a JSON array');
      }
      if (parsed.length === 0) {
        throw new Error('Dataset array is empty');
      }
      // Check first item for basic schema
      const sample = parsed[0];
      if (!sample.id && !sample.chinese && !sample.word && !sample.question && !sample.dialogue) {
        throw new Error('Items missing essential question/word attributes');
      }
      totalItemCount += parsed.length;
      logPass(`Valid schema: ${dir}/${f} (${parsed.length} entries)`);
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
  'study-cat-chengyu',
  'study-cat-grammar',
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
  'bridge-start-quiz-btn'
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
          if (sel.startsWith('#') && child.id === sel.slice(1)) match = true;
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
      { name: 'Samantha', lang: 'en-US' }
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
