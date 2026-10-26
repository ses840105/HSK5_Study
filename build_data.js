const fs = require('fs');
const path = require('path');

// 1. HSK 5급 데이터 로딩
const hskVocab = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_core_vocabulary.json'), 'utf8'));
const hskColloc = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_collocations.json'), 'utf8'));
const hskGrammar = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_grammar.json'), 'utf8'));
const hskCloze = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_cloze.json'), 'utf8'));
const hskChengyu = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_chengyu.json'), 'utf8'));
const hskListening = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_listening.json'), 'utf8'));
const hskDictation = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_dictation.json'), 'utf8'));
const hskReading = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_reading.json'), 'utf8'));

// 2. IELTS 영어 데이터 로딩
const ieltsVocab = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_vocab.json'), 'utf8'));
const ieltsListening = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_listening.json'), 'utf8'));
const ieltsIdioms = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_idioms.json'), 'utf8'));
const ieltsCloze = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_cloze.json'), 'utf8'));
const ieltsGrammar = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_grammar.json'), 'utf8'));
const ieltsDictation = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_dictation.json'), 'utf8'));
const ieltsReading = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_reading.json'), 'utf8'));

// 3. New HSK 3.0 다등급(1, 2, 3, 4, 5, 6, 7-9급) 데이터 로딩 및 hsk5.json 동기화
const mergeItemLists = (baseList = [], patchList = []) => {
  if (!Array.isArray(patchList) || patchList.length === 0) return Array.isArray(baseList) ? [...baseList] : [];
  const result = Array.isArray(baseList) ? [...baseList] : [];
  const keyOf = (it) => it && (it.id || it.word || it.chengyu || it.idiom || it.question || it.sentence || '');
  const idxMap = new Map();
  result.forEach((it, idx) => {
    const k = keyOf(it);
    if (k) idxMap.set(k, idx);
  });
  patchList.forEach((it) => {
    if (!it || typeof it !== 'object') return;
    const k = keyOf(it);
    if (k && idxMap.has(k)) {
      result[idxMap.get(k)] = { ...result[idxMap.get(k)], ...it };
    } else {
      if (k) idxMap.set(k, result.length);
      result.push(it);
    }
  });
  return result;
};

const mergeDatasetObj = (baseObj = {}, patchObj = {}) => {
  if (!patchObj || typeof patchObj !== 'object') return baseObj;
  const merged = { ...baseObj };
  Object.keys(patchObj).forEach((modeKey) => {
    if (Array.isArray(patchObj[modeKey])) {
      merged[modeKey] = mergeItemLists(merged[modeKey] || [], patchObj[modeKey]);
    }
  });
  return merged;
};

const loadLevel = (filename) => {
  const p = path.join(__dirname, 'vocab', 'levels', filename);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
};

const hsk5Base = {
  vocab: hskVocab,
  colloc: hskColloc,
  grammar: hskGrammar,
  cloze: hskCloze,
  chengyu: hskChengyu,
  listening: hskListening,
  dictation: hskDictation,
  reading: hskReading
};
const hsk5LevelFile = path.join(__dirname, 'vocab', 'levels', 'hsk5.json');
const hsk5FromLevelDir = loadLevel('hsk5.json');
const hsk5Merged = hsk5FromLevelDir ? mergeDatasetObj(hsk5Base, hsk5FromLevelDir) : hsk5Base;
fs.writeFileSync(hsk5LevelFile, JSON.stringify(hsk5Merged, null, 2), 'utf8');

const hsk1 = loadLevel('hsk1.json');
const hsk2 = loadLevel('hsk2.json');
const hsk3 = loadLevel('hsk3.json');
const hsk4 = loadLevel('hsk4.json');
const hsk6 = loadLevel('hsk6.json');
const hsk7_9 = loadLevel('hsk7-9.json');

const outObj = {
  hsk: hsk5Merged,
  ielts: {
    vocab: ieltsVocab,
    listening: ieltsListening,
    idioms: ieltsIdioms,
    cloze: ieltsCloze,
    grammar: ieltsGrammar,
    dictation: ieltsDictation,
    reading: ieltsReading
  },
  hskLevels: {
    "1": hsk1,
    "2": hsk2,
    "3": hsk3,
    "4": hsk4,
    "5": hsk5Merged,
    "6": hsk6,
    "7-9": hsk7_9
  }
};

// 4. vocab/custom_questions.json (사용자 문제/해설 추가 전용 JSON) 자동 병합
const customQuestionsPath = path.join(__dirname, 'vocab', 'custom_questions.json');
if (fs.existsSync(customQuestionsPath)) {
  try {
    const customJson = JSON.parse(fs.readFileSync(customQuestionsPath, 'utf8'));
    if (customJson && customJson.hskLevels) {
      Object.keys(customJson.hskLevels).forEach((lv) => {
        if (outObj.hskLevels[lv]) {
          outObj.hskLevels[lv] = mergeDatasetObj(outObj.hskLevels[lv], customJson.hskLevels[lv]);
        }
      });
      outObj.hsk = outObj.hskLevels["5"];
    }
    if (customJson && customJson.ielts) {
      outObj.ielts = mergeDatasetObj(outObj.ielts, customJson.ielts);
    }
  } catch (e) {
    console.warn('⚠️ custom_questions.json 병합 중 경고:', e.message);
  }
}

const fileStr =
  '// HSK 3.0 (1~6/7-9급) & IELTS 통합 다국어 데이터 번들 (CORS 제한 없는 즉시 로딩 지원)\n' +
  'window.HSK5_DATA = ' + JSON.stringify(outObj.hsk, null, 2) + ';\n' +
  'window.HSK_LEVELS_DATA = ' + JSON.stringify(outObj.hskLevels, null, 2) + ';\n' +
  'window.IELTS_DATA = ' + JSON.stringify(outObj.ielts, null, 2) + ';\n' +
  'window.APP_DATA = ' + JSON.stringify(outObj, null, 2) + ';\n';
fs.writeFileSync(path.join(__dirname, 'vocab_data.js'), fileStr, 'utf8');

console.log('✅ vocab_data.js successfully rebuilt with complete New HSK 3.0 & IELTS datasets!');
console.log(`📊 Stats:`);
console.log(`   [HSK5] Vocab: ${hskVocab.length}, Colloc: ${hskColloc.length}, Grammar: ${hskGrammar.length}, Cloze: ${hskCloze.length}, Chengyu: ${hskChengyu.length}, Listening: ${hskListening.length}, Dictation: ${hskDictation.length}, Reading: ${hskReading.length}`);
for (const [lvl, data] of Object.entries(outObj.hskLevels)) {
  if (data) {
    const total = Object.values(data).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);
    console.log(`   [New HSK ${lvl}급] Total ${total} items (Vocab: ${data.vocab?.length || 0}, Grammar: ${data.grammar?.length || 0}, Listening: ${data.listening?.length || 0})`);
  }
}
console.log(`   [IELTS] Vocab: ${ieltsVocab.length}, Listening: ${ieltsListening.length}, Idioms: ${ieltsIdioms.length}, Cloze: ${ieltsCloze.length}, Grammar: ${ieltsGrammar.length}, Dictation: ${ieltsDictation.length}, Reading: ${ieltsReading.length}`);

