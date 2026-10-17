// HSK 5급 & IELTS 다국어 스마트 웹 퀴즈 & TTS 발음 엔진 + 학습 기록 관리 + 상/중/하 난이도 + 오답 반복(SRS) 시스템

document.addEventListener("DOMContentLoaded", () => {
  // 데이터 저장소
  let currentLanguage = "hsk"; // "hsk" | "ielts"

  let hskData = { vocab: [], colloc: [], chengyu: [], cloze: [], grammar: [], listening: [] };
  let ieltsData = { vocab: [], listening: [], idioms: [], cloze: [], grammar: [] };

  // 앱 상태
  let currentMode = "vocab";
  let currentDifficulty = "중"; // 하, 중, 상
  let questionCount = 5;
  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let answered = false;
  let autoTTS = true;
  let ttsSpeed = 1.0;
  let currentSpeechText = "";
  let currentExampleSpeechText = "";

  // 음성 엔진 및 타이머/세션 관리 (Web Speech API 비동기 충돌 방지)
  let availableVoices = [];
  let selectedVoice = null;
  let speechSessionId = 0;
  let autoTtsTimer = null;

  // 듣기 모드 전용 플레이어 상태 (구간 재생 및 일시정지)
  let listeningSegments = [];
  let currentSegmentIdx = 0;
  let isListeningPlaying = false;
  let isListeningPaused = false;
  let dialogueTimer = null;

  // 사용자별 독립적인 데이터 저장을 위한 키 생성 함수
  function getStorageKey() {
    const user = localStorage.getItem("loggedInUser") || "guest";
    return "polyglot_quiz_history_" + user;
  }

  function getMasteryKey() {
    const user = localStorage.getItem("loggedInUser") || "guest";
    return "polyglot_quiz_mastery_" + user;
  }

  // UI 언어 상태 (기본값: 한국어, localStorage에 저장)
  let currentUiLang = localStorage.getItem("preferred_ui_lang") || "ko";

  // DOM 요소 캐싱
  const langHskBtn = document.getElementById("lang-hsk-btn");
  const langIeltsBtn = document.getElementById("lang-ielts-btn");
  const logoBadge = document.getElementById("logo-badge");
  const appTitle = document.getElementById("app-title");
  const introTitle = document.getElementById("intro-title");
  const introDesc = document.getElementById("intro-desc");

  // UI 언어 전환 요소 캐싱
  const uiLangTabs = document.querySelectorAll(".ui-lang-tab");
  const tabHskText = document.getElementById("tab-hsk-text");
  const tabIeltsText = document.getElementById("tab-ielts-text");
  const userGreeting = document.getElementById("user-greeting");
  const logoutBtn = document.getElementById("logout-btn");
  const autoTtsLabel = document.getElementById("auto-tts-label");
  const ttsToggleWrap = document.getElementById("tts-toggle-wrap");
  const optSpeedSlow = document.getElementById("opt-speed-slow");
  const optSpeedNormal = document.getElementById("opt-speed-normal");
  const optSpeedFast = document.getElementById("opt-speed-fast");

  // SRS 진도 현황 요소
  const srsTitle = document.getElementById("srs-title");
  const srsSubtitle = document.getElementById("srs-subtitle");
  const srsMasteredCount = document.getElementById("srs-mastered-count");
  const srsReviewCount = document.getElementById("srs-review-count");
  const srsNewCount = document.getElementById("srs-new-count");
  const srsMasteredLabel = document.getElementById("srs-mastered-label");
  const srsReviewLabel = document.getElementById("srs-review-label");
  const srsNewLabel = document.getElementById("srs-new-label");
  const resetProgressBtn = document.getElementById("reset-progress-btn");
  const questionSrsBadge = document.getElementById("question-srs-badge");

  const sectionModeTitle = document.getElementById("section-mode-title");
  const sectionCountTitle = document.getElementById("section-count-title");
  const sectionDiffTitle = document.getElementById("section-diff-title");

  const countBtn5 = document.getElementById("count-btn-5");
  const countBtn10 = document.getElementById("count-btn-10");
  const countBtn15 = document.getElementById("count-btn-15");
  const countBtnAll = document.getElementById("count-btn-all");

  const setupView = document.getElementById("setup-view");
  const quizView = document.getElementById("quiz-view");
  const resultView = document.getElementById("result-view");

  const openHistoryBtn = document.getElementById("open-history-btn");
  const viewHistoryBtn = document.getElementById("view-history-btn");
  const historyModal = document.getElementById("history-modal");
  const historyModalTitle = document.getElementById("history-modal-title");
  const closeHistoryBtn = document.getElementById("close-history-btn");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const historyList = document.getElementById("history-list");
  const statTotalCount = document.getElementById("stat-total-count");
  const statAvgScore = document.getElementById("stat-avg-score");
  const statPassCount = document.getElementById("stat-pass-count");
  const statTotalLabel = document.getElementById("stat-total-label");
  const statAvgLabel = document.getElementById("stat-avg-label");
  const statPassLabel = document.getElementById("stat-pass-label");
  const historyListHeaderTitle = document.getElementById("history-list-header-title");

  const autoTtsToggle = document.getElementById("auto-tts-toggle");
  const ttsSpeedSelect = document.getElementById("tts-speed");
  const ttsVoiceSelect = document.getElementById("tts-voice-select");

  const modeGrid = document.getElementById("mode-grid");
  const countBtns = document.querySelectorAll(".count-btn");
  const diffBtns = document.querySelectorAll(".diff-btn");
  const startBtn = document.getElementById("start-btn");

  const quizModeTag = document.getElementById("quiz-mode-tag");
  const quizDiffTag = document.getElementById("quiz-diff-tag");
  const progressText = document.getElementById("progress-text");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const scoreLabel = document.getElementById("score-label");
  const currentScoreElem = document.getElementById("current-score");
  const quitBtn = document.getElementById("quit-btn");

  const questionCategory = document.getElementById("question-category");
  const ttsBtn = document.getElementById("tts-btn");
  const ttsBtnText = document.getElementById("tts-btn-text");

  // 듣기 플레이어 컨트롤러
  const listeningPlayerBox = document.getElementById("listening-player-box");
  const audioWavesWrap = document.getElementById("audio-waves-wrap");
  const listeningStatusText = document.getElementById("listening-status-text");
  const listeningSubtext = document.getElementById("listening-subtext");
  const listeningPlayPauseBtn = document.getElementById("listening-play-pause-btn");
  const playPauseIcon = document.getElementById("play-pause-icon");
  const playPauseLabel = document.getElementById("play-pause-label");
  const listeningRestartBtn = document.getElementById("listening-restart-btn");
  const listeningRestartLabel = document.getElementById("listening-restart-label");

  const standardQuestionBody = document.getElementById("standard-question-body");
  const mainChinese = document.getElementById("main-chinese");
  const mainPinyin = document.getElementById("main-pinyin");
  const subPrompt = document.getElementById("sub-prompt");
  const optionsList = document.getElementById("options-list");

  const explanationBox = document.getElementById("explanation-box");
  const feedbackBanner = document.getElementById("feedback-banner");
  const expCollocLabel = document.getElementById("exp-colloc-label");
  const expCollocVal = document.getElementById("exp-colloc-val");
  const expDetailLabel = document.getElementById("exp-detail-label");
  const expDetailVal = document.getElementById("exp-detail-val");

  const listeningTranscriptCard = document.getElementById("listening-transcript-card");
  const transcriptTitle = document.getElementById("transcript-title");
  const transcriptAudioBtnText = document.getElementById("transcript-audio-btn-text");
  const transcriptDialogueList = document.getElementById("transcript-dialogue-list");
  const transcriptQuestionBadge = document.getElementById("transcript-question-badge");
  const transcriptQuestionText = document.getElementById("transcript-question-text");
  const transcriptTranslation = document.getElementById("transcript-translation");
  const transcriptAudioBtn = document.getElementById("transcript-audio-btn");

  const standardExampleCard = document.getElementById("standard-example-card");
  const exampleCardTitle = document.getElementById("example-card-title");
  const expAudioBtn = document.getElementById("exp-audio-btn");
  const expAudioBtnText = document.getElementById("exp-audio-btn-text");
  const expExampleCn = document.getElementById("exp-example-cn");
  const expExampleKr = document.getElementById("exp-example-kr");
  const nextBtn = document.getElementById("next-btn");

  const resultTitle = document.getElementById("result-title");
  const finalScoreElem = document.getElementById("final-score");
  const finalTotalElem = document.getElementById("final-total");
  const scorePercentageElem = document.getElementById("score-percentage");
  const resultBadge = document.getElementById("result-badge");
  const resultDiffBadge = document.getElementById("result-diff-badge");
  const resultMessage = document.getElementById("result-message");
  const retryBtn = document.getElementById("retry-btn");
  const homeBtn = document.getElementById("home-btn");

  const footerText1 = document.getElementById("footer-text-1");
  const footerText2 = document.getElementById("footer-text-2");

  // Auth 화면 요소 캐싱
  const authTitle = document.getElementById("auth-title");
  const authDesc = document.getElementById("auth-desc");
  const authId = document.getElementById("auth-id");
  const authPw = document.getElementById("auth-pw");
  const loginBtn = document.getElementById("login-btn");
  const authNoAccText = document.getElementById("auth-no-acc-text");
  const goSignup = document.getElementById("go-signup");
  const signupId = document.getElementById("signup-id");
  const signupPw = document.getElementById("signup-pw");
  const signupPwConfirm = document.getElementById("signup-pw-confirm");
  const signupBtn = document.getElementById("signup-btn");
  const authHaveAccText = document.getElementById("auth-have-acc-text");
  const goLogin = document.getElementById("go-login");

  // ==========================================
  // 다국어 i18n 번역 사전 (한국어 / 중국어 / 영어)
  // ==========================================
  const I18N = {
    ko: {
      subjectHsk: "HSK 5급",
      subjectIelts: "IELTS 영어",
      greeting: (u) => `${u}님 반갑습니다!`,
      historyBtn: "📜 학습 기록",
      historyBtnTitle: "나의 학습 기록 및 성적 리스트 보기",
      autoTtsLabel: "🔊 자동 발음",
      autoTtsTitle: "문제 전환 시 원어민 발음을 자동으로 재생합니다",
      ttsSpeedTitle: "발음 재생 속도",
      speedSlow: "0.8x (느리게)",
      speedNormal: "1.0x (보통)",
      speedFast: "1.2x (빠르게)",
      voiceSelectTitle: "고음질 원어민 음성 선택",
      voiceAutoZh: "✨ 최적 중국어 음성 (자동)",
      voiceAutoEn: "✨ 미국식(US) 고음질 음성 (자동)",
      logoutTitle: "로그아웃",

      hsk: {
        title: "HSK 5급 스마트 퀴즈",
        introTitle: "실전 HSK 5급 학습 모드를 선택하세요",
        introDesc: "어휘 암기, 사자성어 문맥 완성, 독해 1부분 搭配 배합, 필수 문법, 그리고 실전 듣기(听力)까지 원어민 음성으로 정복하세요.",
        modes: {
          vocab: { name: "필수 어휘 퀴즈", desc: "한자/병음 ➔ 한국어 뜻 및 핵심 예문" },
          listening: { name: "실전 듣기(听力) 퀴즈", desc: "남녀 2마디 대화 & 단문 청취 후 질문 풀이" },
          chengyu: { name: "사자성어(成语) 퀴즈", desc: "문맥 빈칸 채우기 & 빈출 30선 의미 파악" },
          cloze: { name: "독해 1부분 실전 빈칸", desc: "3초 컷! 고정 짝꿍 호응(搭配) 훈련" },
          grammar: { name: "필수 문법 & 어순 배열", desc: "把/被자문, 존현문, 접속사 공식 및 쓰기" },
          mixed: { name: "종합 실전 모의고사", desc: "듣기, 어휘, 성어, 빈칸, 문법 전 영역 통합 출제" }
        }
      },
      ielts: {
        title: "IELTS 영어 마스터 퀴즈",
        introTitle: "IELTS Academic & General 시험 대비 모드를 선택하세요",
        introDesc: "Band 7.0+ 아카데믹 어휘, Section 1~4 리스닝, 고득점 숙어(Idioms), 리딩 콜로케이션, 라이팅 복합 문법까지 미국식(US) 원어민 발음으로 마스터하세요.",
        modes: {
          vocab: { name: "IELTS 핵심 어휘", desc: "Band 6.5~7.5+ 아카데믹 필수 어휘 & 유의어" },
          listening: { name: "실전 리스닝(Listening)", desc: "대화 및 학술 강의 청취 후 질문 풀이" },
          chengyu: { name: "숙어 및 관용구(Idioms)", desc: "스피킹 & 라이팅 점수 부스팅 필수 관용 표현" },
          cloze: { name: "리딩 Collocation 빈칸", desc: "아카데믹 빈출 고정 어휘 배합 완성" },
          grammar: { name: "라이팅 필수 문법 & 구문", desc: "도치, 가정법, 분사구문 등 Band 7+ 복합 구문" },
          mixed: { name: "종합 실전 모의고사", desc: "리스닝, 어휘, 숙어, 콜로케이션, 문법 통합 출제" }
        }
      },

      srsTitle: "스마트 반복 학습 (SRS) 현황",
      srsSubtitle: "맞춘 문제는 자동 졸업(출제 제외), 틀린 문제는 맞출 때까지 다음 시도에 반복 출제됩니다.",
      srsResetBtn: "🔄 진도 초기화",
      srsResetBtnTitle: "현재 과목의 마스터 및 오답 기록을 초기화합니다",
      srsMastered: "🎓 마스터 (맞춘 문제)",
      srsReview: "🔁 복습 대기 (틀린 문제)",
      srsNew: "⏳ 미도전 문제",

      sectionMode: "1. 학습 모드 선택",
      sectionCount: "2. 문제 수 선택",
      sectionDiff: "3. 난이도 선택",

      count5: "5문제 (퀵)",
      count10: "10문제 (추천)",
      count15: "15문제 (집중)",
      countAll: "전체 풀기",

      diffLabels: {
        "하": { label: "🟢 하 (기본)", chip: "하 (기본)", desc: "짧고 명확한 기초 어휘 & 일상 2마디 대화" },
        "중": { label: "🟡 중 (실전)", chip: "중 (실전)", desc: "5급 표준 문맥, 반전 함정 청취, 빈출 짝꿍" },
        "상": { label: "🔴 상 (심화)", chip: "상 (심화)", desc: "길고 복잡한 장문 설명문, 심화 추론 & 어순" }
      },

      startBtn: "퀴즈 시작하기 🚀",

      progressText: (cur, total) => `문제 ${cur} / ${total}`,
      currentScoreLabel: "현재 점수:",
      quitBtn: "그만하기",
      audioBtn: "발음 듣기",
      audioBtnTitle: "원어민 발음 다시 듣기",
      srsReviewBadge: "🔁 오답 집중 복습",
      listeningInstruction: "🎧 대화를 주의 깊게 듣고 질문에 답하세요",
      listeningSubtext: "(실전 시험과 같이 문제는 음성으로만 출제됩니다)",
      listeningPlay: "대화 듣기",
      listeningPause: "일시정지",
      listeningResume: "이어듣기",
      listeningReplay: "다시듣기",
      listeningPausedStatus: "⏸️ 일시정지됨 (이어듣기를 누르면 계속 재생됩니다)",
      listeningFinishedStatus: "✅ 청취 완료! 질문에 알맞은 답을 고르세요.",
      listeningRestart: "🔄 처음부터",
      listeningRestartTitle: "대화를 처음부터 다시 듣습니다",
      defaultSubPrompt: "다음 단어의 올바른 한국어 뜻은 무엇일까요?",

      feedbackCorrectHsk: "🎉 정답입니다! (맞춘 문제는 암기 완료 처리됩니다)",
      feedbackWrongHsk: (ans) => `❌ 오답입니다. 정답은 [ ${ans} ] 입니다. (다음 퀴즈에 다시 출제됩니다)`,
      feedbackCorrectIelts: "🎉 Correct! (Mastered & will be excluded next time)",
      feedbackWrongIelts: (ans) => `❌ Incorrect. The answer is [ ${ans} ]. (Added to review list)`,
      expCollocLabel: "💡 핵심 搭配/포인트:",
      expDetailLabel: "📌 출제 공략 해설:",
      transcriptTitle: "📜 듣기 원문 녹취록 (대화 스크립트)",
      transcriptAudioBtn: "원문 다시 듣기",
      transcriptQuestionBadge: "❓ 질문",
      exampleCardTitle: "📝 실전 활용 상세 예문",
      exampleAudioBtn: "예문 듣기",
      nextBtn: "다음 문제 ➔",

      resultPassHsk: "합격 기준 도달 🏆",
      resultPassIelts: "Band Target Achieved 🏆",
      resultFail: "복습 필요 💡",
      resultCompleted: "퀴즈가 완료되었습니다!",
      resultPassMsgHsk: "훌륭합니다! 맞춘 문제는 다음 시도에서 제외되며, 틀린 문제만 모아서 집중 복습할 수 있습니다.",
      resultPassMsgIelts: "Great job! Mastered questions are saved. Review will focus on any mistakes in your next attempt.",
      resultFailMsg: "틀린 문제들은 다음 퀴즈 시도 시 자동으로 다시 출제되니 안심하고 복습하세요!",
      resultDiffPrefix: "난이도: ",
      retryBtn: "다시 풀기 🔄",
      viewHistoryBtn: "📜 학습 기록 보기",
      homeBtn: "메인 메뉴 🏠",

      historyTitleHsk: "나의 HSK 5급 학습 기록",
      historyTitleIelts: "나의 IELTS 학습 기록",
      statTotal: "총 학습 횟수",
      statAvg: "평균 정답률",
      statPass: "합격(60%↑) 횟수",
      historyListHeader: "학습 내역 리스트",
      clearHistoryBtn: "기록 전체 삭제",
      emptyHistory: "아직 학습 기록이 없습니다.<br>첫 퀴즈를 풀어보세요! 💪",
      historyPassBadge: "합격",
      historyFailBadge: "복습",

      alertNoQuestions: "출제할 문제가 없습니다. 진도 초기화를 통해 마스터한 단어를 다시 연습해 보세요.",
      confirmQuit: "현재 퀴즈를 중단하고 메인 메뉴로 돌아갈까요?",
      confirmResetProgress: (langName) => `${langName}의 마스터 및 오답 기록을 초기화하시겠습니까?`,
      alertResetProgress: "학습 진도가 초기화되었습니다. 모든 문제가 다시 출제됩니다.",
      confirmClearHistory: "정말로 모든 학습 기록을 삭제하시겠습니까?",

      authWelcome: "👋 환영합니다!",
      authSubtitle: "계속하려면 로그인하세요.",
      authIdPlaceholder: "아이디",
      authPwPlaceholder: "비밀번호",
      loginBtn: "로그인",
      authNoAccount: "계정이 없으신가요? ",
      authGoSignup: "회원가입",
      signupIdPlaceholder: "새 아이디",
      signupPwPlaceholder: "비밀번호",
      signupPwConfirmPlaceholder: "비밀번호 확인",
      signupBtn: "회원가입",
      authHaveAccount: "이미 계정이 있으신가요? ",
      authGoLogin: "로그인",
      footerTitle: "HSK 5급 & IELTS 다국어 스마트 러닝",
      footerDesc: "Web Speech API 고음질 원어민 발음 지원",

      prompts: {
        hsk_vocab_reverse: "제시된 뜻을 가진 중국어 단어를 고르세요.",
        hsk_vocab_meaning: "다음 한자 단어의 올바른 한국어 뜻을 고르세요.",
        hsk_listening: "🎧 대화와 질문을 잘 듣고, 알맞은 답을 고르세요.",
        hsk_chengyu_cloze: "문맥의 빈칸 [ ____ ] 에 가장 어울리는 사자성어를 고르세요.",
        hsk_chengyu_meaning: "다음 사자성어의 한국어 의미로 알맞은 것을 고르세요.",
        hsk_cloze: "문맥과 어휘 짝꿍(搭配)을 고려하여 빈칸에 들어갈 단어를 고르세요.",
        hsk_grammar: "문법 규칙과 어순에 맞는 가장 올바른 보기를 고르세요.",
        ielts_vocab_reverse: "Select the correct academic word that matches the meaning:",
        ielts_vocab_meaning: "Select the correct Korean meaning for this academic word:",
        ielts_listening: "🎧 Listen carefully to the audio and select the most accurate answer:",
        ielts_idiom_cloze: "Choose the most appropriate idiom to fill in the blank [ ____ ]:",
        ielts_idiom_meaning: "Select the correct Korean meaning for this academic idiom:",
        ielts_cloze: "Select the natural academic collocation for the blank:",
        ielts_grammar: "Choose the sentence with flawless academic grammar and structure:"
      }
    },

    zh: {
      subjectHsk: "HSK 5级",
      subjectIelts: "雅思英语",
      greeting: (u) => `欢迎您，${u}！`,
      historyBtn: "📜 学习记录",
      historyBtnTitle: "查看我的学习历史及成绩列表",
      autoTtsLabel: "🔊 自动发音",
      autoTtsTitle: "切换题目时自动播放母语原音",
      ttsSpeedTitle: "发音语速调节",
      speedSlow: "0.8x (慢速)",
      speedNormal: "1.0x (正常)",
      speedFast: "1.2x (快速)",
      voiceSelectTitle: "高清母语语音引擎选择",
      voiceAutoZh: "✨ 最优中文语音 (自动)",
      voiceAutoEn: "✨ 美式英语高清语音 (自动)",
      logoutTitle: "退出登录",

      hsk: {
        title: "HSK 5级智能测试",
        introTitle: "请选择 HSK 5级实战学习模式",
        introDesc: "词汇背诵、成语语境填空、阅读第一部分搭配、必备语法及实战听力，通过纯正发音全面掌握。",
        modes: {
          vocab: { name: "核心词汇测验", desc: "汉字/拼音 ➔ 释义与核心例句" },
          listening: { name: "实战听力测验", desc: "男女日常对话与短文听力问答训练" },
          chengyu: { name: "常用成语测验", desc: "语境选词填空与高频30成语含义掌握" },
          cloze: { name: "阅读第一部分填空", desc: "3秒速答！高频固定搭配强化训练" },
          grammar: { name: "必备语法与语序", desc: "把/被字句、存现句、关联词及句型排序" },
          mixed: { name: "综合全真模拟考试", desc: "听力、词汇、成语、填空、语法全方位模拟" }
        }
      },
      ielts: {
        title: "雅思 (IELTS) 英语大师测试",
        introTitle: "请选择雅思 (IELTS) 备考冲刺模式",
        introDesc: "覆盖 Band 7.0+ 学术词汇、Section 1~4 听力、高分习语、阅读搭配及写作复杂语法，纯正发音助力备考。",
        modes: {
          vocab: { name: "雅思核心词汇", desc: "Band 6.5~7.5+ 学术必备词汇与同义替换" },
          listening: { name: "实战听力训练", desc: "日常对话与学术讲座听力理解及问答" },
          chengyu: { name: "高分习语与短语", desc: "口语与写作提分必备地道惯用表达" },
          cloze: { name: "阅读搭配填空", desc: "学术高频固定词汇搭配 (Collocations)" },
          grammar: { name: "写作高分语法句型", desc: "倒装、虚拟、分词等 Band 7+ 复合句" },
          mixed: { name: "综合全真模拟考试", desc: "听力、词汇、习语、搭配、语法全方位模拟" }
        }
      },

      srsTitle: "智能间隔重复 (SRS) 学习进度",
      srsSubtitle: "答对的题目自动毕业（不再出题），答错的题目将在后续练习中循环强化直至掌握。",
      srsResetBtn: "🔄 重置进度",
      srsResetBtnTitle: "重置当前科目的掌握及错题记录",
      srsMastered: "🎓 已掌握 (答对题目)",
      srsReview: "🔁 待复习 (错题集中)",
      srsNew: "⏳ 未挑战题目",

      sectionMode: "1. 选择学习模式",
      sectionCount: "2. 选择题数",
      sectionDiff: "3. 选择难度",

      count5: "5题 (快速)",
      count10: "10题 (推荐)",
      count15: "15题 (强化)",
      countAll: "全部挑战",

      diffLabels: {
        "하": { label: "🟢 基础 (初级)", chip: "基础 (初级)", desc: "简短明了的基础核心词汇与日常对话" },
        "중": { label: "🟡 实战 (中级)", chip: "实战 (中级)", desc: "标准难度语境、反转陷阱听力、高频搭配" },
        "상": { label: "🔴 进阶 (高级)", chip: "进阶 (高级)", desc: "复杂长句说明文、深度推理与复杂语序" }
      },

      startBtn: "开始测验 🚀",

      progressText: (cur, total) => `第 ${cur} / ${total} 题`,
      currentScoreLabel: "当前得分:",
      quitBtn: "退出测验",
      audioBtn: "播放发音",
      audioBtnTitle: "重新播放原音",
      srsReviewBadge: "🔁 错题重点复习",
      listeningInstruction: "🎧 请仔细听对话并回答问题",
      listeningSubtext: "(与真实考试相同，题目仅以音频形式播放)",
      listeningPlay: "播放对话",
      listeningPause: "暂停",
      listeningResume: "继续播放",
      listeningReplay: "再次播放",
      listeningPausedStatus: "⏸️ 已暂停 (点击继续播放)",
      listeningFinishedStatus: "✅ 播放完成！请回答问题。",
      listeningRestart: "🔄 从头播放",
      listeningRestartTitle: "从头重新播放对话",
      defaultSubPrompt: "请选择该词汇的正确释义：",

      feedbackCorrectHsk: "🎉 回答正确！（该题目已标记为掌握，下次练习将排除）",
      feedbackWrongHsk: (ans) => `❌ 回答错误。正确答案是 [ ${ans} ]。（已加入错题复习本）`,
      feedbackCorrectIelts: "🎉 回答正确！（该题目已标记为掌握，下次练习将排除）",
      feedbackWrongIelts: (ans) => `❌ 回答错误。正确答案是 [ ${ans} ]。（已加入错题复习本）`,
      expCollocLabel: "💡 核心搭配/要点:",
      expDetailLabel: "📌 考点攻略解析:",
      transcriptTitle: "📜 听力原文文本 (录音脚本)",
      transcriptAudioBtn: "重听原文",
      transcriptQuestionBadge: "❓ 问题",
      exampleCardTitle: "📝 实用详细例句",
      exampleAudioBtn: "播放例句",
      nextBtn: "下一题 ➔",

      resultPassHsk: "达到及格标准 🏆",
      resultPassIelts: "达到目标成绩 🏆",
      resultFail: "需要复习 💡",
      resultCompleted: "测验已完成！",
      resultPassMsgHsk: "太棒了！答对的题目已牢固掌握，后续测验将重点强化错题。",
      resultPassMsgIelts: "表现优异！掌握的词汇已妥善保存，后续练习将重点针对薄弱点。",
      resultFailMsg: "答错的题目将在后续测验中自动循环出现，请继续加油复习！",
      resultDiffPrefix: "难度: ",
      retryBtn: "再做一次 🔄",
      viewHistoryBtn: "📜 查看学习记录",
      homeBtn: "返回主菜单 🏠",

      historyTitleHsk: "我的 HSK 5级学习记录",
      historyTitleIelts: "我的 雅思 (IELTS) 学习记录",
      statTotal: "总学习次数",
      statAvg: "平均正确率",
      statPass: "及格(60%↑)次数",
      historyListHeader: "学习历史列表",
      clearHistoryBtn: "清空全部记录",
      emptyHistory: "暂无学习记录。<br>快去开始第一次测验吧！💪",
      historyPassBadge: "及格",
      historyFailBadge: "需复习",

      alertNoQuestions: "没有可出的题目。请点击重置进度以重新练习已掌握的题目。",
      confirmQuit: "确定要退出当前测验并返回主菜单吗？",
      confirmResetProgress: (langName) => `确定要重置 ${langName} 的已掌握及错题记录吗？`,
      alertResetProgress: "进度已重置。您可以重新练习所有题目！",
      confirmClearHistory: "确定要删除所有学习历史记录吗？",

      authWelcome: "👋 欢迎使用！",
      authSubtitle: "请登录以继续学习。",
      authIdPlaceholder: "用户名",
      authPwPlaceholder: "密码",
      loginBtn: "登录",
      authNoAccount: "还没有账号？",
      authGoSignup: "立即注册",
      signupIdPlaceholder: "新用户名",
      signupPwPlaceholder: "密码",
      signupPwConfirmPlaceholder: "确认密码",
      signupBtn: "注册账号",
      authHaveAccount: "已有账号？",
      authGoLogin: "返回登录",
      footerTitle: "HSK 5级 & 雅思 (IELTS) 多语言智能学习平台",
      footerDesc: "基于 Web Speech API 提供母语级高清发音",

      prompts: {
        hsk_vocab_reverse: "请选择与释义对应的中文词汇：",
        hsk_vocab_meaning: "请选择该汉字词汇的正确释义：",
        hsk_listening: "🎧 请仔细听对话和问题，选择最正确的答案：",
        hsk_chengyu_cloze: "请选择最符合语境填空 [ ____ ] 的成语：",
        hsk_chengyu_meaning: "请选择该成语的正确含义：",
        hsk_cloze: "结合上下文语境与词语搭配，选择最合适填入的词汇：",
        hsk_grammar: "根据语法规则与语序，选择最正确的选项：",
        ielts_vocab_reverse: "请选择与释义对应的学术英语单词：",
        ielts_vocab_meaning: "请选择该学术英语单词的正确释义：",
        ielts_listening: "🎧 请仔细听录音内容，选择最符合题意的答案：",
        ielts_idiom_cloze: "请选择最合适填入横线 [ ____ ] 的地道习语：",
        ielts_idiom_meaning: "请选择该常用英语习语的正确含义：",
        ielts_cloze: "请选择横线处最自然地道的学术固定搭配：",
        ielts_grammar: "请选择语法与句型结构最标准规范的句子："
      }
    },

    en: {
      subjectHsk: "HSK Level 5",
      subjectIelts: "IELTS English",
      greeting: (u) => `Welcome, ${u}!`,
      historyBtn: "📜 History",
      historyBtnTitle: "View study history and score reports",
      autoTtsLabel: "🔊 Auto Audio",
      autoTtsTitle: "Automatically play native audio on question switch",
      ttsSpeedTitle: "Speech Speed Control",
      speedSlow: "0.8x (Slow)",
      speedNormal: "1.0x (Normal)",
      speedFast: "1.2x (Fast)",
      voiceSelectTitle: "High-Quality Native Voice Engine",
      voiceAutoZh: "✨ Optimal Chinese Voice (Auto)",
      voiceAutoEn: "✨ Optimal US English Voice (Auto)",
      logoutTitle: "Log Out",

      hsk: {
        title: "HSK Level 5 Smart Quiz",
        introTitle: "Select HSK Level 5 Study Mode",
        introDesc: "Conquer core vocabulary, contextual idioms, reading collocations, essential grammar, and real listening with authentic native pronunciation.",
        modes: {
          vocab: { name: "Core Vocabulary", desc: "Hanzi/Pinyin ➔ Definition & practical examples" },
          listening: { name: "Listening Practice", desc: "Dialogue & passage comprehension questions" },
          chengyu: { name: "Four-Character Idioms", desc: "Contextual cloze & essential top 30 idioms" },
          cloze: { name: "Reading Part 1 Cloze", desc: "Quick answer! Standard collocations training" },
          grammar: { name: "Grammar & Word Order", desc: "Ba/Bei sentences, existential verbs & syntax" },
          mixed: { name: "Comprehensive Mock Exam", desc: "Full simulation covering all 5 sections" }
        }
      },
      ielts: {
        title: "IELTS Master Quiz",
        introTitle: "Select IELTS Academic & General Prep Mode",
        introDesc: "Master Band 7.0+ academic vocabulary, Section 1~4 listening, high-scoring idioms, reading collocations, and writing grammar with native audio.",
        modes: {
          vocab: { name: "IELTS Core Vocab", desc: "Band 6.5~7.5+ academic vocabulary & synonyms" },
          listening: { name: "Listening Practice", desc: "Conversations & lectures listening comprehension" },
          chengyu: { name: "Idioms & Phrases", desc: "High-scoring natural expressions for Speaking & Writing" },
          cloze: { name: "Collocation Cloze", desc: "Academic frequent fixed collocations" },
          grammar: { name: "Writing Grammar & Syntax", desc: "Inversion, conditionals & Band 7+ complex structures" },
          mixed: { name: "Comprehensive Mock Exam", desc: "All-in-one test covering listening, vocab & grammar" }
        }
      },

      srsTitle: "Spaced Repetition (SRS) Status",
      srsSubtitle: "Mastered questions graduate from tests; incorrect questions repeat until mastered.",
      srsResetBtn: "🔄 Reset Progress",
      srsResetBtnTitle: "Reset mastery and review history for current subject",
      srsMastered: "🎓 Mastered (Correct)",
      srsReview: "🔁 Review Queue (Wrong)",
      srsNew: "⏳ Unattempted",

      sectionMode: "1. Select Study Mode",
      sectionCount: "2. Question Count",
      sectionDiff: "3. Difficulty Level",

      count5: "5 Questions (Quick)",
      count10: "10 Questions (Recommended)",
      count15: "15 Questions (Intensive)",
      countAll: "All Questions",

      diffLabels: {
        "하": { label: "🟢 Easy (Basic)", chip: "Easy (Basic)", desc: "Short, clear core vocabulary & daily dialogue" },
        "중": { label: "🟡 Medium (Standard)", chip: "Medium (Standard)", desc: "Standard exam context, listening traps & collocations" },
        "상": { label: "🔴 Hard (Advanced)", chip: "Hard (Advanced)", desc: "Complex expository texts, deep reasoning & syntax" }
      },

      startBtn: "Start Quiz 🚀",

      progressText: (cur, total) => `Question ${cur} / ${total}`,
      currentScoreLabel: "Current Score:",
      quitBtn: "Quit",
      audioBtn: "Listen",
      audioBtnTitle: "Replay native pronunciation",
      srsReviewBadge: "🔁 Focused Review",
      listeningInstruction: "🎧 Listen carefully and answer the question",
      listeningSubtext: "(Like the real exam, questions are played via audio only)",
      listeningPlay: "Play Audio",
      listeningPause: "Pause",
      listeningResume: "Resume",
      listeningReplay: "Replay",
      listeningPausedStatus: "⏸️ Paused (click Resume to continue)",
      listeningFinishedStatus: "✅ Audio finished! Choose your answer.",
      listeningRestart: "🔄 Restart",
      listeningRestartTitle: "Restart dialogue from the beginning",
      defaultSubPrompt: "Choose the correct meaning of this word:",

      feedbackCorrectHsk: "🎉 Correct! (Marked as mastered and excluded next time)",
      feedbackWrongHsk: (ans) => `❌ Incorrect. The answer is [ ${ans} ]. (Added to review list)`,
      feedbackCorrectIelts: "🎉 Correct! (Marked as mastered and excluded next time)",
      feedbackWrongIelts: (ans) => `❌ Incorrect. The answer is [ ${ans} ]. (Added to review list)`,
      expCollocLabel: "💡 Key Collocation/Point:",
      expDetailLabel: "📌 Strategy & Analysis:",
      transcriptTitle: "📜 Listening Transcript (Dialogue Script)",
      transcriptAudioBtn: "Replay Transcript",
      transcriptQuestionBadge: "❓ Question",
      exampleCardTitle: "📝 Practical Example Sentence",
      exampleAudioBtn: "Listen Example",
      nextBtn: "Next Question ➔",

      resultPassHsk: "Target Achieved 🏆",
      resultPassIelts: "Band Target Achieved 🏆",
      resultFail: "Needs Review 💡",
      resultCompleted: "Quiz Completed!",
      resultPassMsgHsk: "Great job! Mastered questions are saved. Future reviews will focus on mistakes.",
      resultPassMsgIelts: "Excellent work! Mastered items saved. Focus on incorrect answers next time.",
      resultFailMsg: "Incorrect questions will automatically reappear in future quizzes. Keep practicing!",
      resultDiffPrefix: "Difficulty: ",
      retryBtn: "Retry 🔄",
      viewHistoryBtn: "📜 View History",
      homeBtn: "Main Menu 🏠",

      historyTitleHsk: "My HSK Level 5 Study History",
      historyTitleIelts: "My IELTS Study History",
      statTotal: "Total Sessions",
      statAvg: "Average Accuracy",
      statPass: "Passed (60%+) Times",
      historyListHeader: "Session History List",
      clearHistoryBtn: "Clear All History",
      emptyHistory: "No study records yet.<br>Take your first quiz now! 💪",
      historyPassBadge: "Passed",
      historyFailBadge: "Review",

      alertNoQuestions: "No questions available. Please reset progress to practice mastered items again.",
      confirmQuit: "Do you want to quit the current quiz and return to the main menu?",
      confirmResetProgress: (langName) => `Are you sure you want to reset mastery and review progress for ${langName}?`,
      alertResetProgress: "Progress has been reset. All questions are available again!",
      confirmClearHistory: "Are you sure you want to delete all study history records?",

      authWelcome: "👋 Welcome!",
      authSubtitle: "Sign in to continue your learning journey.",
      authIdPlaceholder: "Username",
      authPwPlaceholder: "Password",
      loginBtn: "Log In",
      authNoAccount: "Don't have an account? ",
      authGoSignup: "Sign Up",
      signupIdPlaceholder: "New Username",
      signupPwPlaceholder: "Password",
      signupPwConfirmPlaceholder: "Confirm Password",
      signupBtn: "Sign Up",
      authHaveAccount: "Already have an account? ",
      authGoLogin: "Log In",
      footerTitle: "HSK Level 5 & IELTS Multilingual Smart Learning",
      footerDesc: "Powered by Web Speech API Native Audio",

      prompts: {
        hsk_vocab_reverse: "Choose the Chinese word matching the given meaning:",
        hsk_vocab_meaning: "Choose the correct meaning of the Chinese word:",
        hsk_listening: "🎧 Listen to the dialogue and question, then choose the best answer:",
        hsk_chengyu_cloze: "Choose the four-character idiom that best fits [ ____ ]:",
        hsk_chengyu_meaning: "Choose the correct meaning of this four-character idiom:",
        hsk_cloze: "Choose the best word based on sentence context and collocation:",
        hsk_grammar: "Choose the sentence with correct grammar and word order:",
        ielts_vocab_reverse: "Select the academic word that matches the meaning:",
        ielts_vocab_meaning: "Select the correct meaning for this academic word:",
        ielts_listening: "🎧 Listen carefully and select the most accurate answer:",
        ielts_idiom_cloze: "Choose the idiom that best fits the blank [ ____ ]:",
        ielts_idiom_meaning: "Select the correct meaning for this academic idiom:",
        ielts_cloze: "Select the natural academic collocation for the blank:",
        ielts_grammar: "Choose the sentence with flawless grammar and structure:"
      }
    }
  };

  function getSubjectConfig(subject, uiLang) {
    const lang = uiLang || currentUiLang || "ko";
    const t = I18N[lang] || I18N.ko;
    const sub = (subject === "ielts") ? "ielts" : "hsk";
    const conf = t[sub];
    const badges = { hsk: "HSK 5", ielts: "IELTS" };
    const icons = {
      hsk: { vocab: "🎯", listening: "🎧", chengyu: "🀄", cloze: "🔗", grammar: "📑", mixed: "🎲" },
      ielts: { vocab: "🎯", listening: "🎧", chengyu: "💡", cloze: "🔗", grammar: "📑", mixed: "🎲" }
    };
    const modes = {};
    if (conf && conf.modes) {
      Object.keys(conf.modes).forEach(k => {
        modes[k] = {
          name: conf.modes[k].name,
          desc: conf.modes[k].desc,
          icon: (icons[sub] && icons[sub][k]) || "🎯"
        };
      });
    }
    return {
      title: conf ? conf.title : "스마트 퀴즈",
      badge: badges[sub] || "QUIZ",
      introTitle: conf ? conf.introTitle : "",
      introDesc: conf ? conf.introDesc : "",
      modes: modes
    };
  }

  const modeConfigs = {
    get hsk() { return getSubjectConfig("hsk", currentUiLang); },
    get ielts() { return getSubjectConfig("ielts", currentUiLang); }
  };

  function getDiffInfo(diff, uiLang) {
    const d = diff || "중";
    const lang = uiLang || currentUiLang || "ko";
    const t = I18N[lang] || I18N.ko;
    const item = (t.diffLabels && t.diffLabels[d]) || { label: "🟡 중 (실전)", chip: "중 (실전)", desc: "" };
    const clsMap = { "하": "green", "중": "yellow", "상": "red" };
    return {
      label: item.label,
      chip: item.chip,
      cls: clsMap[d] || "yellow",
      desc: item.desc
    };
  }

  const diffLabels = {
    get "하"() { return getDiffInfo("하", currentUiLang); },
    get "중"() { return getDiffInfo("중", currentUiLang); },
    get "상"() { return getDiffInfo("상", currentUiLang); }
  };

  function getLocalizedPrompt(q, uiLang) {
    if (!q) return "";
    const t = I18N[uiLang || currentUiLang || "ko"] || I18N.ko;
    if (q.promptKey && t.prompts && t.prompts[q.promptKey]) {
      return t.prompts[q.promptKey];
    }
    return q.prompt || t.defaultSubPrompt;
  }

  function updateUserGreeting(user) {
    const u = user !== undefined ? user : localStorage.getItem("loggedInUser");
    if (userGreeting) {
      if (u) {
        const t = I18N[currentUiLang] || I18N.ko;
        userGreeting.innerText = t.greeting(u);
      } else {
        userGreeting.innerText = "";
      }
    }
  }
  window.updateUserGreeting = updateUserGreeting;

  // 로그인/로그아웃 시 앱 상태 및 유저별 SRS 대시보드 즉시 동기화
  window.onAuthStateChanged = function (user) {
    stopListeningAudio();
    closeHistory();
    updateUserGreeting(user);
    updateSrsDashboard();
    showView("setup");
  };

  // UI 언어 적용 함수
  function applyUiLanguage(uiLang) {
    currentUiLang = uiLang || "ko";
    const t = I18N[currentUiLang] || I18N.ko;

    // 1. 언어 선택 탭 활성화 상태
    uiLangTabs.forEach(tab => {
      if (tab.getAttribute("data-ui-lang") === currentUiLang) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // 2. 과목 스위처 탭 텍스트
    if (tabHskText) tabHskText.textContent = t.subjectHsk;
    if (tabIeltsText) tabIeltsText.textContent = t.subjectIelts;

    // 3. 헤더 및 소개 정보
    const conf = getSubjectConfig(currentLanguage, currentUiLang);
    if (logoBadge) logoBadge.textContent = conf.badge;
    if (appTitle) appTitle.textContent = conf.title;
    if (introTitle) introTitle.textContent = conf.introTitle;
    if (introDesc) introDesc.textContent = conf.introDesc;

    updateUserGreeting();
    if (logoutBtn) logoutBtn.title = t.logoutTitle;
    if (openHistoryBtn) {
      openHistoryBtn.textContent = t.historyBtn;
      openHistoryBtn.title = t.historyBtnTitle;
    }
    if (autoTtsLabel) autoTtsLabel.textContent = t.autoTtsLabel;
    if (ttsToggleWrap) ttsToggleWrap.title = t.autoTtsTitle;
    if (ttsSpeedSelect) ttsSpeedSelect.title = t.ttsSpeedTitle;
    if (optSpeedSlow) optSpeedSlow.textContent = t.speedSlow;
    if (optSpeedNormal) optSpeedNormal.textContent = t.speedNormal;
    if (optSpeedFast) optSpeedFast.textContent = t.speedFast;
    if (ttsVoiceSelect) ttsVoiceSelect.title = t.voiceSelectTitle;

    // 4. SRS 상태 카드
    if (srsTitle) srsTitle.textContent = t.srsTitle;
    if (srsSubtitle) srsSubtitle.textContent = t.srsSubtitle;
    if (resetProgressBtn) {
      resetProgressBtn.textContent = t.srsResetBtn;
      resetProgressBtn.title = t.srsResetBtnTitle;
    }
    if (srsMasteredLabel) srsMasteredLabel.textContent = t.srsMastered;
    if (srsReviewLabel) srsReviewLabel.textContent = t.srsReview;
    if (srsNewLabel) srsNewLabel.textContent = t.srsNew;

    // 5. 모드, 문항수, 난이도 선택 섹션 타이틀 및 버튼들
    if (sectionModeTitle) sectionModeTitle.textContent = t.sectionMode;
    if (sectionCountTitle) sectionCountTitle.textContent = t.sectionCount;
    if (sectionDiffTitle) sectionDiffTitle.textContent = t.sectionDiff;

    if (countBtn5) countBtn5.textContent = t.count5;
    if (countBtn10) countBtn10.textContent = t.count10;
    if (countBtn15) countBtn15.textContent = t.count15;
    if (countBtnAll) countBtnAll.textContent = t.countAll;

    diffBtns.forEach(btn => {
      const d = btn.getAttribute("data-diff");
      const dInfo = getDiffInfo(d, currentUiLang);
      const b = btn.querySelector(".diff-badge");
      const desc = btn.querySelector(".diff-desc");
      if (b) b.textContent = dInfo.label;
      if (desc) desc.textContent = dInfo.desc;
    });

    if (startBtn) startBtn.textContent = t.startBtn;
    renderModeGrid();

    // 6. 퀴즈 화면 라벨 및 컨트롤
    if (scoreLabel) scoreLabel.textContent = t.currentScoreLabel;
    if (quitBtn) quitBtn.textContent = t.quitBtn;
    if (ttsBtnText) ttsBtnText.textContent = t.audioBtn;
    if (ttsBtn) ttsBtn.title = t.audioBtnTitle;
    if (questionSrsBadge) questionSrsBadge.textContent = t.srsReviewBadge;
    if (listeningStatusText && !isListeningPlaying && !isListeningPaused) {
      listeningStatusText.textContent = t.listeningInstruction;
    }
    if (listeningSubtext) listeningSubtext.textContent = t.listeningSubtext;
    if (listeningRestartLabel) listeningRestartLabel.textContent = t.listeningRestart;
    if (listeningRestartBtn) listeningRestartBtn.title = t.listeningRestartTitle;

    if (expCollocLabel) expCollocLabel.textContent = t.expCollocLabel;
    if (expDetailLabel) expDetailLabel.textContent = t.expDetailLabel;
    if (transcriptTitle) transcriptTitle.textContent = t.transcriptTitle;
    if (transcriptAudioBtnText) transcriptAudioBtnText.textContent = t.transcriptAudioBtn;
    if (transcriptAudioBtn) transcriptAudioBtn.title = t.transcriptAudioBtn;
    if (transcriptQuestionBadge) transcriptQuestionBadge.textContent = t.transcriptQuestionBadge;
    if (exampleCardTitle) exampleCardTitle.textContent = t.exampleCardTitle;
    if (expAudioBtnText) expAudioBtnText.textContent = t.exampleAudioBtn;
    if (expAudioBtn) expAudioBtn.title = t.exampleAudioBtn;
    if (nextBtn) nextBtn.textContent = t.nextBtn;

    if (quizView && quizView.classList.contains("active") && questions.length > 0) {
      const meta = conf.modes[currentMode] || { name: "퀴즈", icon: "🎯" };
      if (quizModeTag) quizModeTag.textContent = `${meta.icon} ${meta.name}`;
      const curDInfo = getDiffInfo(currentDifficulty, currentUiLang);
      if (quizDiffTag) quizDiffTag.textContent = curDInfo.label;
      if (progressText) progressText.textContent = t.progressText(currentIndex + 1, questions.length);
      const curQ = questions[currentIndex];
      if (curQ && subPrompt) subPrompt.textContent = getLocalizedPrompt(curQ, currentUiLang);
    }

    // 7. 결과 화면 번역
    if (resultTitle) resultTitle.textContent = t.resultCompleted;
    if (retryBtn) retryBtn.textContent = t.retryBtn;
    if (viewHistoryBtn) viewHistoryBtn.textContent = t.viewHistoryBtn;
    if (homeBtn) homeBtn.textContent = t.homeBtn;
    if (resultView && resultView.classList.contains("active") && questions.length > 0) {
      const pct = Math.round((score / questions.length) * 100);
      const isPass = pct >= 60;
      const curDInfo = getDiffInfo(currentDifficulty, currentUiLang);
      if (resultDiffBadge) resultDiffBadge.textContent = `${t.resultDiffPrefix}${curDInfo.label}`;
      if (isPass) {
        if (resultBadge) resultBadge.textContent = (currentLanguage === "hsk") ? t.resultPassHsk : t.resultPassIelts;
        if (resultMessage) resultMessage.textContent = (currentLanguage === "hsk") ? t.resultPassMsgHsk : t.resultPassMsgIelts;
      } else {
        if (resultBadge) resultBadge.textContent = t.resultFail;
        if (resultMessage) resultMessage.textContent = t.resultFailMsg;
      }
    }

    // 8. 학습 기록 모달
    if (historyModalTitle) historyModalTitle.textContent = (currentLanguage === "hsk") ? t.historyTitleHsk : t.historyTitleIelts;
    if (statTotalLabel) statTotalLabel.textContent = t.statTotal;
    if (statAvgLabel) statAvgLabel.textContent = t.statAvg;
    if (statPassLabel) statPassLabel.textContent = t.statPass;
    if (historyListHeaderTitle) historyListHeaderTitle.textContent = t.historyListHeader;
    if (clearHistoryBtn) clearHistoryBtn.textContent = t.clearHistoryBtn;
    if (historyModal && !historyModal.classList.contains("hidden")) {
      renderHistoryModal();
    }

    // 9. Auth 화면
    if (authTitle) authTitle.textContent = t.authWelcome;
    if (authDesc) authDesc.textContent = t.authSubtitle;
    if (authId) authId.placeholder = t.authIdPlaceholder;
    if (authPw) authPw.placeholder = t.authPwPlaceholder;
    if (loginBtn) loginBtn.textContent = t.loginBtn;
    if (authNoAccText) authNoAccText.textContent = t.authNoAccount;
    if (goSignup) goSignup.textContent = t.authGoSignup;
    if (signupId) signupId.placeholder = t.signupIdPlaceholder;
    if (signupPw) signupPw.placeholder = t.signupPwPlaceholder;
    if (signupPwConfirm) signupPwConfirm.placeholder = t.signupPwConfirmPlaceholder;
    if (signupBtn) signupBtn.textContent = t.signupBtn;
    if (authHaveAccText) authHaveAccText.textContent = t.authHaveAccount;
    if (goLogin) goLogin.textContent = t.authGoLogin;

    // 10. 푸터
    if (footerText1) footerText1.textContent = t.footerTitle;
    if (footerText2) footerText2.textContent = t.footerDesc;

    initVoices();
  }

  function setUiLanguage(uiLang) {
    currentUiLang = uiLang;
    localStorage.setItem("preferred_ui_lang", uiLang);
    applyUiLanguage(uiLang);
  }

  // 1. JSON 데이터 비동기 로딩 (전역 번들 우선 사용 -> fetch 폴백)
  async function loadData() {
    if (window.APP_DATA) {
      hskData = window.APP_DATA.hsk || {};
      ieltsData = window.APP_DATA.ielts || {};
      console.log("다국어 통합 번들 데이터 로딩 완료! (HSK & IELTS)");
      return;
    }
    if (window.HSK5_DATA) {
      hskData = window.HSK5_DATA;
    }

    try {
      const [hv, hc, hch, hcl, hg, hl, iv, il, ii, ic, ig] = await Promise.all([
        fetch("vocab/hsk5_core_vocabulary.json").then(r => r.json()).catch(() => []),
        fetch("vocab/hsk5_collocations.json").then(r => r.json()).catch(() => []),
        fetch("vocab/hsk5_chengyu.json").then(r => r.json()).catch(() => []),
        fetch("vocab/hsk5_cloze.json").then(r => r.json()).catch(() => []),
        fetch("vocab/hsk5_grammar.json").then(r => r.json()).catch(() => []),
        fetch("vocab/hsk5_listening.json").then(r => r.json()).catch(() => []),
        fetch("ielts/ielts_vocab.json").then(r => r.json()).catch(() => []),
        fetch("ielts/ielts_listening.json").then(r => r.json()).catch(() => []),
        fetch("ielts/ielts_idioms.json").then(r => r.json()).catch(() => []),
        fetch("ielts/ielts_cloze.json").then(r => r.json()).catch(() => []),
        fetch("ielts/ielts_grammar.json").then(r => r.json()).catch(() => [])
      ]);

      hskData = { vocab: hv, colloc: hc, chengyu: hch, cloze: hcl, grammar: hg, listening: hl };
      ieltsData = { vocab: iv, listening: il, idioms: ii, cloze: ic, grammar: ig };
    } catch (err) {
      console.error("데이터 로딩 중 오류 발생:", err);
    }
  }

  // 2. 스마트 오답/마스터(SRS) 진행 상태 관리
  function getMasteryState() {
    try {
      const raw = localStorage.getItem(getMasteryKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function getItemKey(lang, item) {
    if (!item) return "";
    const mainId = item.id || item.word || item.chengyu || item.idiom ||
                   (item.question ? item.question.slice(0, 18) : "") ||
                   (item.sentence ? item.sentence.slice(0, 18) : "");
    return `${lang}_${mainId}`;
  }

  function updateItemMastery(lang, rawItem, isCorrect) {
    if (!rawItem) return;
    const key = getItemKey(lang, rawItem);
    const mastery = getMasteryState();
    const entry = mastery[key] || { correctCount: 0, wrongCount: 0, status: "new" };

    if (isCorrect) {
      entry.correctCount = (entry.correctCount || 0) + 1;
      entry.status = "mastered"; // 맞춘 문제는 '마스터 완료' (다음 시도 출제 제외)
    } else {
      entry.wrongCount = (entry.wrongCount || 0) + 1;
      entry.status = "review"; // 틀린 문제는 '집중 복습' (다음 시도 우선 출제)
    }
    entry.lastUpdated = Date.now();
    mastery[key] = entry;

    try {
      localStorage.setItem(getMasteryKey(), JSON.stringify(mastery));
    } catch (e) {}

    updateSrsDashboard();
  }

  function updateSrsDashboard() {
    const mastery = getMasteryState();
    let totalItemsCount = 0;

    if (currentLanguage === "hsk") {
      totalItemsCount = (hskData.vocab?.length || 0) +
                        (hskData.listening?.length || 0) +
                        (hskData.chengyu?.length || 0) +
                        (hskData.cloze?.length || 0) +
                        (hskData.grammar?.length || 0);
    } else {
      totalItemsCount = (ieltsData.vocab?.length || 0) +
                        (ieltsData.listening?.length || 0) +
                        (ieltsData.idioms?.length || 0) +
                        (ieltsData.cloze?.length || 0) +
                        (ieltsData.grammar?.length || 0);
    }

    let mastered = 0;
    let review = 0;
    const prefix = `${currentLanguage}_`;

    Object.keys(mastery).forEach(k => {
      if (k.startsWith(prefix)) {
        if (mastery[k].status === "mastered") mastered++;
        else if (mastery[k].status === "review") review++;
      }
    });

    const remaining = Math.max(0, totalItemsCount - (mastered + review));

    if (srsMasteredCount) srsMasteredCount.textContent = mastered;
    if (srsReviewCount) srsReviewCount.textContent = review;
    if (srsNewCount) srsNewCount.textContent = remaining;
  }

  function resetCurrentLangProgress() {
    const t = I18N[currentUiLang] || I18N.ko;
    const mastery = getMasteryState();
    const prefix = `${currentLanguage}_`;
    Object.keys(mastery).forEach(k => {
      if (k.startsWith(prefix)) {
        delete mastery[k];
      }
    });
    localStorage.setItem(getMasteryKey(), JSON.stringify(mastery));
    updateSrsDashboard();
  }

  // 3. 다국어 고음질 음성(TTS) 탐색 및 정렬
  function initVoices() {
    if (!("speechSynthesis" in window)) return;
    const allVoices = window.speechSynthesis.getVoices();
    const t = I18N[currentUiLang] || I18N.ko;

    if (currentLanguage === "hsk") {
      const zhVoices = allVoices.filter(v =>
        v.lang === "zh-CN" || v.lang === "zh_CN" || v.lang.startsWith("zh") || v.lang.includes("cmn")
      );

      function zhScore(v) {
        const name = v.name.toLowerCase();
        if (name.includes("google")) return 100;
        if (name.includes("enhanced") || name.includes("premium")) return 90;
        if (name.includes("tingting")) return 80;
        if (name.includes("mei-jia") || name.includes("sinji")) return 70;
        return 10;
      }

      zhVoices.sort((a, b) => zhScore(b) - zhScore(a));
      availableVoices = zhVoices;

      if (ttsVoiceSelect) {
        ttsVoiceSelect.innerHTML = `<option value="auto">${t.voiceAutoZh}</option>`;
        zhVoices.forEach(v => {
          const opt = document.createElement("option");
          opt.value = v.voiceURI || v.name;
          let label = v.name;
          if (v.name.includes("Google")) label = "Google 번역기 음성 (고음질)";
          else if (v.name.includes("Tingting")) label = "Apple Tingting (원어민 婷婷)";
          else if (v.name.includes("Mei-Jia")) label = "Apple Mei-Jia (미가)";
          opt.textContent = label;
          ttsVoiceSelect.appendChild(opt);
        });
      }
    } else {
      const enVoices = allVoices.filter(v => v.lang.startsWith("en"));

      function enScore(v) {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        if (name.includes("google") && lang.includes("us")) return 100;
        if (name.includes("samantha") || name.includes("alex")) return 90;
        if (lang.includes("us")) return 80;
        if (name.includes("daniel") || lang.includes("gb")) return 70;
        if (name.includes("karen") || lang.includes("au")) return 60;
        return 20;
      }

      enVoices.sort((a, b) => enScore(b) - enScore(a));
      availableVoices = enVoices;

      if (ttsVoiceSelect) {
        ttsVoiceSelect.innerHTML = `<option value="auto">${t.voiceAutoEn}</option>`;
        enVoices.forEach(v => {
          const opt = document.createElement("option");
          opt.value = v.voiceURI || v.name;
          let label = v.name;
          if (v.name.includes("Google") && v.lang.includes("US")) label = "Google US English (고음질)";
          else if (v.name.includes("Samantha")) label = "Apple Samantha (미국 원어민)";
          else if (v.name.includes("Alex")) label = "Apple Alex (미국 표준)";
          else if (v.name.includes("Daniel")) label = "Apple Daniel (영국식 UK)";
          opt.textContent = label;
          ttsVoiceSelect.appendChild(opt);
        });
      }
    }

    selectedVoice = availableVoices[0] || null;
  }

  if ("speechSynthesis" in window) {
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
  }

  ttsVoiceSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "auto") {
      selectedVoice = availableVoices[0] || null;
    } else {
      selectedVoice = availableVoices.find(v => (v.voiceURI || v.name) === val) || availableVoices[0];
    }
  });

  // 과목 전환 핸들러
  function setLanguage(lang) {
    currentLanguage = lang;
    stopListeningAudio();

    if (lang === "ielts") {
      langHskBtn.classList.remove("active");
      langIeltsBtn.classList.add("active");
      document.body.classList.add("theme-ielts");
      logoBadge.className = "logo-badge ielts";
    } else {
      langIeltsBtn.classList.remove("active");
      langHskBtn.classList.add("active");
      document.body.classList.remove("theme-ielts");
      logoBadge.className = "logo-badge";
    }

    applyUiLanguage(currentUiLang);
    updateSrsDashboard();
    showView("setup");
  }

  function renderModeGrid() {
    const modes = modeConfigs[currentLanguage].modes;
    modeGrid.innerHTML = "";
    Object.keys(modes).forEach((key) => {
      const m = modes[key];
      const card = document.createElement("div");
      card.className = `mode-card ${key === currentMode ? "active" : ""}`;
      card.setAttribute("data-mode", key);
      card.innerHTML = `
        <div class="mode-icon">${m.icon}</div>
        <div class="mode-info">
          <div class="mode-name">${m.name}</div>
          <div class="mode-desc">${m.desc}</div>
        </div>
      `;
      card.addEventListener("click", () => {
        document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        currentMode = key;
      });
      modeGrid.appendChild(card);
    });
  }

  // 발음 재생 (빈칸 기호 제거 및 세션 토큰으로 충돌 방지)
  function playAudio(text, targetBtn) {
    if (!text || !("speechSynthesis" in window)) return;

    stopListeningAudio();
    const mySession = ++speechSessionId;

    const cleanText = text.replace(/____|\[\s*____\s*\]|【|】/g, " ").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = (currentLanguage === "hsk") ? "zh-CN" : "en-US";
    utterance.rate = ttsSpeed;
    if (selectedVoice) utterance.voice = selectedVoice;

    const btn = targetBtn || ttsBtn;
    if (btn) btn.classList.add("playing");
    utterance.onend = () => {
      if (mySession === speechSessionId && btn) btn.classList.remove("playing");
    };
    utterance.onerror = () => {
      if (mySession === speechSessionId && btn) btn.classList.remove("playing");
    };

    window.speechSynthesis.speak(utterance);
  }

  // Web Audio API 기반 정답 / 오답 효과음 신시사이저
  let audioContext = null;

  function getAudioCtx() {
    if (!audioContext) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioContext = new AudioCtxClass();
      }
    }
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }
    return audioContext;
  }

  function playCorrectSound() {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.33);
      });
    } catch (e) {
      console.warn("오디오 재생 오류:", e);
    }
  }

  function playWrongSound() {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const notes = [220.0, 164.81]; // A3 -> E3
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.26);
      });
    } catch (e) {
      console.warn("오디오 재생 오류:", e);
    }
  }

  // 4. 실전 듣기(Listening) 순차 발음 및 일시정지 엔진
  function prepareListening(q) {
    stopListeningAudio();
    listeningSegments = [];

    if (q.dialogue && q.dialogue.length > 0) {
      q.dialogue.forEach(d => {
        listeningSegments.push({
          role: d.speaker,
          text: `${d.speaker}: ${d.text}`
        });
      });
    }
    if (q.questionText) {
      listeningSegments.push({
        role: (currentLanguage === "hsk" ? "질문" : "Question"),
        text: (currentLanguage === "hsk" ? "问题：" : "Question: ") + q.questionText
      });
    }

    currentSegmentIdx = 0;
    isListeningPlaying = false;
    isListeningPaused = false;
    updatePlayerUI("idle");
  }

  function playListeningFromCurrent() {
    if (!listeningSegments || listeningSegments.length === 0) return;
    if (currentSegmentIdx >= listeningSegments.length) {
      currentSegmentIdx = 0;
    }

    clearTimeout(dialogueTimer);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechSessionId++;
    isListeningPlaying = true;
    isListeningPaused = false;
    updatePlayerUI("playing");
    playNextSegment(speechSessionId);
  }

  function playNextSegment(sessionId) {
    if (sessionId !== speechSessionId || !isListeningPlaying || isListeningPaused) return;

    if (currentSegmentIdx >= listeningSegments.length) {
      isListeningPlaying = false;
      isListeningPaused = false;
      updatePlayerUI("finished");
      return;
    }

    const seg = listeningSegments[currentSegmentIdx];
    const roleLabel = (currentLanguage === "hsk") ? `${seg.role} 청취 중...` : `Listening to ${seg.role}...`;
    listeningStatusText.textContent = `🎧 ${roleLabel} (${currentSegmentIdx + 1}/${listeningSegments.length})`;

    if (!("speechSynthesis" in window)) {
      isListeningPlaying = false;
      updatePlayerUI("finished");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(seg.text);
    utterance.lang = (currentLanguage === "hsk") ? "zh-CN" : "en-US";
    utterance.rate = ttsSpeed;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      if (sessionId !== speechSessionId || !isListeningPlaying || isListeningPaused) return;
      currentSegmentIdx++;
      const delay = (currentSegmentIdx === listeningSegments.length - 1) ? 700 : 500;
      dialogueTimer = setTimeout(() => {
        playNextSegment(sessionId);
      }, delay);
    };

    utterance.onerror = (ev) => {
      if (sessionId !== speechSessionId || !isListeningPlaying || isListeningPaused) return;
      if (ev && (ev.error === "canceled" || ev.error === "interrupted")) return;
      currentSegmentIdx++;
      playNextSegment(sessionId);
    };

    window.speechSynthesis.speak(utterance);
  }

  function pauseListeningAudio() {
    if (!isListeningPlaying) return;
    speechSessionId++;
    isListeningPaused = true;
    clearTimeout(dialogueTimer);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    updatePlayerUI("paused");
  }

  function resumeListeningAudio() {
    if (!isListeningPaused) return;
    speechSessionId++;
    isListeningPaused = false;
    isListeningPlaying = true;
    updatePlayerUI("playing");
    playNextSegment(speechSessionId);
  }

  function stopListeningAudio() {
    speechSessionId++;
    isListeningPlaying = false;
    isListeningPaused = false;
    clearTimeout(dialogueTimer);
    clearTimeout(autoTtsTimer);
    if (ttsBtn) ttsBtn.classList.remove("playing");
    if (expAudioBtn) expAudioBtn.classList.remove("playing");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    updatePlayerUI("idle");
  }

  function updatePlayerUI(state) {
    const t = I18N[currentUiLang] || I18N.ko;
    if (state === "playing") {
      audioWavesWrap.className = "audio-waves-wrap";
      playPauseIcon.textContent = "⏸️";
      playPauseLabel.textContent = t.listeningPause;
    } else if (state === "paused") {
      audioWavesWrap.className = "audio-waves-wrap paused";
      playPauseIcon.textContent = "▶️";
      playPauseLabel.textContent = t.listeningResume;
      listeningStatusText.textContent = t.listeningPausedStatus;
    } else if (state === "finished") {
      audioWavesWrap.className = "audio-waves-wrap stopped";
      playPauseIcon.textContent = "▶️";
      playPauseLabel.textContent = t.listeningReplay;
      listeningStatusText.textContent = t.listeningFinishedStatus;
    } else if (state === "idle") {
      audioWavesWrap.className = "audio-waves-wrap stopped";
      playPauseIcon.textContent = "▶️";
      playPauseLabel.textContent = t.listeningPlay;
      listeningStatusText.textContent = t.listeningInstruction;
    }
  }

  // 5. 난이도 및 SRS(오답 반복 / 맞춘 문제 제외) 정밀 필터링 엔진
  function filterByDifficultyAndSrs(items, diff, requestedCount) {
    if (!items || items.length === 0) return [];
    const mastery = getMasteryState();

    // 난이도 계층 분리: 1순위(선택 난이도) -> 2순위(인접 난이도) -> 3순위(나머지 난이도)
    const tier1 = items.filter(it => it.difficulty === diff);
    let tier2 = [];
    let tier3 = [];
    if (diff === "하") {
      tier2 = items.filter(it => it.difficulty === "중");
      tier3 = items.filter(it => it.difficulty !== "하" && it.difficulty !== "중");
    } else if (diff === "상") {
      tier2 = items.filter(it => it.difficulty === "중");
      tier3 = items.filter(it => it.difficulty !== "상" && it.difficulty !== "중");
    } else {
      tier2 = items.filter(it => it.difficulty === "하" || it.difficulty === "상");
      tier3 = items.filter(it => it.difficulty !== "중" && it.difficulty !== "하" && it.difficulty !== "상");
    }

    function splitBySrs(list) {
      const review = [];
      const fresh = [];
      const mastered = [];
      list.forEach(it => {
        const k = getItemKey(currentLanguage, it);
        const st = mastery[k] ? mastery[k].status : "new";
        if (st === "review") {
          review.push({ ...it, _isReview: true });
        } else if (st === "mastered") {
          mastered.push({ ...it, _isReview: false });
        } else {
          fresh.push({ ...it, _isReview: false });
        }
      });
      return {
        review: shuffle(review),
        fresh: shuffle(fresh),
        mastered: shuffle(mastered)
      };
    }

    const s1 = splitBySrs(tier1);
    const s2 = splitBySrs(tier2);
    const s3 = splitBySrs(tier3);

    // '전체 풀기' 선택 시: 선택된 난이도(tier1)의 미마스터 문제를 우선 출제하고, 모두 마스터했다면 tier1 전체 출제
    if (requestedCount === "all") {
      let allPool = [...s1.review, ...s1.fresh, ...s2.review, ...s2.fresh, ...s3.review, ...s3.fresh];
      if (allPool.length === 0) {
        allPool = [...s1.mastered, ...s2.mastered, ...s3.mastered];
      }
      const uniqueAll = [];
      const seenAll = new Set();
      for (const item of allPool) {
        const key = getItemKey(currentLanguage, item);
        if (!seenAll.has(key)) {
          seenAll.add(key);
          uniqueAll.push(item);
        }
      }
      return uniqueAll;
    }

    const need = requestedCount;

    // 우선순위 큐:
    // 1순위: 선택 난이도 오답 복습(review) -> 2순위: 선택 난이도 신규(fresh)
    // 3순위: 인접 난이도 오답 복습 -> 4순위: 인접 난이도 신규
    // 5순위: 기타 난이도 오답 복습 -> 6순위: 기타 난이도 신규
    // 7순위(모두 마스터한 경우): 선택 난이도 마스터 -> 인접 난이도 마스터 -> 기타 난이도 마스터
    const priorityBuckets = [
      s1.review,
      s1.fresh,
      s2.review,
      s2.fresh,
      s3.review,
      s3.fresh,
      s1.mastered,
      s2.mastered,
      s3.mastered
    ];

    const selected = [];
    const seen = new Set();

    for (const bucket of priorityBuckets) {
      for (const item of bucket) {
        if (selected.length >= need) break;
        const key = getItemKey(currentLanguage, item);
        if (!seen.has(key)) {
          seen.add(key);
          selected.push(item);
        }
      }
      if (selected.length >= need) break;
    }

    return selected;
  }

  // 6. 문제 생성 엔진 (HSK & IELTS 다국어 분기 - 정답 노출 완벽 차단)
  function buildQuestions(lang, mode, count, diff) {
    let rawItems = [];

    if (lang === "hsk") {
      if (mode === "vocab") {
        const filtered = filterByDifficultyAndSrs(hskData.vocab, diff, count);
        let items = [];
        filtered.forEach(item => {
          const isReverse = Math.random() < 0.5;
          const exampleTranslation = item.translation
            ? `${item.translation} (뜻: ${item.meaning})`
            : `[뜻] ${item.meaning}`;

          if (isReverse) {
            const wrongPool = hskData.vocab.filter(v => v.word !== item.word).map(v => v.word);
            const options = shuffle([item.word, ...sampleArray(wrongPool, 3)]);
            items.push({
              type: "vocab",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: `어휘 (${item.pos || "단어"}) [한국어➔중국어]`,
              chinese: item.meaning,
              pinyin: "",
              // 정답 선택 전에는 중국어 단어 발음이 재생되어 정답이 스포일러되지 않도록 차단
              speechText: "",
              postAnswerSpeechText: item.word,
              postAnswerPinyin: `${item.word} [${item.pinyin}]`,
              promptKey: "hsk_vocab_reverse",
              prompt: "제시된 뜻을 가진 중국어 단어를 고르세요.",
              options: options,
              answer: item.word,
              collocation: `단어: ${item.word} [${item.pinyin}] - ${item.pos}`,
              detail: "HSK 5급 필수 빈출 어휘입니다.",
              exampleCn: item.example || item.word,
              exampleKr: exampleTranslation
            });
          } else {
            const wrongPool = hskData.vocab.filter(v => v.meaning !== item.meaning).map(v => v.meaning);
            const options = shuffle([item.meaning, ...sampleArray(wrongPool, 3)]);
            items.push({
              type: "vocab",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: `어휘 (${item.pos || "단어"})`,
              chinese: item.word,
              pinyin: item.pinyin,
              speechText: item.word,
              promptKey: "hsk_vocab_meaning",
              prompt: "다음 한자 단어의 올바른 한국어 뜻을 고르세요.",
              options: options,
              answer: item.meaning,
              collocation: `단어: ${item.word} [${item.pinyin}] - ${item.pos}`,
              detail: "HSK 5급 필수 빈출 어휘입니다. 예문과 함께 기억해 두세요.",
              exampleCn: item.example || item.word,
              exampleKr: exampleTranslation
            });
          }
        });
        rawItems = items;
      } else if (mode === "listening") {
        const filtered = filterByDifficultyAndSrs(hskData.listening, diff, count);
        rawItems = filtered.map(item => {
          return {
            type: "listening",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: item.category,
            chinese: item.question,
            pinyin: "",
            speechText: item.audioText,
            promptKey: "hsk_listening",
            prompt: "🎧 대화와 질문을 잘 듣고, 알맞은 답을 고르세요.",
            options: shuffle([...item.options]),
            answer: item.answer,
            dialogue: item.dialogue,
            questionText: item.question,
            collocation: `출제 영역: ${item.category}`,
            detail: item.tip,
            translation: item.translation,
            exampleCn: item.audioText,
            exampleKr: item.translation
          };
        });
      } else if (mode === "chengyu") {
        const filtered = filterByDifficultyAndSrs(hskData.chengyu, diff, count);
        rawItems = filtered.map((item, idx) => {
          const isCloze = (idx % 2 === 0);
          const fullExampleCn = item.example || (item.sentence ? item.sentence.replace("____", item.chengyu) : item.chengyu);
          const fullExampleKr = item.translation
            ? `${item.translation} (성어 뜻: ${item.meaning})`
            : `[성어 의미] ${item.meaning}`;

          if (isCloze && item.sentence) {
            const wrongPool = hskData.chengyu.filter(c => c.chengyu !== item.chengyu).map(c => `${c.chengyu} (${c.pinyin})`);
            const correctVal = `${item.chengyu} (${item.pinyin})`;
            const options = shuffle([correctVal, ...sampleArray(wrongPool, 3)]);
            return {
              type: "chengyu_cloze",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: "사자성어 문맥 빈칸",
              chinese: item.sentence,
              // 문제 풀이 중 정답 성어가 중간(#main-pinyin)에 노출되지 않도록 빈 문자열 유지
              pinyin: "",
              postAnswerPinyin: `${item.chengyu} [${item.pinyin}]`,
              // 문제 풀이 중에는 빈칸 문장을 읽고, 정답 선택 후 완성 문장 발음 지원
              speechText: item.sentence,
              postAnswerSpeechText: fullExampleCn,
              promptKey: "hsk_chengyu_cloze",
              prompt: "문맥의 빈칸 [ ____ ] 에 가장 어울리는 사자성어를 고르세요.",
              options: options,
              answer: correctVal,
              collocation: `성어 배합: ${item.chengyu} [${item.pinyin}]`,
              detail: `의미: ${item.meaning} (HSK 5급 가산점 필수 성어)`,
              exampleCn: fullExampleCn,
              exampleKr: fullExampleKr
            };
          } else {
            const wrongPool = hskData.chengyu.filter(c => c.meaning !== item.meaning).map(c => c.meaning);
            const options = shuffle([item.meaning, ...sampleArray(wrongPool, 3)]);
            return {
              type: "chengyu_meaning",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: "사자성어 뜻",
              chinese: item.chengyu,
              pinyin: item.pinyin,
              speechText: item.chengyu,
              promptKey: "hsk_chengyu_meaning",
              prompt: "다음 사자성어의 한국어 의미로 알맞은 것을 고르세요.",
              options: options,
              answer: item.meaning,
              collocation: `성어: ${item.chengyu} [${item.pinyin}]`,
              detail: "5급 초빈출 30대 사자성어입니다.",
              exampleCn: fullExampleCn,
              exampleKr: fullExampleKr
            };
          }
        });
      } else if (mode === "cloze") {
        const filtered = filterByDifficultyAndSrs(hskData.cloze, diff, count);
        rawItems = filtered.map(item => {
          const fullSentence = item.sentence.replace("____", item.answer);
          return {
            type: "cloze",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: "독해 1부분 빈칸 搭配",
            chinese: item.sentence,
            pinyin: "",
            postAnswerPinyin: `${item.answer} [${item.pinyin || ""}]`,
            speechText: item.sentence,
            postAnswerSpeechText: fullSentence,
            promptKey: "hsk_cloze",
            prompt: "문맥과 어휘 짝꿍(搭配)을 고려하여 빈칸에 들어갈 단어를 고르세요.",
            options: shuffle([...item.options]),
            answer: item.answer,
            collocation: item.collocation,
            detail: item.explanation,
            exampleCn: fullSentence,
            exampleKr: item.translation
          };
        });
      } else if (mode === "grammar") {
        const filtered = filterByDifficultyAndSrs(hskData.grammar, diff, count);
        rawItems = filtered.map(item => {
          const correctVal = item.options[item.answer - 1];
          const modelSentence = item.example || correctVal;
          const modelTranslation = item.translation || `${item.category} 공식이 적용된 모범 문장입니다.`;
          return {
            type: "grammar",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: `문법: ${item.category}`,
            chinese: item.question,
            pinyin: "",
            // 문제 풀이 전 정답 문장이 음성으로 읽혀 정답이 노출되지 않도록 차단
            speechText: "",
            postAnswerSpeechText: modelSentence,
            promptKey: "hsk_grammar",
            prompt: "문법 규칙과 어순에 맞는 가장 올바른 보기를 고르세요.",
            options: shuffle([...item.options]),
            answer: correctVal,
            collocation: `핵심 문법: ${item.category}`,
            detail: item.explanation,
            exampleCn: modelSentence,
            exampleKr: modelTranslation
          };
        });
      } else if (mode === "mixed") {
        const perMode = (count === "all") ? "all" : Math.max(2, Math.ceil(count / 5) + 1);
        const l = buildQuestions("hsk", "listening", perMode, diff);
        const v = buildQuestions("hsk", "vocab", perMode, diff);
        const ch = buildQuestions("hsk", "chengyu", perMode, diff);
        const cl = buildQuestions("hsk", "cloze", perMode, diff);
        const g = buildQuestions("hsk", "grammar", perMode, diff);
        const combined = [...l, ...v, ...ch, ...cl, ...g];
        // 오답 복습(isReview) 문제를 최우선 배치하고 나머지를 무작위 셔플
        const rev = shuffle(combined.filter(q => q.isReview));
        const rest = shuffle(combined.filter(q => !q.isReview));
        rawItems = [...rev, ...rest];
      }
    } else {
      // IELTS 영어 분기
      if (mode === "vocab") {
        const filtered = filterByDifficultyAndSrs(ieltsData.vocab, diff, count);
        let items = [];
        filtered.forEach(item => {
          const isReverse = Math.random() < 0.5;
          if (isReverse) {
            const wrongPool = ieltsData.vocab.filter(v => v.word !== item.word).map(v => v.word);
            const options = shuffle([item.word, ...sampleArray(wrongPool, 3)]);
            items.push({
              type: "vocab",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: `IELTS Academic Vocab (${item.pos || "word"}) [뜻➔단어]`,
              chinese: item.meaning,
              pinyin: `Synonyms: ${item.synonym || "-"}`,
              // 정답 선택 전 영단어 발음이 재생되어 정답이 노출되지 않도록 차단
              speechText: "",
              postAnswerSpeechText: item.word,
              promptKey: "ielts_vocab_reverse",
              prompt: "Select the correct academic word that matches the meaning:",
              options: options,
              answer: item.word,
              collocation: `Word: ${item.word} (${item.pos}) | Synonyms: ${item.synonym || "-"}`,
              detail: "Essential Academic Vocabulary for IELTS Reading & Writing Band 7.0+",
              exampleCn: item.example,
              exampleKr: item.translation
            });
          } else {
            const wrongPool = ieltsData.vocab.filter(v => v.meaning !== item.meaning).map(v => v.meaning);
            const options = shuffle([item.meaning, ...sampleArray(wrongPool, 3)]);
            items.push({
              type: "vocab",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: `IELTS Academic Vocab (${item.pos || "word"}) [단어➔뜻]`,
              chinese: item.word,
              pinyin: `Synonyms: ${item.synonym || "-"}`,
              speechText: item.word,
              promptKey: "ielts_vocab_meaning",
              prompt: "Select the correct Korean meaning for this academic word:",
              options: options,
              answer: item.meaning,
              collocation: `Word: ${item.word} (${item.pos}) | Synonyms: ${item.synonym || "-"}`,
              detail: "Essential Academic Vocabulary for IELTS Reading & Writing Band 7.0+",
              exampleCn: item.example,
              exampleKr: item.translation
            });
          }
        });
        rawItems = items;
      } else if (mode === "listening") {
        const filtered = filterByDifficultyAndSrs(ieltsData.listening, diff, count);
        rawItems = filtered.map(item => {
          return {
            type: "listening",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: `IELTS Listening ${item.category}`,
            chinese: item.question,
            pinyin: "",
            speechText: item.audioText,
            promptKey: "ielts_listening",
            prompt: "🎧 Listen carefully to the audio and select the most accurate answer:",
            options: shuffle([...item.options]),
            answer: item.answer,
            dialogue: item.dialogue,
            questionText: item.question,
            collocation: `Test Section: ${item.category}`,
            detail: item.tip,
            translation: item.translation,
            exampleCn: item.audioText,
            exampleKr: item.translation
          };
        });
      } else if (mode === "chengyu") {
        const filtered = filterByDifficultyAndSrs(ieltsData.idioms, diff, count);
        rawItems = filtered.map((item, idx) => {
          const isCloze = (idx % 2 === 0);
          const fullExampleCn = item.example || (item.sentence ? item.sentence.replace("____", item.idiom) : item.idiom);
          if (isCloze && item.sentence) {
            const wrongPool = ieltsData.idioms.filter(c => c.idiom !== item.idiom).map(c => c.idiom);
            const options = shuffle([item.idiom, ...sampleArray(wrongPool, 3)]);
            return {
              type: "chengyu_cloze",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: "IELTS Idioms & Phrases (Context)",
              chinese: item.sentence,
              // 문제 풀이 중 정답 숙어가 중간(#main-pinyin)에 노출되지 않도록 빈 문자열 유지
              pinyin: "",
              postAnswerPinyin: `Idiom: ${item.idiom}`,
              speechText: item.sentence,
              postAnswerSpeechText: fullExampleCn,
              promptKey: "ielts_idiom_cloze",
              prompt: "Choose the most appropriate idiom to fill in the blank [ ____ ]:",
              options: options,
              answer: item.idiom,
              collocation: `Idiom: ${item.idiom}`,
              detail: `Meaning: ${item.meaning} (High-scoring expression for IELTS Speaking & Writing)`,
              exampleCn: fullExampleCn,
              exampleKr: item.translation || `의미: ${item.meaning}`
            };
          } else {
            const wrongPool = ieltsData.idioms.filter(c => c.meaning !== item.meaning).map(c => c.meaning);
            const options = shuffle([item.meaning, ...sampleArray(wrongPool, 3)]);
            return {
              type: "chengyu_meaning",
              rawItem: item,
              isReview: Boolean(item._isReview),
              difficulty: item.difficulty || diff,
              category: "IELTS Idioms & Phrases (Meaning)",
              chinese: item.idiom,
              pinyin: "",
              speechText: item.idiom,
              promptKey: "ielts_idiom_meaning",
              prompt: "Select the correct Korean meaning for this academic idiom:",
              options: options,
              answer: item.meaning,
              collocation: `Idiom: ${item.idiom}`,
              detail: "High-scoring expression for IELTS Speaking & Writing Band 7.0+",
              exampleCn: fullExampleCn,
              exampleKr: item.translation || item.meaning
            };
          }
        });
      } else if (mode === "cloze") {
        const filtered = filterByDifficultyAndSrs(ieltsData.cloze, diff, count);
        rawItems = filtered.map(item => {
          const fullSentence = item.sentence.replace("____", item.answer);
          return {
            type: "cloze",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: "IELTS Academic Collocation",
            chinese: item.sentence,
            // 문제 풀이 중 정답이 중간(#main-pinyin)에 노출되지 않도록 빈 문자열 유지
            pinyin: "",
            postAnswerPinyin: `Collocation: ${item.collocation}`,
            speechText: item.sentence,
            postAnswerSpeechText: fullSentence,
            promptKey: "ielts_cloze",
            prompt: "Select the natural academic collocation for the blank:",
            options: shuffle([...item.options]),
            answer: item.answer,
            collocation: item.collocation,
            detail: item.explanation,
            exampleCn: fullSentence,
            exampleKr: item.translation
          };
        });
      } else if (mode === "grammar") {
        const filtered = filterByDifficultyAndSrs(ieltsData.grammar, diff, count);
        rawItems = filtered.map(item => {
          const correctVal = item.options[item.answer - 1];
          const modelSentence = item.example || correctVal;
          const modelTranslation = item.translation || `${item.category} model sentence for IELTS Writing.`;
          return {
            type: "grammar",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: `Grammar: ${item.category}`,
            chinese: item.question,
            pinyin: "",
            // 문제 풀이 전 정답 문장이 음성으로 읽혀 정답이 노출되지 않도록 차단
            speechText: "",
            postAnswerSpeechText: modelSentence,
            promptKey: "ielts_grammar",
            prompt: "Choose the sentence with flawless academic grammar and structure:",
            options: shuffle([...item.options]),
            answer: correctVal,
            collocation: `Structure: ${item.category}`,
            detail: item.explanation,
            exampleCn: modelSentence,
            exampleKr: modelTranslation
          };
        });
      } else if (mode === "mixed") {
        const perMode = (count === "all") ? "all" : Math.max(2, Math.ceil(count / 5) + 1);
        const l = buildQuestions("ielts", "listening", perMode, diff);
        const v = buildQuestions("ielts", "vocab", perMode, diff);
        const id = buildQuestions("ielts", "chengyu", perMode, diff);
        const cl = buildQuestions("ielts", "cloze", perMode, diff);
        const g = buildQuestions("ielts", "grammar", perMode, diff);
        const combined = [...l, ...v, ...id, ...cl, ...g];
        const rev = shuffle(combined.filter(q => q.isReview));
        const rest = shuffle(combined.filter(q => !q.isReview));
        rawItems = [...rev, ...rest];
      }
    }

    if (count !== "all" && rawItems.length > count) {
      rawItems = rawItems.slice(0, count);
    }
    return shuffle(rawItems);
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function sampleArray(arr, n) {
    const s = shuffle(arr);
    return s.slice(0, n);
  }

  // 7. 화면 렌더링
  function showView(viewId) {
    setupView.classList.remove("active");
    quizView.classList.remove("active");
    resultView.classList.remove("active");

    if (viewId === "setup") {
      updateSrsDashboard();
      setupView.classList.add("active");
    }
    if (viewId === "quiz") quizView.classList.add("active");
    if (viewId === "result") resultView.classList.add("active");
  }

  function startQuiz() {
    questions = buildQuestions(currentLanguage, currentMode, questionCount, currentDifficulty);
    if (!questions || questions.length === 0) {
      const t = I18N[currentUiLang] || I18N.ko;
      alert(t.alertNoQuestions);
      return;
    }
    currentIndex = 0;
    score = 0;
    showView("quiz");
    renderCurrentQuestion();
  }

  function renderCurrentQuestion() {
    stopListeningAudio();
    answered = false;
    const q = questions[currentIndex];
    currentSpeechText = q.speechText || "";
    currentExampleSpeechText = q.exampleCn || "";

    const t = I18N[currentUiLang] || I18N.ko;
    const conf = modeConfigs[currentLanguage];
    const meta = conf.modes[currentMode] || { name: "퀴즈", icon: "🎯" };
    quizModeTag.textContent = `${meta.icon} ${meta.name}`;

    const dInfo = getDiffInfo(q.difficulty || currentDifficulty, currentUiLang);
    if (quizDiffTag) {
      quizDiffTag.textContent = dInfo.label;
      quizDiffTag.className = `diff-status-tag ${dInfo.cls}`;
    }

    // 복습 문제 여부 배지 표시
    if (questionSrsBadge) {
      if (q.isReview) {
        questionSrsBadge.classList.remove("hidden");
        questionSrsBadge.textContent = t.srsReviewBadge;
      } else {
        questionSrsBadge.classList.add("hidden");
      }
    }

    progressText.textContent = t.progressText(currentIndex + 1, questions.length);
    currentScoreElem.textContent = score;

    const progressPct = ((currentIndex + 1) / questions.length) * 100;
    progressBarFill.style.width = `${progressPct}%`;

    questionCategory.textContent = q.category;

    // 듣기 모드 vs 일반 모드 UI 분기
    if (q.type === "listening") {
      listeningPlayerBox.classList.remove("hidden");
      standardQuestionBody.classList.add("hidden");
      ttsBtn.style.display = "none";
      prepareListening(q);
    } else {
      listeningPlayerBox.classList.add("hidden");
      standardQuestionBody.classList.remove("hidden");
      // 문제 풀이 전 발음이 정답을 노출하는 경우(역방향 어휘, 문법)에는 정답 선택 전까지 발음 버튼 숨김
      ttsBtn.style.display = currentSpeechText ? "inline-flex" : "none";

      mainChinese.textContent = q.chinese;
      mainPinyin.textContent = q.pinyin || "";
      subPrompt.textContent = getLocalizedPrompt(q, currentUiLang);
    }

    explanationBox.classList.add("hidden");
    listeningTranscriptCard.classList.add("hidden");
    standardExampleCard.classList.remove("hidden");

    // 4지선다 보기 무작위 셔플 보장
    if (!q._shuffled) {
      q.options = shuffle([...q.options]);
      q._shuffled = true;
    }

    optionsList.innerHTML = "";
    q.options.forEach((optText, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML = `
        <span class="opt-idx">${idx + 1}</span>
        <span class="opt-text">${escapeHtml(optText)}</span>
      `;
      btn.addEventListener("click", () => handleSelectOption(btn, optText, q));
      optionsList.appendChild(btn);
    });

    if (autoTTS) {
      autoTtsTimer = setTimeout(() => {
        if (answered) return;
        if (q.type === "listening") {
          playListeningFromCurrent();
        } else if (currentSpeechText) {
          playAudio(currentSpeechText, ttsBtn);
        }
      }, 300);
    }
  }

  function isMaleSpeaker(speaker) {
    if (!speaker) return false;
    const maleKeywords = ["男", "Man", "David", "Tom", "Professor", "Tutor", "Lecturer", "Historian", "Officer", "Agent", "专家", "教授", "学者", "总监", "研究员"];
    return maleKeywords.some(kw => speaker.includes(kw));
  }

  function handleSelectOption(selectedBtn, chosenAnswer, q) {
    if (answered) return;
    answered = true;
    clearTimeout(autoTtsTimer);

    if (q.type === "listening") {
      stopListeningAudio();
    } else {
      // 정답 선택 후에는 완성된 문장/단어 발음 및 병음 정보 활성화
      if (q.postAnswerSpeechText) {
        currentSpeechText = q.postAnswerSpeechText;
        ttsBtn.style.display = "inline-flex";
      }
      if (q.postAnswerPinyin && mainPinyin) {
        mainPinyin.textContent = q.postAnswerPinyin;
      }
    }

    const isCorrect = (chosenAnswer === q.answer);

    // 핵심: 맞춘 문제는 마스터(다음 시도 제외), 틀린 문제는 복습(다음 시도에 또 나옴)
    updateItemMastery(currentLanguage, q.rawItem, isCorrect);

    const t = I18N[currentUiLang] || I18N.ko;
    if (isCorrect) {
      playCorrectSound();
      score++;
      currentScoreElem.textContent = score;
      selectedBtn.classList.add("correct");
      feedbackBanner.textContent = (currentLanguage === "hsk")
        ? t.feedbackCorrectHsk
        : t.feedbackCorrectIelts;
      feedbackBanner.className = "feedback-banner correct";
    } else {
      playWrongSound();
      selectedBtn.classList.add("wrong");
      feedbackBanner.textContent = (currentLanguage === "hsk")
        ? t.feedbackWrongHsk(q.answer)
        : t.feedbackWrongIelts(q.answer);
      feedbackBanner.className = "feedback-banner wrong";

      const allBtns = optionsList.querySelectorAll(".option-btn");
      allBtns.forEach(btn => {
        if (btn.querySelector(".opt-text").textContent.trim() === q.answer.trim()) {
          btn.classList.add("correct");
        }
      });
    }

    optionsList.querySelectorAll(".option-btn").forEach(btn => {
      btn.disabled = true;
    });

    expCollocVal.textContent = q.collocation || "-";
    expDetailVal.textContent = q.detail || "-";

    if (q.type === "listening" && q.dialogue) {
      listeningTranscriptCard.classList.remove("hidden");
      standardExampleCard.classList.add("hidden");

      transcriptDialogueList.innerHTML = q.dialogue.map(d => `
        <div class="dialogue-line">
          <span class="speaker-tag ${isMaleSpeaker(d.speaker) ? 'man' : 'woman'}">${escapeHtml(d.speaker)}</span>
          <span class="dialogue-text">${escapeHtml(d.text)}</span>
        </div>
      `).join("");

      transcriptQuestionText.textContent = q.questionText || "";
      transcriptTranslation.textContent = q.translation || "";
    } else {
      listeningTranscriptCard.classList.add("hidden");
      standardExampleCard.classList.remove("hidden");

      expExampleCn.textContent = q.exampleCn || "-";
      expExampleKr.textContent = q.exampleKr || "-";
      currentExampleSpeechText = q.exampleCn || "";
    }

    explanationBox.classList.remove("hidden");
  }

  function nextQuestion() {
    stopListeningAudio();
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderCurrentQuestion();
    } else {
      showResults();
    }
  }

  function showResults() {
    stopListeningAudio();
    showView("result");
    finalScoreElem.textContent = score;
    finalTotalElem.textContent = questions.length;
    const pct = Math.round((score / questions.length) * 100);
    scorePercentageElem.textContent = `${pct}%`;
    const isPass = pct >= 60;

    const t = I18N[currentUiLang] || I18N.ko;
    const dInfo = getDiffInfo(currentDifficulty, currentUiLang);
    if (resultDiffBadge) {
      resultDiffBadge.textContent = `${t.resultDiffPrefix}${dInfo.label}`;
      resultDiffBadge.className = `result-diff-badge ${dInfo.cls}`;
    }

    if (isPass) {
      resultBadge.textContent = (currentLanguage === "hsk") ? t.resultPassHsk : t.resultPassIelts;
      resultBadge.className = "result-badge pass";
      resultMessage.textContent = (currentLanguage === "hsk")
        ? t.resultPassMsgHsk
        : t.resultPassMsgIelts;
    } else {
      resultBadge.textContent = t.resultFail;
      resultBadge.className = "result-badge fail";
      resultMessage.textContent = t.resultFailMsg;
    }

    saveQuizHistory({
      language: currentLanguage,
      mode: currentMode,
      difficulty: currentDifficulty,
      score: score,
      total: questions.length,
      percentage: pct,
      isPass: isPass
    });
  }

  // 8. 학습 기록(History) 모듈
  function getHistory() {
    try {
      const raw = localStorage.getItem(getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveQuizHistory(record) {
    const history = getHistory();
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");

    const conf = getSubjectConfig(record.language, currentUiLang);
    const meta = conf.modes[record.mode] || { name: "퀴즈", icon: "🎯" };

    const newEntry = {
      id: Date.now(),
      language: record.language || "hsk",
      modeKey: record.mode || "vocab",
      dateFormatted: `${month}월 ${date}일 ${hours}:${mins}`,
      modeName: meta.name,
      modeIcon: meta.icon,
      difficulty: record.difficulty || "중",
      score: record.score,
      total: record.total,
      percentage: record.percentage,
      isPass: record.isPass
    };

    history.unshift(newEntry);
    if (history.length > 100) history.pop();

    localStorage.setItem(getStorageKey(), JSON.stringify(history));
  }

  function renderHistoryModal() {
    const history = getHistory();
    const t = I18N[currentUiLang] || I18N.ko;

    if (historyModalTitle) {
      historyModalTitle.textContent = (currentLanguage === "hsk") ? t.historyTitleHsk : t.historyTitleIelts;
    }

    const totalCount = history.length;
    statTotalCount.textContent = totalCount;

    if (totalCount > 0) {
      const avg = Math.round(history.reduce((acc, cur) => acc + cur.percentage, 0) / totalCount);
      const passCount = history.filter(h => h.isPass).length;
      statAvgScore.textContent = `${avg}%`;
      statPassCount.textContent = `${passCount}`;
    } else {
      statAvgScore.textContent = "0%";
      statPassCount.textContent = "0";
    }

    historyList.innerHTML = "";
    if (totalCount === 0) {
      historyList.innerHTML = `<div class="empty-history">${t.emptyHistory}</div>`;
      return;
    }

    history.forEach(item => {
      const diffVal = item.difficulty || "중";
      const dInfo = getDiffInfo(diffVal, currentUiLang);
      const isIelts = (item.language === "ielts");
      const passText = item.isPass ? t.historyPassBadge : t.historyFailBadge;

      let displayModeName = item.modeName;
      if (item.modeKey) {
        const subConf = getSubjectConfig(item.language, currentUiLang);
        if (subConf.modes && subConf.modes[item.modeKey]) {
          displayModeName = subConf.modes[item.modeKey].name;
        }
      }

      const itemEl = document.createElement("div");
      itemEl.className = "history-item";
      itemEl.innerHTML = `
        <div class="history-item-left">
          <div class="history-mode-line">
            <span class="history-lang-badge ${isIelts ? 'ielts' : 'hsk'}">${isIelts ? '🇬🇧 IELTS' : '🇨🇳 HSK'}</span>
            <span class="history-mode-tag">${item.modeIcon} ${escapeHtml(displayModeName)}</span>
            <span class="history-diff-badge ${dInfo.cls}">${dInfo.chip}</span>
          </div>
          <div class="history-date">${escapeHtml(item.dateFormatted)}</div>
        </div>
        <div class="history-item-right">
          <div class="history-score">${item.score} / ${item.total} (${item.percentage}%)</div>
          <span class="history-status-badge ${item.isPass ? 'pass' : 'fail'}">
            ${passText}
          </span>
        </div>
      `;
      historyList.appendChild(itemEl);
    });
  }

  function openHistory() {
    renderHistoryModal();
    historyModal.classList.remove("hidden");
  }

  function closeHistory() {
    historyModal.classList.add("hidden");
  }

  function clearHistory() {
    localStorage.removeItem(getStorageKey());
    renderHistoryModal();
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text || "";
    return div.innerHTML;
  }

  // 9. 이벤트 바인딩
  langHskBtn.addEventListener("click", () => setLanguage("hsk"));
  langIeltsBtn.addEventListener("click", () => setLanguage("ielts"));

  uiLangTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const selected = tab.getAttribute("data-ui-lang");
      if (selected) {
        setUiLanguage(selected);
      }
    });
  });

  countBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      countBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const c = btn.getAttribute("data-count");
      questionCount = (c === "all") ? "all" : parseInt(c, 10);
    });
  });

  diffBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      diffBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentDifficulty = btn.getAttribute("data-diff") || "중";
    });
  });

  startBtn.addEventListener("click", startQuiz);

  resetProgressBtn.addEventListener("click", resetCurrentLangProgress);

  ttsBtn.addEventListener("click", () => {
    playAudio(currentSpeechText, ttsBtn);
  });

  listeningPlayPauseBtn.addEventListener("click", () => {
    if (isListeningPlaying && !isListeningPaused) {
      pauseListeningAudio();
    } else if (isListeningPaused) {
      resumeListeningAudio();
    } else {
      playListeningFromCurrent();
    }
  });

  listeningRestartBtn.addEventListener("click", () => {
    stopListeningAudio();
    currentSegmentIdx = 0;
    playListeningFromCurrent();
  });

  transcriptAudioBtn.addEventListener("click", () => {
    stopListeningAudio();
    currentSegmentIdx = 0;
    playListeningFromCurrent();
  });

  expAudioBtn.addEventListener("click", () => {
    playAudio(currentExampleSpeechText, expAudioBtn);
  });

  autoTtsToggle.addEventListener("change", (e) => {
    autoTTS = e.target.checked;
    if (!autoTTS) {
      stopListeningAudio();
    }
  });

  ttsSpeedSelect.addEventListener("change", (e) => {
    ttsSpeed = parseFloat(e.target.value);
  });

  nextBtn.addEventListener("click", nextQuestion);

  quitBtn.addEventListener("click", () => {
    stopListeningAudio();
    showView("setup");
  });

  retryBtn.addEventListener("click", () => {
    stopListeningAudio();
    startQuiz();
  });

  homeBtn.addEventListener("click", () => {
    stopListeningAudio();
    showView("setup");
  });

  openHistoryBtn.addEventListener("click", openHistory);
  viewHistoryBtn.addEventListener("click", openHistory);
  closeHistoryBtn.addEventListener("click", closeHistory);
  clearHistoryBtn.addEventListener("click", clearHistory);
  historyModal.addEventListener("click", (e) => {
    if (e.target === historyModal) {
      closeHistory();
    }
  });

  // 초기화 실행
  loadData().then(() => {
    applyUiLanguage(currentUiLang);
    initVoices();
    updateSrsDashboard();
  });
});
