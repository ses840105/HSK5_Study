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

// 3-B. JLPT 일본어 능력시험 (N5~N1) 데이터 생성 및 로딩
const jlptDir = path.join(__dirname, 'jlpt');
const jlptLevelsDir = path.join(jlptDir, 'levels');
if (!fs.existsSync(jlptDir)) fs.mkdirSync(jlptDir, { recursive: true });
if (!fs.existsSync(jlptLevelsDir)) fs.mkdirSync(jlptLevelsDir, { recursive: true });

const defaultJlptLevels = {
  N5: {
    vocab: [
      { id: "jlpt_n5_v1", word: "約束", pinyin: "やくそく (yakusoku)", pos: "명사·스루동사", meaning: "약속", meaning_en: "promise; appointment", meaning_zh: "约定；诺言", example: "友達と映画を見る約束をしました。", translation: "친구와 영화를 보기로 약속했습니다.", collocation: "約束を守る (약속을 지키다)", explanation: "JLPT N5 필수 명사/동사로 '約束を守る(약속을 지키다)', '約束を破る(약속을 어기다)'로 자주 출제됩니다.", difficulty: "하" },
      { id: "jlpt_n5_v2", word: "準備", pinyin: "じゅんび (junbi)", pos: "명사·스루동사", meaning: "준비", meaning_en: "preparation", meaning_zh: "准备", example: "旅行の準備はもう終わりましたか。", translation: "여행 준비는 벌써 끝났습니까?", collocation: "準備をする (준비를 하다)", explanation: "출발이나 시험 전에 미리 갖추는 준비를 뜻합니다.", difficulty: "하" },
      { id: "jlpt_n5_v3", word: "便利", pinyin: "べんり (benri)", pos: "나형용사", meaning: "편리함, 편리하다", meaning_en: "convenient; handy", meaning_zh: "方便；便利", example: "この駅の近くはとても便利です。", translation: "이 역 근처는 매우 편리합니다.", collocation: "便利な生活 (편리한 생활)", explanation: "명사를 수식할 때 '便利な + 명사' 형태를 취하는 대표 나형용사입니다.", difficulty: "하" },
      { id: "jlpt_n5_v4", word: "図書館", pinyin: "としょかん (toshokan)", pos: "명사", meaning: "도서관", meaning_en: "library", meaning_zh: "图书馆", example: "毎日図書館で日本語を勉強します。", translation: "매일 도서관에서 일본어를 공부합니다.", collocation: "図書館で本を借りる (도서관에서 책을 빌리다)", explanation: "장소 조사는 동작이 일어나는 곳이므로 'で'를 사용합니다.", difficulty: "중" },
      { id: "jlpt_n5_v5", word: "大切", pinyin: "たいせつ (taisetsu)", pos: "나형용사", meaning: "소중함, 중요하다", meaning_en: "important; precious", meaning_zh: "重要；珍贵", example: "健康は何보다も大切です。", translation: "건강은 무엇보다도 소중합니다.", collocation: "時間を大切にする (시간을 소중히 하다)", explanation: "'大切にする(소중히 여기다)' 구문으로 빈출됩니다.", difficulty: "중" },
      { id: "jlpt_n5_v6", word: "経験", pinyin: "けいけん (keiken)", pos: "명사·스루동사", meaning: "경험", meaning_en: "experience", meaning_zh: "经验；经历", example: "日本でいい経験をたくさんしました。", translation: "일본에서 좋은 경험을 많이 했습니다.", collocation: "経験を積む (경험을 쌓다)", explanation: "N5~N4 독해 및 청해 기본 어휘입니다.", difficulty: "상" }
    ],
    grammar: [
      { id: "jlpt_n5_g1", difficulty: "하", category: "～てください (정중한 요청)", question: "ここに名前と住所を ( ___ ) ください。", options: ["書いて", "書いた", "書く", "書き"], answer: 1, example: "ここに名前と住所を書いてください。", translation: "여기에 이름과 주소를 적어 주세요.", explanation: "동사 て형 + ください는 상대방에게 정중하게 부탁하거나 지시할 때 사용합니다. 書く의 て형은 書いて입니다." },
      { id: "jlpt_n5_g2", difficulty: "중", category: "～たことがあります (경험 표현)", question: "私は一度だけ北海道へ ( ___ ) ことがあります。", options: ["行った", "行く", "行って", "行き"], answer: 1, example: "私は一度だけ北海道へ行ったことがあります。", translation: "나는 한 번만 홋카이도에 가 본 적이 있습니다.", explanation: "과거의 경험을 나타낼 때는 [동사 た형 + ことがあります]를 사용합니다. 行く의 불규칙 음편형 行った에 유의하세요." },
      { id: "jlpt_n5_g3", difficulty: "상", category: "～ないでください (금지 요청)", question: "美術館の中では写真を ( ___ ) ください。", options: ["撮らないで", "撮らなくて", "撮らない", "撮らず"], answer: 1, example: "美術館の中では写真を撮らないでください。", translation: "미술관 안에서는 사진을 찍지 말아 주세요.", explanation: "[동사 ない형 + でください]는 '~하지 말아 주세요'라는 정중한 금지 표현입니다." }
    ],
    listening: [
      { id: "jlpt_n5_l1", difficulty: "하", category: "약속 시간 확인", dialogue: [{ speaker: "남", text: "明日のパーティーは何時からですか。" }, { speaker: "여", text: "午後六時からです。五時五十分には来てくださいね。" }], question: "男の人は何時までに来なければなりませんか。", options: ["5時50分", "6時00分", "6時10分", "5時30分"], answer: "5時50分", audioText: "男：明日のパーティーは何時からですか。 女：午後六時からです。五時五十分には来てくださいね。 質問：男の人は何時までに来なければなりませんか。", translation: "남: 내일 파티는 몇 시부터입니까? / 여: 오후 6시부터입니다. 5시 50분에는 와 주세요.", tip: "파티 시작 시각(6시)과 실제로 도착해야 하는 시각(5시 50분)을 구분하는 전형적인 N5 청해 문제입니다." },
      { id: "jlpt_n5_l2", difficulty: "중", category: "물건 위치 파악", dialogue: [{ speaker: "여", text: "すみません、私の眼鏡を知りませんか。" }, { speaker: "남", text: "さっきテレビの上で見ましたよ。" }], question: "眼鏡はどこにありますか。", options: ["テレビの上", "机の上", "かばんの中", "椅子の下"], answer: "テレビの上", audioText: "女：すみません、私の眼鏡を知りませんか。 男：さっきテレビの上で見ましたよ。 質問：眼鏡はどこにありますか。", translation: "여: 저기요, 제 안경 못 보셨나요? / 남: 아까 텔레비전 위에서 봤어요.", tip: "위치 명사 上(위), 下(아래), 中(안), 隣(옆)을 정확히 청취하세요." }
    ],
    idioms: [
      { id: "jlpt_n5_i1", idiom: "気がつく", chengyu: "気がつく", pinyin: "きがつく (ki ga tsuku)", meaning: "눈치채다, 깨닫다", sentence: "忘れ物に ____ すぐ家へ戻りました。", example: "忘れ物に気がついてすぐ家へ戻りました。", translation: "놓고 온 물건을 깨닫고 바로 집으로 돌아갔습니다.", explanation: "'気(기분/정신)'를 활용한 기초 필수 관용구입니다.", difficulty: "하" },
      { id: "jlpt_n5_i2", idiom: "口に合う", chengyu: "口に合う", pinyin: "くちにあう (kuchi ni au)", meaning: "입맛에 맞다", sentence: "日本の料理はあなたの ____ か。", example: "日本の料理はあなたの口に合いますか。", translation: "일본 요리는 당신 입맛에 맞습니까?", explanation: "음식이나 취향이 맞을 때 쓰는 자연스러운 회화 관용표현입니다.", difficulty: "중" }
    ],
    cloze: [
      { id: "jlpt_n5_c1", difficulty: "하", sentence: "毎朝、公園を ____ してから会社へ行きます。", options: ["散歩", "勉強", "洗濯", "掃除"], answer: "散歩", pinyin: "さんぽ (sanpo)", collocation: "公園を散歩する (공원을 산책하다)", translation: "매일 아침 공원을 산책하고 나서 회사에 갑니다.", explanation: "이동의 경유지·장소를 나타내는 조사 'を'와 결합하는 대표 동사는 '散歩する'입니다." }
    ],
    reading: [
      { id: "jlpt_n5_r1", difficulty: "하", category: "안내문 독해", title: "図書館のお知らせ", passage: "来週の月曜日から水曜日まで、図書館の工事があります。\nそのため、本を借りることができません。\n木曜日からはいつも通り午前九時から開きます。", question: "いつから本を借りることができますか。", options: ["木曜日から", "月曜日から", "火曜日から", "水曜日から"], answer: "木曜日から", keySentence: "木曜日からはいつも通り午前九時から開きます。", collocation: "本を借りる (책을 빌리다)", translation: "다음 주 월요일부터 수요일까지 도서관 공사가 있습니다. 그 때문에 책을 빌릴 수 없습니다. 목요일부터는 평소대로 오전 9시부터 엽니다.", explanation: "월~수요일은 공사 기간이며 목요일(木曜日)부터 정상 운영됩니다." }
    ],
    dictation: [
      { id: "jlpt_n5_d1", difficulty: "하", sentence: "日本語の勉強はとても楽しいです。", pinyin: "にほんごのべんきょうはとてもたのしいです", keyPoint: "[JLPT N5] 조사 の·は 및 い형용사 정중형", translation: "일본어 공부는 매우 즐겁습니다." }
    ]
  },
  N4: {
    vocab: [
      { id: "jlpt_n4_v1", word: "連絡", pinyin: "れんらく (renraku)", pos: "명사·스루동사", meaning: "연락", meaning_en: "contact; communication", meaning_zh: "联系；联络", example: "駅に着いたら、すぐ連絡してください。", translation: "역에 도착하면 바로 연락해 주세요.", collocation: "連絡を取る (연락을 취하다)", explanation: "비즈니스와 일상 회화 모두에서 최빈출되는 N4 핵심 어휘입니다.", difficulty: "하" },
      { id: "jlpt_n4_v2", word: "相談", pinyin: "そうだん (soudan)", pos: "명사·스루동사", meaning: "상담, 상의", meaning_en: "consultation; discussion", meaning_zh: "商量；咨询", example: "将来のことについて先生に相談しました。", translation: "장래 문제에 대해 선생님께 상담했습니다.", collocation: "先生に相談する (선생님께 상담하다)", explanation: "상담 대상에는 조사 'に' 또는 'と'를 사용합니다.", difficulty: "하" },
      { id: "jlpt_n4_v3", word: "習慣", pinyin: "しゅうかん (shuukan)", pos: "명사", meaning: "습관, 관습", meaning_en: "custom; habit", meaning_zh: "习惯；风俗", example: "早起きするのが私の習慣です。", translation: "일찍 일어나는 것이 제 습관입니다.", collocation: "習慣を身につける (습관을 기르다)", explanation: "개인의 버릇이나 사회적 풍습 모두에 쓰입니다.", difficulty: "중" },
      { id: "jlpt_n4_v4", word: "丁寧", pinyin: "ていねい (teinei)", pos: "나형용사", meaning: "정중함, 꼼꼼함", meaning_en: "polite; careful", meaning_zh: "礼貌；仔细", example: "彼女はいつも丁寧な言葉を使います。", translation: "그녀는 언제나 정중한 말을 사용합니다.", collocation: "丁寧に説明する (정중하고 꼼꼼하게 설명하다)", explanation: "말투가 공손하거나 일처리가 정성스러울 때 모두 사용됩니다.", difficulty: "중" },
      { id: "jlpt_n4_v5", word: "複雑", pinyin: "ふくざつ (fukuzatsu)", pos: "나형용사", meaning: "복잡함", meaning_en: "complex; complicated", meaning_zh: "复杂", example: "東京の地下鉄の路線はとても複雑です。", translation: "도쿄 지하철 노선은 매우 복잡합니다.", collocation: "複雑な問題 (복잡한 문제)", explanation: "반의어는 簡単(かんたん, 간단함) 또는 単純(たんじゅん, 단순함)입니다.", difficulty: "상" }
    ],
    grammar: [
      { id: "jlpt_n4_g1", difficulty: "하", category: "～ようにする (습관적 노력)", question: "健康のために、毎日野菜を ( ___ ) ようにしています。", options: ["食べる", "食べた", "食べて", "食べよう"], answer: 1, example: "健康のために、毎日野菜を食べるようにしています。", translation: "건강을 위해 매일 채소를 먹도록 노력하고 있습니다.", explanation: "[동사 사전형/ない형 + ようにする]는 습관적으로 '~하도록 노력하다/유의하다'를 뜻합니다." },
      { id: "jlpt_n4_g2", difficulty: "중", category: "～ようになる (능력·상태의 변화)", question: "日本に来て半年で、日本語の新聞が ( ___ ) ようになりました。", options: ["読める", "読んだ", "読んで", "読み"], answer: 1, example: "日本に来て半年で、日本語の新聞が読めるようになりました。", translation: "일본에 온 지 반년 만에 일본어 신문을 읽을 수 있게 되었습니다.", explanation: "[가능동사/사전형 + ようになる]는 불가능하던 것이 가능해지거나 새로운 습관이 형성된 변화를 나타냅니다." }
    ],
    listening: [
      { id: "jlpt_n4_l1", difficulty: "중", category: "교통수단 선택", dialogue: [{ speaker: "남", text: "空港までバスで行きますか、電車で行きますか。" }, { speaker: "여", text: "バスは道が混むかもしれませんから、電車で行きましょう。" }], question: "二人は何で空港へ行きますか。", options: ["電車", "バス", "タクシー", "車"], answer: "電車", audioText: "男：空港までバスで行きますか、電車で行きますか。 女：バスは道が混むかもしれませんから、電車で行きましょう。 質問：二人は何で空港へ行きますか。", translation: "남: 공항까지 버스로 갈까요, 전철로 갈까요? / 여: 버스는 길이 막힐지도 모르니까 전철로 가요.", tip: "'道が混む(길이 막히다)' 때문에 버스를 포기하고 전철(電車)을 선택했습니다." }
    ],
    idioms: [
      { id: "jlpt_n4_i1", idiom: "間に合う", chengyu: "間に合う", pinyin: "まにあう (ma ni au)", meaning: "시간에 대다, 늦지 않다", sentence: "今から走れば、終電に ____ かもしれません。", example: "今から走れば、終電に間に合うかもしれません。", translation: "지금부터 뛰면 막차에 늦지 않을지도 모릅니다.", explanation: "시간이나 기한에 늦지 않을 때 쓰는 필수 표현입니다.", difficulty: "중" }
    ],
    cloze: [
      { id: "jlpt_n4_c1", difficulty: "중", sentence: "明日の会議の資料を ____ しておいてください。", options: ["用意", "見物", "故障", "遠慮"], answer: "用意", pinyin: "ようい (youi)", collocation: "資料を用意する (자료를 준비하다)", translation: "내일 회의 자료를 미리 준비해 두세요.", explanation: "'～ておく(미리 ~해 두다)'와 가장 자연스럽게 호응하는 단어는 用意(준비)입니다." }
    ],
    reading: [
      { id: "jlpt_n4_r1", difficulty: "중", category: "이메일 독해", title: "会議室の場所変更について", passage: "営業部の皆様へ\n明日の午後二時からの会議ですが、エアコンの故障のため、第一会議室から第三会議室に変更になりました。\n時間は変わりませんので、遅れないように集まってください。", question: "明日の会議はどうなりましたか。", options: ["場所だけ変わった", "時間だけ変わった", "場所も時間も変わった", "会議が中止になった"], answer: "場所だけ変わった", keySentence: "第一会議室から第三会議室に変更になりました。時間は変わりません", collocation: "場所変更 (장소 변경)", translation: "영업부 여러분께. 내일 오후 2시부터 열리는 회의는 에어컨 고장으로 인해 제1회의실에서 제3회의실로 변경되었습니다. 시간은 변함없으니 늦지 않게 모여 주십시오.", explanation: "회의실 장소만 제1회의실에서 제3회의실로 바뀌었고 시간은 그대로입니다." }
    ],
    dictation: [
      { id: "jlpt_n4_d1", difficulty: "중", sentence: "駅に着いたら、すぐ電話してください。", pinyin: "えきについたら、すぐでんわしてください", keyPoint: "[JLPT N4] 가정·조건 ～たら + ～てください", translation: "역에 도착하면 바로 전화해 주세요." }
    ]
  },
  N3: {
    vocab: [
      { id: "jlpt_n3_v1", word: "影響", pinyin: "えいきょう (eikyou)", pos: "명사·스루동사", meaning: "영향", meaning_en: "influence; effect", meaning_zh: "影响", example: "台風の影響で電車が遅れています。", translation: "태풍의 영향으로 전철이 지연되고 있습니다.", collocation: "影響を与える (영향을 주다) / 影響を受ける (영향을 받다)", explanation: "JLPT N3~N2 독해·청해 최빈출 단어로, '影響を与える/受ける' 연어를 반드시 암기하세요.", difficulty: "하" },
      { id: "jlpt_n3_v2", word: "確認", pinyin: "かくにん (kakunin)", pos: "명사·스루동사", meaning: "확인", meaning_en: "confirmation; verification", meaning_zh: "确认", example: "送信する前に、もう一度内容を確認してください。", translation: "전송하기 전에 다시 한번 내용을 확인해 주세요.", collocation: "内容を確認する (내용을 확인하다)", explanation: "비즈니스 이메일 및 안내문에서 빠지지 않고 등장하는 필수 어휘입니다.", difficulty: "하" },
      { id: "jlpt_n3_v3", word: "積極的", pinyin: "せっきょくてき (sekkyokuteki)", pos: "나형용사", meaning: "적극적", meaning_en: "proactive; positive", meaning_zh: "积极的", example: "彼は会議でいつも積極的に意見を言います。", translation: "그는 회의에서 항상 적극적으로 의견을 말합니다.", collocation: "積極的に参加する (적극적으로 참가하다)", explanation: "반의어는 消極的(しょうきょくてき, 소극적)입니다.", difficulty: "중" },
      { id: "jlpt_n3_v4", word: "工夫", pinyin: "くふう (kufuu)", pos: "명사·스루동사", meaning: "궁리, 고안, 아이디어", meaning_en: "devising; ingenuity", meaning_zh: "想办法；下功夫", example: "狭い部屋を広く使うためにいろいろ工夫しています。", translation: "좁은 방을 넓게 쓰기 위해 여러모로 궁리하고 있습니다.", collocation: "工夫を凝らす (아이디어를 짜내다)", explanation: "한국어 한자 '공부(勉強)'가 아니라 '좋은 방법을 궁리·고안함'을 뜻하는 주의 어휘입니다!", difficulty: "중" },
      { id: "jlpt_n3_v5", word: "我慢", pinyin: "がまん (gaman)", pos: "명사·스루동사", meaning: "참음, 인내", meaning_en: "patience; endurance", meaning_zh: "忍耐；克制", example: "歯が痛かったけれど、最後まで我慢しました。", translation: "이가 아팠지만 끝까지 참았습니다.", collocation: "痛みを我慢する (통증을 참다)", explanation: "한국어의 '거만(傲慢, ごうまん)'과 한자는 같으나 일본어에서는 '인내하다/참다'라는 뜻입니다!", difficulty: "상" }
    ],
    grammar: [
      { id: "jlpt_n3_g1", difficulty: "하", category: "～おかげで (덕분에)", question: "先生が親切に教えてくれた ( ___ )、試験に合格できました。", options: ["おかげで", "せいで", "くせに", "あまり"], answer: 1, example: "先生が親切に教えてくれたおかげで、試験に合格できました。", translation: "선생님께서 친절히 가르쳐 주신 덕분에 시험에 합격할 수 있었습니다.", explanation: "긍정적인 결과의 원인을 말할 때는 '～おかげで(덕분에)', 부정적인 결과의 원인은 '～せいで(탓에)'를 씁니다." },
      { id: "jlpt_n3_g2", difficulty: "중", category: "～ことにする (자발적 결정)", question: "来月から健康のために毎日歩く ( ___ ) にしました。", options: ["こと", "もの", "ところ", "わけ"], answer: 1, example: "来月から健康のために毎日歩くことにしました。", translation: "다음 달부터 건강을 위해 매일 걷기로 결정했습니다.", explanation: "주어 자신의 의지로 결심을 내릴 때는 [동사 사전형 + ことにする], 외부 규칙/결정은 [ことになる]를 씁니다." },
      { id: "jlpt_n3_g3", difficulty: "상", category: "～とは限らない (반드시 ~라고만은 할 수 없다)", question: "高いものが必ずしもいいものだ ( ___ )。", options: ["とは限らない", "に違いない", "ざるを得ない", "しかない"], answer: 1, example: "高いものが必ずしもいいものだとは限らない。", translation: "비싼 것이 반드시 좋은 것이라고만은 할 수 없다.", explanation: "부사 '必ずしも(반드시 ~인 것은)'와 호응하여 부분 부정을 나타내는 N3 핵심 문형입니다." }
    ],
    listening: [
      { id: "jlpt_n3_l1", difficulty: "중", category: "일정 변경 조율", dialogue: [{ speaker: "여", text: "来週の打ち合わせですが、木曜日の午後はいかがですか。" }, { speaker: "남", text: "すみません、木曜日は一日中出張なんです。金曜日の午前中なら空いていますが。" }, { speaker: "여", text: "では、そうしましょう。" }], question: "打ち合わせはいつになりましたか。", options: ["金曜日の午前", "木曜日の午後", "木曜日の午前", "金曜日の午後"], answer: "金曜日の午前", audioText: "女：来週の打ち合わせですが、木曜日の午後はいかがですか。 男：すみません、木曜日は一日中出張なんです。金曜日の午前中なら空いていますが。 女：では、そうしましょう。 質問：打ち合わせはいつになりましたか。", translation: "여: 다음 주 회의 말인데요, 목요일 오후는 어떠신가요? / 남: 죄송합니다, 목요일은 하루 종일 출장입니다. 금요일 오전 중이라면 비어 있는데요. / 여: 그럼 그렇게 합시다.", tip: "'では、そうしましょう(그럼 그렇게 합시다)' 직전에 제안된 '金曜日の午前中'이 정답입니다." }
    ],
    idioms: [
      { id: "jlpt_n3_i1", idiom: "頭が痛い", chengyu: "頭が痛い", pinyin: "あたまがいたい (atama ga itai)", meaning: "골치가 아프다, 고민스럽다", sentence: "最近、売上が減っていて ____ 問題が多い。", example: "最近、売上が減っていて頭が痛い問題が多い。", translation: "최근 매출이 줄어들어 골치 아픈 문제가 많다.", explanation: "실제 두통뿐만 아니라 걱정거리로 골머리를 앓을 때 쓰는 관용구입니다.", difficulty: "중" },
      { id: "jlpt_n3_i2", idiom: "目が回る", chengyu: "目が回る", pinyin: "めがまわる (me ga mawaru)", meaning: "눈코 뜰 새 없이 바쁘다", sentence: "年末は ____ ほど忙しい毎日が続きます。", example: "年末は目が回るほど忙しい毎日が続きます。", translation: "연말은 눈코 뜰 새 없이 바쁜 매일이 이어집니다.", explanation: "'目が回るほど忙しい(어지러울 정도로 바쁘다)' 형태로 자주 출제됩니다.", difficulty: "상" }
    ],
    cloze: [
      { id: "jlpt_n3_c1", difficulty: "중", sentence: "この映画は子供から大人まで幅広く ____ を集めている。", options: ["人気", "元気", "天気", "勇気"], answer: "人気", pinyin: "にんき (ninki)", collocation: "人気を集める (인기를 모으다)", translation: "이 영화는 아이부터 어른까지 폭넓게 인기를 끌고 있다.", explanation: "'人気を集める(인기를 모으다)', '人気がある(인기가 있다)'는 필수 연어입니다." }
    ],
    reading: [
      { id: "jlpt_n3_r1", difficulty: "중", category: "에세이 독해", title: "読書の楽しみ", passage: "以前は本を読むのが苦手で、一ヶ月に一冊も読めませんでした。\nしかし、通勤時間スマートフォンを見る代わりに、好きな小説を少しずつ読むようにしました。\n今では毎週一冊は読み終えるようになり、新しい知識を得る楽しみを知りました。", question: "筆者が本を読めるようになったきっかけは何ですか。", options: ["通勤時間に少しずつ読むようにしたこと", "会社を辞めて時間が増えたこと", "難しい専門書から読み始めたこと", "友達に毎日感想を話したこと"], answer: "通勤時間に少しずつ読むようにしたこと", keySentence: "通勤時間スマートフォンを見る代わりに、好きな小説を少しずつ読むようにしました。", collocation: "～代わりに (~ 대신에)", translation: "예전에는 책 읽는 것이 서툴러 한 달에 한 권도 읽지 못했습니다. 하지만 통근 시간에 스마트폰을 보는 대신 좋아하는 소설을 조금씩 읽도록 했습니다. 지금은 매주 한 권은 다 읽게 되었고 새로운 지식을 얻는 즐거움을 알게 되었습니다.", explanation: "'～代わりに(~ 대신에)'가 포함된 두 번째 문장이 변화의 계기(きっかけ)입니다." }
    ],
    dictation: [
      { id: "jlpt_n3_d1", difficulty: "중", sentence: "台風の影響で電車が遅れています。", pinyin: "たいふうのえいきょうででんしゃがおくれています", keyPoint: "[JLPT N3] 影響で (원인·이유) + 상태 진행", translation: "태풍의 영향으로 전철이 지연되고 있습니다." }
    ]
  },
  N2: {
    vocab: [
      { id: "jlpt_n2_v1", word: "把握", pinyin: "はあく (haaku)", pos: "명사·스루동사", meaning: "파악", meaning_en: "grasp; understanding", meaning_zh: "掌握；把握", example: "まず現状を正確に把握することが重要だ。", translation: "우선 현상을 정확하게 파악하는 것이 중요하다.", collocation: "現状を把握する (현상을 파악하다)", explanation: "JLPT N2 독해·비즈니스 일본어 1순위 빈출 어휘로 '状況/現状/問題点を把握する'로 쓰입니다.", difficulty: "하" },
      { id: "jlpt_n2_v2", word: "対策", pinyin: "たいさく (taisaku)", pos: "명사", meaning: "대책", meaning_en: "countermeasure; strategy", meaning_zh: "对策", example: "少子化に対する具体的な対策が求められている。", translation: "저출산에 대한 구체적인 대책이 요구되고 있다.", collocation: "対策を立てる / 講じる (대책을 세우다 / 강구하다)", explanation: "'対策を立てる(대책을 세우다)', '対策を講じる(대책을 강구하다)' 연어가 빈출됩니다.", difficulty: "하" },
      { id: "jlpt_n2_v3", word: "改善", pinyin: "かいぜん (kaizen)", pos: "명사·스루동사", meaning: "개선", meaning_en: "improvement; betterment", meaning_zh: "改善；改进", example: "労働環境を改善するために新しい制度を導入した。", translation: "노동 환경을 개선하기 위해 새로운 제도를 도입했다.", collocation: "環境を改善する (환경을 개선하다)", explanation: "나쁜 상태나 문제점을 더 좋게 고치는 것을 뜻합니다.", difficulty: "중" },
      { id: "jlpt_n2_v4", word: "貢献", pinyin: "こうけん (kouken)", pos: "명사·스루동사", meaning: "공헌, 기여", meaning_en: "contribution", meaning_zh: "贡献", example: "彼女は地域社会の発展に大きく貢献した。", translation: "그녀는 지역 사회 발전에 크게 공헌했다.", collocation: "社会に貢献する (사회에 공헌하다)", explanation: "조사 'に'와 결합하여 '~에 기여/공헌하다'로 쓰입니다.", difficulty: "중" },
      { id: "jlpt_n2_v5", word: "妥協", pinyin: "だきょう (dakyou)", pos: "명사·스루동사", meaning: "타협", meaning_en: "compromise", meaning_zh: "妥协", example: "品質に関しては一切妥協しないつもりだ。", translation: "품질에 관해서는 일절 타협하지 않을 생각이다.", collocation: "一切妥協しない (일절 타협하지 않다)", explanation: "탁음 'だきょう' 발음에 주의해야 하는 N2 한자 어휘입니다.", difficulty: "중" },
      { id: "jlpt_n2_v6", word: "契機", pinyin: "けいき (keiki)", pos: "명사", meaning: "계기", meaning_en: "opportunity; turning point", meaning_zh: "契机；转机", example: "この失敗を契機に、社内の体制を見直した。", translation: "이 실패를 계기로 사내 체제를 재점검했다.", collocation: "～を契機に (~을 계기로)", explanation: "'～を契機として/に(~을 계기로 삼아)' 문형으로 독해에 자주 출제됩니다.", difficulty: "상" },
      { id: "jlpt_n2_v7", word: "顕著", pinyin: "けんちょ (kencho)", pos: "나형용사", meaning: "현저함, 두드러짐", meaning_en: "remarkable; prominent", meaning_zh: "显著；明显", example: "都市部と地方の人口格差が顕著になっている。", translation: "도시와 지방의 인구 격차가 현저해지고 있다.", collocation: "顕著な傾向 (현저한 경향)", explanation: "차이나 경향이 뚜렷할 때 사용하는 고급 논설문 어휘입니다.", difficulty: "상" }
    ],
    grammar: [
      { id: "jlpt_n2_g1", difficulty: "하", category: "～に関して (～에 관해서)", question: "この計画 ( ___ ) ご意見があれば、遠慮なくおっしゃってください。", options: ["に関して", "に反して", "に際して", "に加えて"], answer: 1, example: "この計画に関してご意見があれば、遠慮なくおっしゃってください。", translation: "이 계획에 관해서 의견이 있으시면 사양 말고 말씀해 주십시오.", explanation: "'～に関して'는 '~에 대하여(～について)'의 격식체 표현입니다." },
      { id: "jlpt_n2_g2", difficulty: "중", category: "～ざるを得ない (～하지 않을 수 없다)", question: "台風が接近しているため、明日のイベントは中止せ ( ___ )。", options: ["ざるを得ない", "かねない", "っこない", "ようがない"], answer: 1, example: "台風が接近しているため、明日のイベントは中止せざるを得ない。", translation: "태풍이 접근하고 있기 때문에 내일 이벤트는 중지하지 않을 수 없다.", explanation: "[동사 ない형 + ざるを得ない] (단, する는 せざるを得ない)는 부득이하게 '~하지 않을 수 없다'를 나타냅니다." },
      { id: "jlpt_n2_g3", difficulty: "중", category: "～に伴って (～에 따라/동반하여)", question: "経済の発展 ( ___ )、人々の生活水準も向上した。", options: ["に伴って", "に先立って", "を問わず", "をよそに"], answer: 1, example: "経済の発展に伴って、人々の生活水準も向上した。", translation: "경제 발전에 따라 사람들의 생활 수준도 향상되었다.", explanation: "한쪽의 변화와 함께 다른 쪽도 변화할 때 '～に伴って / ～に伴い'를 사용합니다." },
      { id: "jlpt_n2_g4", difficulty: "상", category: "～に越したことはない (～할수록 좋다)", question: "用心する ( ___ ) が、あまり心配しすぎるのもよくない。", options: ["に越したことはない", "にほかならない", "にすぎない", "に相違ない"], answer: 1, example: "用心するに越したことはないが、あまり心配しすぎるのもよくない。", translation: "조심할수록 좋지만, 너무 걱정하는 것도 좋지 않다.", explanation: "'～に越したことはない'는 '~하는 것이 최선이다 / ~할수록 좋다'라는 뜻의 N2 필수 문형입니다." }
    ],
    listening: [
      { id: "jlpt_n2_l1", difficulty: "하", category: "비즈니스 업무 지시", dialogue: [{ speaker: "남", text: "佐藤さん、来週のプレゼンの資料、もうできた？" }, { speaker: "여", text: "はい、グラフの修正だけ残っています。アンケートの集計と印刷は終わりました。" }, { speaker: "남", text: "じゃあ、グラフを直したらすぐメールで送ってくれる？" }], question: "女の人はこの後まず何をしますか。", options: ["グラフを修正する", "資料を印刷する", "アンケートを集計する", "会場を予約する"], answer: "グラフを修正する", audioText: "男：佐藤さん、来週のプレゼンの資料、もうできた？ 女：はい、グラフの修正だけ残っています。アンケートの集計と印刷は終わりました。 男：じゃあ、グラフを直したらすぐメールで送ってくれる？ 質問：女の人はこの後まず何をしますか。", translation: "남: 사토 씨, 다음 주 프레젠테이션 자료 다 됐어? / 여: 네, 그래프 수정만 남아 있습니다. 설문 집계와 인쇄는 끝났습니다. / 남: 그럼 그래프 고치면 바로 메일로 보내 줄래?", tip: "'この後まず何をしますか(이 후 우선 무엇을 합니까)' 유형은 이미 끝난 일(集計·印刷)을 소거하고 남은 작업(グラフの修正)을 고르는 것이 핵심입니다." },
      { id: "jlpt_n2_l2", difficulty: "중", category: "고객 불만 및 대응", dialogue: [{ speaker: "여", text: "あのう、昨日こちらで買った時計なんですが、もう止まってしまったんです。" }, { speaker: "남", text: "申し訳ございません。すぐ新しいものと交換いたします。レシートはお持ちですか。" }], question: "店員はこれからどうしますか。", options: ["新しい時計と交換する", "時計を修理に出す", "電池だけ取り替える", "代金を返金する"], answer: "新しい時計と交換する", audioText: "女：あのう、昨日こちらで買った時計なんですが、もう止まってしまったんです。 男：申し訳ございません。すぐ新しいものと交換いたします。レシートはお持ちですか。 質問：店員はこれからどうしますか。", translation: "여: 저기요, 어제 여기서 산 시계인데요, 벌써 멈춰 버렸어요. / 남: 대단히 죄송합니다. 바로 새것으로 교환해 드리겠습니다. 영수증 가지고 계십니까?", tip: "'新しいものと交換いたします(새것과 교환해 드리겠습니다)'라는 겸양어 표현을 정확히 포착하세요." }
    ],
    idioms: [
      { id: "jlpt_n2_i1", idiom: "試行錯誤", chengyu: "試行錯誤", pinyin: "しこうさくご (shikou sakugo)", meaning: "시행착오", sentence: "何度も ____ を繰り返して、ついに新製品を完成させた。", example: "何度も試行錯誤を繰り返して、ついに新製品を完成させた。", translation: "몇 번이나 시행착오를 거듭하여 마침내 신제품을 완성했다.", explanation: "여러 번 실패를 거듭하며 해결책을 찾아가는 과정을 뜻하는 N2 필수 사자숙어입니다.", difficulty: "하" },
      { id: "jlpt_n2_i2", idiom: "一石二鳥", chengyu: "一石二鳥", pinyin: "いっせきにちょう (isseki nichou)", meaning: "일석이조", sentence: "自転車通勤は運動にもなり交通費も浮くので、まさに ____ だ。", example: "自転車通勤は運動にもなり交通費も浮くので、まさに一石二鳥だ。", translation: "자전거 통근은 운동도 되고 교통비도 절약되니야말로 일석이조다.", explanation: "하나의 행동으로 두 가지 이익을 동시에 얻는다는 뜻입니다.", difficulty: "중" },
      { id: "jlpt_n2_i3", idiom: "耳が痛い", chengyu: "耳が痛い", pinyin: "みみがいたい (mimi ga itai)", meaning: "(약점을 찔려) 듣기 거북하다, 뜨끔하다", sentence: "母の忠告はもっともなので、聞くたびに ____。", example: "母の忠告はもっともなので、聞くたびに耳が痛い。", translation: "어머니의 충고는 지당해서 들을 때마다 뜨끔하다.", explanation: "자신의 약점이나 잘못을 지적받아 마음이 찔릴 때 쓰는 대표 신체 관용구입니다.", difficulty: "상" }
    ],
    cloze: [
      { id: "jlpt_n2_c1", difficulty: "중", sentence: "新システムを導入したものの、期待したほどの ____ は得られなかった。", options: ["効果", "効率", "効力", "効能"], answer: "効果", pinyin: "こうか (kouka)", collocation: "効果を得る / 効果が上がる (효과를 얻다 / 효과가 오르다)", translation: "신시스템을 도입했지만 기대했던 것만큼의 효과는 얻지 못했다.", explanation: "'期待したほどの効果を得る(기대한 만큼의 효과를 얻다)'가 정확한 연어 배합입니다." },
      { id: "jlpt_n2_c2", difficulty: "상", sentence: "彼の説明は要点がはっきりしていて、非常に ____ がいい。", options: ["要領", "要旨", "要素", "要因"], answer: "要領", pinyin: "ようりょう (youryou)", collocation: "要領がいい (요령이 좋다 / 일처리가 깔끔하다)", translation: "그의 설명은 요점이 명확해서 매우 요령이 좋다.", explanation: "'要領がいい(요령이 좋다)', '要領を得る(요점을 잡다)'는 N2 빈출 콜로케이션입니다." }
    ],
    reading: [
      { id: "jlpt_n2_r1", difficulty: "중", category: "논설문 독해", title: "情報社会と考える力", passage: "インターネットの普及により、私たちはいつでも膨大な情報を手に入れられるようになった。\nしかし、検索すればすぐ答えが見つかるため、自分で深く考える機会が減っているのではないだろうか。\n情報をただ集めるだけでなく、その情報が本当に正しいのかを自分の頭で判断する力こそ、現代人に最も求められている。", question: "筆者が最も言いたいことは何か。", options: ["情報を自分の頭で考え判断する力が大切だ", "インターネットの検索スピードをもっと上げるべきだ", "できるだけ多くの情報を集めることが重要だ", "インターネットの利用を完全にやめるべきだ"], answer: "情報を自分の頭で考え判断する力が大切だ", keySentence: "その情報が本当に正しいのかを自分の頭で判断する力こそ、現代人に最も求められている。", collocation: "～こそ、最も求められている (~야말로 가장 요구되고 있다)", translation: "인터넷 보급으로 우리는 언제든 방대한 정보를 손에 넣을 수 있게 되었다. 하지만 검색하면 바로 답이 나오기 때문에 스스로 깊이 생각할 기회가 줄어들고 있는 것은 아닐까. 정보를 단지 모을 뿐만 아니라 그 정보가 정말로 올바른지 자신의 머리로 판단하는 힘이야말로 현대인에게 가장 요구되고 있다.", explanation: "필자의 주장은 강조 조사 '～こそ'가 쓰인 마지막 문장에 집약되어 있습니다." }
    ],
    dictation: [
      { id: "jlpt_n2_d1", difficulty: "하", sentence: "現状を正確に把握することが重要だ。", pinyin: "げんじょうをせいかくにはあくすることがじゅうようだ", keyPoint: "[JLPT N2] 現状を把握する (핵심 연어)", translation: "현상을 정확하게 파악하는 것이 중요하다." },
      { id: "jlpt_n2_d2", difficulty: "중", sentence: "台風が接近しているため、明日のイベントは中止せざるを得ない。", pinyin: "たいふうがせっきんしているため、あしたのいべんとはちゅうしせざるをえない", keyPoint: "[JLPT N2] ～せざるを得ない (부득이한 결정)", translation: "태풍이 접근하고 있기 때문에 내일 이벤트는 중지하지 않을 수 없다." }
    ]
  },
  N1: {
    vocab: [
      { id: "jlpt_n1_v1", word: "網羅", pinyin: "もうら (moura)", pos: "명사·스루동사", meaning: "망라, 빠짐없이 포함함", meaning_en: "comprehensive coverage", meaning_zh: "网罗；囊括", example: "この辞典は専門用語まで幅広く網羅している。", translation: "이 사전은 전문 용어까지 폭넓게 망라하고 있다.", collocation: "幅広く網羅する (폭넓게 망라하다)", explanation: "JLPT N1 최빈출 동사/명사로, 모든 자료나 사례를 빠짐없이 포괄할 때 사용합니다.", difficulty: "중" },
      { id: "jlpt_n1_v2", word: "斬新", pinyin: "ざんしん (zanshin)", pos: "나형용사", meaning: "참신함, 매우 새로움", meaning_en: "novel; innovative; groundbreaking", meaning_zh: "崭新；新颖", example: "彼女の斬新なアイデアが会社の危機を救った。", translation: "그녀의 참신한 아이디어가 회사의 위기를 구했다.", collocation: "斬新な発想 (참신한 발상)", explanation: "발상이나 디자인이 기존 틀을 깨고 독창적일 때 쓰입니다.", difficulty: "중" },
      { id: "jlpt_n1_v3", word: "不可欠", pinyin: "ふかけつ (fukaketsu)", pos: "나형용사", meaning: "불가결, 없어서는 안 됨", meaning_en: "indispensable; essential", meaning_zh: "必不可少；不可或缺", example: "信頼関係はビジネスにおいて不可欠な要素だ。", translation: "신뢰 관계는 비즈니스에 있어서 불가결한 요소다.", collocation: "必要不可欠 (필요불가결)", explanation: "'必要不可欠(ひつようふかけつ)' 사자숙어 형태로도 자주 등장합니다.", difficulty: "상" },
      { id: "jlpt_n1_v4", word: "懸念", pinyin: "けねん (kenen)", pos: "명사·스루동사", meaning: "우려, 걱정", meaning_en: "concern; apprehension", meaning_zh: "担忧；顾虑", example: "環境汚染のさらなる悪化が懸念されている。", translation: "환경 오염의 추가 악화가 우려되고 있다.", collocation: "悪化が懸念される (악화가 우려되다)", explanation: "뉴스 보도와 논설문에서 수동형 '～が懸念される'로 매우 자주 쓰입니다.", difficulty: "상" },
      { id: "jlpt_n1_v5", word: "迅速", pinyin: "じんそく (jinsoku)", pos: "나형용사", meaning: "신속함, 재빠름", meaning_en: "swift; prompt; rapid", meaning_zh: "迅速", example: "災害発生時には迅速な対応が求められる。", translation: "재해 발생 시에는 신속한 대응이 요구된다.", collocation: "迅速な対応 (신속한 대응)", explanation: "탁음 'じんそく' 발음 문제로도 자주 출제되는 N1 핵심 어휘입니다.", difficulty: "하" }
    ],
    grammar: [
      { id: "jlpt_n1_g1", difficulty: "중", category: "～を余儀なくされる (어쩔 수 없이 ~하게 되다)", question: "大雪のため、多くの列車が運休 ( ___ )。", options: ["を余儀なくされた", "にたえない", "にはあたらない", "をものともせず"], answer: 1, example: "大雪のため、多くの列車が運休を余儀なくされた。", translation: "폭설 때문에 많은 열차가 부득이하게 운휴하게 되었다.", explanation: "[명사 + を余儀なくされる]는 외부 사정으로 인해 원치 않게 어떤 상황을 강요받음을 뜻하는 N1 대표 문형입니다." },
      { id: "jlpt_n1_g2", difficulty: "상", category: "～に即して (～에 부합하여/의거하여)", question: "理論だけでなく、現場の実態 ( ___ ) 計画を立てるべきだ。", options: ["に即して", "をよそに", "にひきかえ", "と相まって"], answer: 1, example: "理論だけでなく、現場の実態に即して計画を立てるべきだ。", translation: "이론뿐만 아니라 현장의 실태에 부합하여 계획을 세워야 한다.", explanation: "'事実/実態/規則 + に即して'는 실제 상황이나 기준에 딱 맞추어 행동함을 뜻합니다." }
    ],
    listening: [
      { id: "jlpt_n1_l1", difficulty: "상", category: "경영 전략 회의", dialogue: [{ speaker: "남", text: "新商品の開発だけど、コスト削減も大事だが、今回は何より安全性の確保を最優先にすべきだと思う。" }, { speaker: "여", text: "同感です。時間が多少かかっても、安全基準だけは妥協できませんね。" }], question: "二人が最も重視していることは何ですか。", options: ["安全性の確保", "開発期間の短縮", "製造コストの削減", "デザインの刷新"], answer: "安全性の確保", audioText: "男：新商品の開発だけど、コスト削減も大事だが、今回は何より安全性の確保を最優先にすべきだと思う。 女：同感です。時間が多少かかっても、安全基準だけは妥協できませんね。 質問：二人が最も重視していることは何ですか。", translation: "남: 신상품 개발 말인데, 비용 절감도 중요하지만 이번에는 무엇보다 안전성 확보를 최우선으로 해야 한다고 생각해. / 여: 동감입니다. 시간이 다소 걸리더라도 안전 기준만은 타협할 수 없네요.", tip: "'何より～を最優先にすべき(무엇보다 ~을 최우선으로 해야 한다)'와 '同感です(동감입니다)'를 통해 핵심 합의를 파악합니다." }
    ],
    idioms: [
      { id: "jlpt_n1_i1", idiom: "暗中模索", chengyu: "暗中模索", pinyin: "あんちゅうもさく (anchuu mosaku)", meaning: "암중모색 (단서 없이 어둠 속에서 방법을 찾음)", sentence: "前例のないプロジェクトで、最初は ____ の状態だった。", example: "前例のないプロジェクトで、最初は暗中模索の状態だった。", translation: "전례 없는 프로젝트라 처음에는 암중모색 상태였다.", explanation: "단서나 선례가 없는 상태에서 여러모로 해결책을 찾아 나가는 것을 뜻합니다.", difficulty: "상" }
    ],
    cloze: [
      { id: "jlpt_n1_c1", difficulty: "상", sentence: "長年の努力が実を ____、ついに世界大会で優勝を果たした。", options: ["結び", "付け", "上げ", "成し"], answer: "結び", pinyin: "むすび (musubi)", collocation: "努力が実を結ぶ (노력이 결실을 맺다)", translation: "오랜 세월의 노력이 결실을 맺어 마침내 세계 대회에서 우승을 거두었다.", explanation: "'実を結ぶ(열매를 맺다 / 결실을 거두다)'는 N1 필수 관용 연어입니다." }
    ],
    reading: [
      { id: "jlpt_n1_r1", difficulty: "상", category: "평론 독해", title: "科学技術と倫理", passage: "人工知能をはじめとする先端技術は、社会の効率性を飛躍的に高めた。\nしかしながら、技術がどれほど進歩しようとも、それを使う人間の倫理観が伴わなければ、思わぬ弊害をもたらしかねない。\n技術の可能性を追求すると同時に、常に人間社会の幸福とは何かを問い続ける姿勢が不可欠である。", question: "先端技術に対する筆者の考えとして最も適切なものはどれか。", options: ["技術の発展には人間の倫理観と幸福への問いが不可欠だ", "効率性を高めるためなら倫理的な問題は後回しでよい", "人工知能の開発は弊害が多いため直ちに中止すべきだ", "技術が進歩すれば人間の倫理観も自動的に向上する"], answer: "技術の発展には人間の倫理観と幸福への問いが不可欠だ", keySentence: "技術の可能性を追求すると同時に、常に人間社会の幸福とは何かを問い続ける姿勢が不可欠である。", collocation: "～と同時に (～와 동시에) / ～が不可欠である (~이 불가결하다)", translation: "인공지능을 비롯한 첨단 기술은 사회의 효율성을 비약적으로 높였다. 그러나 기술이 아무리 진보하더라도 그것을 사용하는 인간의 윤리관이 동반되지 않으면 뜻밖의 폐해를 초래할 수도 있다. 기술의 가능성을 추구함과 동시에 항상 인간 사회의 행복이란 무엇인가를 계속 묻는 자세가 불가결하다.", explanation: "역접 'しかしながら' 뒤의 경고와 마지막 문장의 결론('～が不可欠である')을 결합해 정답을 도출합니다." }
    ],
    dictation: [
      { id: "jlpt_n1_d1", difficulty: "상", sentence: "災害発生時には迅速な対応が求められる。", pinyin: "さいがいはっせいじにはじんそくなたいおうがもとめられる", keyPoint: "[JLPT N1] 迅速な対応 (신속한 대응)", translation: "재해 발생 시에는 신속한 대응이 요구된다." }
    ]
  }
};

