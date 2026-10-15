const fs = require('fs');

const hskVocab = JSON.parse(fs.readFileSync('./vocab/hsk5_core_vocabulary.json', 'utf8'));
const hskGrammar = JSON.parse(fs.readFileSync('./vocab/hsk5_grammar.json', 'utf8'));
const hskCloze = JSON.parse(fs.readFileSync('./vocab/hsk5_cloze.json', 'utf8'));
const hskChengyu = JSON.parse(fs.readFileSync('./vocab/hsk5_chengyu.json', 'utf8'));
const hskListening = JSON.parse(fs.readFileSync('./vocab/hsk5_listening.json', 'utf8'));

const ieltsVocab = [{"id":"iv_1","word":"ubiquitous","synonym":"omnipresent","meaning":"어디에나 있는","pos":"adj","example":"Mobile phones are ubiquitous.","translation":"휴대폰은 어디에나 있다.","difficulty":"상"}];
const ieltsListening = [];
const ieltsIdioms = [];
const ieltsCloze = [];
const ieltsGrammar = [];

const outObj = {
  hsk: {
    vocab: hskVocab,
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
fs.writeFileSync('./vocab_data.js', fileStr, 'utf8');
console.log("vocab_data.js successfully rebuilt!");
