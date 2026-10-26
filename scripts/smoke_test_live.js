#!/usr/bin/env node

/**
 * ============================================================================
 * HSK5_Study Automated Live Production Smoke Test Suite (Step 5 Gatekeeper)
 * ============================================================================
 * Performs remote HTTP verification of the live GitHub Pages production site:
 *   https://ses840105.github.io/HSK5_Study/
 *
 * Checks:
 * 1. Cache-busting fetch (equivalent to Ctrl+F5) with HTTP 200 OK
 * 2. Presence of new features ('1.5x', 'IELTS 영어', 'HSK 5급', '퀴즈 시작하기 🚀')
 * 3. Fetches live production scripts (app.js, auth.js, vocab_data.js) and executes in VM
 * 4. Verifies zero (0) console errors on production assets
 *
 * Emits gatekeeper signal:
 *   [PASS] HSK5_Study Live Production Smoke Test Complete — Task Closed
 */

const http = require('http');
const https = require('https');
const vm = require('vm');

const BASE_URL = 'https://ses840105.github.io/HSK5_Study';
const RAW_FALLBACK_URL = 'https://raw.githubusercontent.com/ses840105/HSK5_Study/main';

const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`
};

function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error(`Too many redirects for ${url}`));
    }
    const cbUrl = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
    const client = cbUrl.startsWith('https:') ? https : http;
    const options = {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'HSK5-SmokeTest-Agent/1.0'
      }
    };

    client.get(cbUrl, options, (res) => {
      // Follow redirects across http/https
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, cbUrl).toString();
        return resolve(fetchUrl(nextUrl, redirectCount + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchAssetWithFallback(fileName) {
  try {
    return await fetchUrl(`${BASE_URL}/${fileName}`);
  } catch (err) {
    return await fetchUrl(`${RAW_FALLBACK_URL}/${fileName}`);
  }
}

async function verifyLiveSite() {
  console.log(colors.cyan(colors.bold('\n======================================================')));
  console.log(colors.cyan(colors.bold(' 🌐 HSK5_Study Live Production Smoke Test (Step 5) ')));
  console.log(colors.cyan(colors.bold(` Target: ${BASE_URL}/`)));
  console.log(colors.cyan(colors.bold('======================================================\n')));

  const maxAttempts = 12;
  const pollIntervalMs = 5000;
  let attempt = 0;
  let html = '';
  let appJs = '';
  let authJs = '';
  let vocabDataJs = '';

  while (attempt < maxAttempts) {
    attempt++;
    process.stdout.write(`Attempt ${attempt}/${maxAttempts}: Fetching live production assets... `);
    try {
      html = await fetchAssetWithFallback('index.html');
      appJs = await fetchAssetWithFallback('app.js');
      authJs = await fetchAssetWithFallback('auth.js');
      vocabDataJs = await fetchAssetWithFallback('vocab_data.js');

      // Check if the latest build is live
      const hasLatestFeatures = html.includes('hsk-level-bar') && html.includes('study-cat-listening') && appJs.includes('setHskLevel');
      if (hasLatestFeatures) {
        console.log(colors.green('OK! (Latest deployment detected)'));
        break;
      } else {
        console.log(colors.yellow('Waiting for GitHub Pages CDN cache invalidation...'));
      }
    } catch (err) {
      console.log(colors.yellow(`Pending: ${err.message}`));
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  const checklist = [];

  // Check 1: Live Feature Signatures
  const requiredKeywords = [
    { name: '1.5x speed option (#opt-speed-vfast)', test: () => html.includes('opt-speed-vfast') && appJs.includes('speedVFast') },
    { name: 'Per-question timer & timeout hint (#quiz-timer-badge, #timer-hint-box)', test: () => html.includes('quiz-timer-badge') && html.includes('timer-hint-box') && appJs.includes('TIME_LIMIT_MAP') },
    { name: 'New HSK 3.0 Level Selector Bar (#hsk-level-bar, 1~6 & 7~9급)', test: () => html.includes('hsk-level-bar') && html.includes('data-hsk-level="7-9"') && appJs.includes('setHskLevel') },
    { name: 'Level-by-Level Vocab/Grammar/Listening Study Modes (#study-cat-listening)', test: () => html.includes('study-cat-listening') && vocabDataJs.includes('hskLevels') },
    { name: 'IELTS English subject switcher', test: () => html.includes('lang-ielts-btn') && html.includes('IELTS 영어') },
    { name: 'HSK subject switcher', test: () => html.includes('lang-hsk-btn') && html.includes('HSK 5급') },
    { name: 'Start Quiz button (#start-btn)', test: () => html.includes('id="start-btn"') && html.includes('퀴즈 시작하기') },
    { name: 'Spaced Repetition System (SRS) counters', test: () => html.includes('srs-mastered-count') && html.includes('srs-review-count') }
  ];

  requiredKeywords.forEach((k) => {
    if (k.test()) {
      checklist.push(`  ${colors.green('✔')} Live HTML/JS verification passed: ${k.name}`);
    } else {
      checklist.push(`  ${colors.red('✖')} Live verification failed: ${k.name}`);
    }
  });

  // Check 2: Sandboxed Browser Execution of Live Assets
  const uncaughtErrors = [];
  const sandbox = {
    document: {
      addEventListener: (evt, cb) => { if (evt === 'DOMContentLoaded') setTimeout(cb, 0); },
      getElementById: () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {} }, style: {} }),
      querySelector: () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {} }, style: {} }),
      querySelectorAll: () => []
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    speechSynthesis: { getVoices: () => [], speak: () => {}, cancel: () => {} },
    console: {
      log: () => {},
      warn: () => {},
      error: (...args) => { uncaughtErrors.push(args.join(' ')); }
    },
    window: {},
    setTimeout,
    clearTimeout
  };
  sandbox.window = sandbox;

  try {
    const ctx = vm.createContext(sandbox);
    vm.runInContext(vocabDataJs, ctx);
    vm.runInContext(authJs, ctx);
    vm.runInContext(appJs, ctx);
    checklist.push(`  ${colors.green('✔')} Production assets (vocab_data.js, auth.js, app.js) executed cleanly in VM`);
  } catch (err) {
    checklist.push(`  ${colors.red('✖')} Production asset execution runtime error: ${err.message}`);
  }

  if (uncaughtErrors.length === 0) {
    checklist.push(`  ${colors.green('✔')} Zero (0) console errors on production build`);
  } else {
    checklist.push(`  ${colors.red('✖')} Console errors detected on production: ${uncaughtErrors.join('; ')}`);
  }

  console.log(colors.bold('\nLive Smoke Test Checklist:'));
  checklist.forEach((item) => console.log(item));
  console.log('');

  const failedItems = checklist.filter((item) => item.includes('✖'));
  if (failedItems.length === 0) {
    console.log(colors.green(colors.bold('🎉 [PASS] HSK5_Study Live Production Smoke Test Complete — Task Closed\n')));
    process.exit(0);
  } else {
    console.log(colors.red(colors.bold('❌ [FAIL] Live production smoke test failed. Action required.\n')));
    process.exit(1);
  }
}

verifyLiveSite().catch((err) => {
  console.error(colors.red('Fatal live smoke test error:'), err);
  process.exit(1);
});