// 각 급수별로 chengyu 와 idioms 양쪽 키를 모두 동기화하고 파일로 저장
const jlptLevels = {};
["N5", "N4", "N3", "N2", "N1"].forEach((lv) => {
  const lvFile = path.join(jlptLevelsDir, `jlpt_${lv.toLowerCase()}.json`);
  const baseLv = defaultJlptLevels[lv];
  const existingLv = fs.existsSync(lvFile) ? JSON.parse(fs.readFileSync(lvFile, 'utf8')) : null;
  const mergedLv = existingLv ? mergeDatasetObj(baseLv, existingLv) : baseLv;
  mergedLv.chengyu = mergedLv.idioms || mergedLv.chengyu || [];
  mergedLv.idioms = mergedLv.idioms || mergedLv.chengyu || [];
  fs.writeFileSync(lvFile, JSON.stringify(mergedLv, null, 2), 'utf8');
  jlptLevels[lv] = mergedLv;
});

// 전체 JLPT 통합 데이터셋 (기본 N2 중심 + 전 급수 통합 풀) 생성 및 jlpt/*.json 저장
const jlptCombined = {
  vocab: [],
  listening: [],
  idioms: [],
  chengyu: [],
  cloze: [],
  grammar: [],
  dictation: [],
  reading: []
};
["N2", "N3", "N1", "N4", "N5"].forEach((lv) => {
  const d = jlptLevels[lv];
  if (!d) return;
  ["vocab", "listening", "idioms", "cloze", "grammar", "dictation", "reading"].forEach((k) => {
    if (Array.isArray(d[k])) {
      jlptCombined[k] = mergeItemLists(jlptCombined[k], d[k]);
    }
  });
});
jlptCombined.chengyu = jlptCombined.idioms;

