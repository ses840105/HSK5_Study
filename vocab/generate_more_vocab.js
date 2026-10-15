const fs = require('fs');
const path = require('path');

const vocabFile = path.join(__dirname, 'hsk5_core_vocabulary.json');
let vocabData = JSON.parse(fs.readFileSync(vocabFile, 'utf8'));

const newVocab = [
  {"id": "v_101", "word": "把握", "pinyin": "bǎwò", "meaning": "파악하다, 장악하다", "pos": "동사", "difficulty": "중", "example": "把握机会。"},
  {"id": "v_102", "word": "包含", "pinyin": "bāohán", "meaning": "포함하다", "pos": "동사", "difficulty": "상", "example": "这包含了很多内容。"},
  {"id": "v_103", "word": "必然", "pinyin": "bìrán", "meaning": "필연적인", "pos": "형용사", "difficulty": "중", "example": "这是必然的结果。"},
  {"id": "v_104", "word": "财产", "pinyin": "cáichǎn", "meaning": "재산", "pos": "명사", "difficulty": "중", "example": "保护个人财产。"},
  {"id": "v_105", "word": "采取", "pinyin": "cǎiqǔ", "meaning": "채택하다, 취하다", "pos": "동사", "difficulty": "상", "example": "采取有效措施。"},
  {"id": "v_106", "word": "导致", "pinyin": "dǎozhì", "meaning": "초래하다, 야기하다", "pos": "동사", "difficulty": "상", "example": "导致严重的后果。"},
  {"id": "v_107", "word": "繁荣", "pinyin": "fánróng", "meaning": "번영하다", "pos": "형용사", "difficulty": "상", "example": "经济繁荣。"},
  {"id": "v_108", "word": "妨碍", "pinyin": "fáng'ài", "meaning": "방해하다", "pos": "동사", "difficulty": "상", "example": "不要妨碍别人。"},
  {"id": "v_109", "word": "广泛", "pinyin": "guǎngfàn", "meaning": "광범위한", "pos": "형용사", "difficulty": "중", "example": "广泛的兴趣。"},
  {"id": "v_110", "word": "核心", "pinyin": "héxīn", "meaning": "핵심", "pos": "명사", "difficulty": "중", "example": "核心问题。"}
];

const existingIds = new Set(vocabData.map(v => v.id));
newVocab.forEach(v => {
    if (!existingIds.has(v.id)) {
        vocabData.push(v);
    }
});

fs.writeFileSync(vocabFile, JSON.stringify(vocabData, null, 2), 'utf8');
console.log("Added 10 new advanced words to hsk5_core_vocabulary.json");
