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

// 3. New HSK 3.0 다등급(1, 2, 3, 4, 6, 7-9급) 데이터 로딩
const loadLevel = (filename) => {
  const p = path.join(__dirname, 'vocab', 'levels', filename);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
};
const hsk1 = loadLevel('hsk1.json');
const hsk2 = loadLevel('hsk2.json');
const hsk3 = loadLevel('hsk3.json');
const hsk4 = loadLevel('hsk4.json');
const hsk6 = loadLevel('hsk6.json');
const hsk7_9 = loadLevel('hsk7-9.json');

const outObj = {
  hsk: {
    vocab: hskVocab,
    colloc: hskColloc,
    grammar: hskGrammar,
    cloze: hskCloze,
    chengyu: hskChengyu,
    listening: hskListening,
    dictation: hskDictation,
    reading: hskReading
  },
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
    "5": {
      vocab: hskVocab,
      colloc: hskColloc,
      grammar: hskGrammar,
      cloze: hskCloze,
      chengyu: hskChengyu,
      listening: hskListening,
      dictation: hskDictation,
      reading: hskReading
    },
    "6": hsk6,
    "7-9": hsk7_9
  }
};

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