["vocab", "listening", "idioms", "cloze", "grammar", "dictation", "reading"].forEach((k) => {
  const fPath = path.join(jlptDir, `jlpt_${k}.json`);
  fs.writeFileSync(fPath, JSON.stringify(jlptCombined[k], null, 2), 'utf8');
});

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
  jlpt: jlptLevels["N2"] || jlptCombined,
  hskLevels: {
    "1": hsk1,
    "2": hsk2,
    "3": hsk3,
    "4": hsk4,
    "5": hsk5Merged,
    "6": hsk6,
    "7-9": hsk7_9
  },
  jlptLevels: jlptLevels
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
    if (customJson && customJson.jlptLevels) {
      Object.keys(customJson.jlptLevels).forEach((lv) => {
        if (outObj.jlptLevels[lv]) {
          outObj.jlptLevels[lv] = mergeDatasetObj(outObj.jlptLevels[lv], customJson.jlptLevels[lv]);
        }
      });
      outObj.jlpt = outObj.jlptLevels["N2"];
    }
  } catch (e) {
    console.warn('⚠️ custom_questions.json 병합 중 경고:', e.message);
  }
}

const fileStr =
  '// HSK 3.0 (1~6/7-9급) & IELTS & JLPT (N5~N1) 통합 다국어 데이터 번들 (CORS 제한 없는 즉시 로딩 지원)\n' +
  'window.HSK5_DATA = ' + JSON.stringify(outObj.hsk, null, 2) + ';\n' +
  'window.HSK_LEVELS_DATA = ' + JSON.stringify(outObj.hskLevels, null, 2) + ';\n' +
  'window.IELTS_DATA = ' + JSON.stringify(outObj.ielts, null, 2) + ';\n' +
  'window.JLPT_DATA = ' + JSON.stringify(outObj.jlpt, null, 2) + ';\n' +
  'window.JLPT_LEVELS_DATA = ' + JSON.stringify(outObj.jlptLevels, null, 2) + ';\n' +
  'window.APP_DATA = ' + JSON.stringify(outObj, null, 2) + ';\n';
