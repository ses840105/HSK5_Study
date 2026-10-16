const fs = require('fs');
const path = require('path');

// 1. HSK 5급 데이터 로딩
const hskVocab = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_core_vocabulary.json'), 'utf8'));
const hskColloc = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_collocations.json'), 'utf8'));
const hskGrammar = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_grammar.json'), 'utf8'));
const hskCloze = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_cloze.json'), 'utf8'));
const hskChengyu = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_chengyu.json'), 'utf8'));
const hskListening = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab', 'hsk5_listening.json'), 'utf8'));

// 2. IELTS 영어 데이터 로딩
const ieltsVocab = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_vocab.json'), 'utf8'));
const ieltsListening = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_listening.json'), 'utf8'));
const ieltsIdioms = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_idioms.json'), 'utf8'));
const ieltsCloze = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_cloze.json'), 'utf8'));
const ieltsGrammar = JSON.parse(fs.readFileSync(path.join(__dirname, 'ielts', 'ielts_grammar.json'), 'utf8'));

const outObj = {
  hsk: {
    vocab: hskVocab,
    colloc: hskColloc,
    grammar: hskGrammar,
    cloze: hskCloze,
    chengyu: hskChengyu,
    listening: hskListening
  },
  ielts: {
    vocab: ieltsVocab,
    listening: ieltsListening,
    idioms: ieltsIdioms,
    cloze: ieltsCloze,
    grammar: ieltsGrammar
  }
};

const fileStr = 'window.APP_DATA = ' + JSON.stringify(outObj, null, 2) + ';';
fs.writeFileSync(path.join(__dirname, 'vocab_data.js'), fileStr, 'utf8');

console.log('✅ vocab_data.js successfully rebuilt with complete HSK & IELTS datasets!');
console.log(`📊 Stats:`);
console.log(`   [HSK] Vocab: ${hskVocab.length}, Colloc: ${hskColloc.length}, Grammar: ${hskGrammar.length}, Cloze: ${hskCloze.length}, Chengyu: ${hskChengyu.length}, Listening: ${hskListening.length}`);
console.log(`   [IELTS] Vocab: ${ieltsVocab.length}, Listening: ${ieltsListening.length}, Idioms: ${ieltsIdioms.length}, Cloze: ${ieltsCloze.length}, Grammar: ${ieltsGrammar.length}`);
