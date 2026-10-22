const fs = require('fs');
const path = require('path');
const ieltsPath = path.join(__dirname, '..', 'ielts', 'ielts_vocab.json');
const ieltsVocab = JSON.parse(fs.readFileSync(ieltsPath, 'utf8'));

const moreIelts = [
  {
    id: "iv_108",
    difficulty: "하",
    word: "acquire",
    pos: "v.",
    meaning: "습득하다, 획득하다",
    synonym: "gain, obtain, master",
    example: "Children acquire second languages effortlessly through immersive daily exposure.",
    translation: "어린이들은 몰입형 일상 노출을 통해 제2언어를 수월하게 습득한다.",
    meaning_en: "gain, obtain, master",
    meaning_zh: "获得；学到",
    translation_zh: "儿童通过沉浸式的日常语言接触能够轻松习得第二语言。"
  },
  {
    id: "iv_109",
    difficulty: "중",
    word: "comprehensive",
    pos: "adj.",
    meaning: "포괄적인, 종합적인",
    synonym: "extensive, thorough, exhaustive",
    example: "The guidebook presents a comprehensive overview of university enrollment policies.",
    translation: "안내서는 대학교 입학 정책에 대한 포괄적인 개요를 제시한다.",
    meaning_en: "extensive, thorough, exhaustive",
    meaning_zh: "全面的；综合的",
    translation_zh: "该指导手册全面概述了各高校的招生录取政策。"
  },
  {
    id: "iv_110",
    difficulty: "중",
    word: "diversity",
    pos: "n.",
    meaning: "다양성, 포용성",
    synonym: "variety, multiplicity, divergence",
    example: "Cultural diversity enriches academic discussions across tertiary institutions.",
    translation: "문화적 다양성은 고등 교육 기관 전반의 학술 토론을 풍요롭게 한다.",
    meaning_en: "variety, multiplicity, divergence",
    meaning_zh: "多样性；多元化",
    translation_zh: "文化多元化丰富了各类高等院校内的学术讨论氛围。"
  },
  {
    id: "iv_111",
    difficulty: "상",
    word: "predominant",
    pos: "adj.",
    meaning: "지배적인, 두드러진",
    synonym: "dominant, prevailing, primary",
    example: "English serves as the predominant language of international scientific publication.",
    translation: "영어는 국제 과학 출판물에서 지배적인 언어로 기능한다.",
    meaning_en: "dominant, prevailing, primary",
    meaning_zh: "占主导地位的；显著的",
    translation_zh: "英语在国际学术科学出版领域占据着主导地位。"
  },
  {
    id: "iv_112",
    difficulty: "상",
    word: "synthesize",
    pos: "v.",
    meaning: "종합하다, 합성하다",
    synonym: "integrate, blend, combine",
    example: "Postgraduate candidates must synthesize competing viewpoints within their literature reviews.",
    translation: "대학원 수험생 및 연구자들은 문헌 검토에서 대립하는 관점들을 종합해야 한다.",
    meaning_en: "integrate, blend, combine",
    meaning_zh: "综合；合成",
    translation_zh: "研究生应在文献综述中系统综合各类相互竞争的学术观点。"
  }
];

const existingWords = new Set(ieltsVocab.map(v => v.word.toLowerCase()));
moreIelts.forEach(item => {
  if (!existingWords.has(item.word.toLowerCase())) {
    ieltsVocab.push(item);
    existingWords.add(item.word.toLowerCase());
  }
});

fs.writeFileSync(ieltsPath, JSON.stringify(ieltsVocab, null, 2), 'utf8');
console.log(`✅ IELTS Vocab updated to: ${ieltsVocab.length}`);