fs.writeFileSync(path.join(__dirname, 'vocab_data.js'), fileStr, 'utf8');

console.log('✅ vocab_data.js successfully rebuilt with complete New HSK 3.0, IELTS & JLPT datasets!');
console.log(`📊 Stats:`);
console.log(`   [HSK5] Vocab: ${hskVocab.length}, Colloc: ${hskColloc.length}, Grammar: ${hskGrammar.length}, Cloze: ${hskCloze.length}, Chengyu: ${hskChengyu.length}, Listening: ${hskListening.length}, Dictation: ${hskDictation.length}, Reading: ${hskReading.length}`);
for (const [lvl, data] of Object.entries(outObj.hskLevels)) {
  if (data) {
    const total = Object.values(data).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);
    console.log(`   [New HSK ${lvl}급] Total ${total} items (Vocab: ${data.vocab?.length || 0}, Grammar: ${data.grammar?.length || 0}, Listening: ${data.listening?.length || 0})`);
  }
}
console.log(`   [IELTS] Vocab: ${ieltsVocab.length}, Listening: ${ieltsListening.length}, Idioms: ${ieltsIdioms.length}, Cloze: ${ieltsCloze.length}, Grammar: ${ieltsGrammar.length}, Dictation: ${ieltsDictation.length}, Reading: ${ieltsReading.length}`);

