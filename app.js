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

  // 음성 엔진 관리
  let availableVoices = [];
  let selectedVoice = null;

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


  // DOM 요소 캐싱
  const langHskBtn = document.getElementById("lang-hsk-btn");
  const langIeltsBtn = document.getElementById("lang-ielts-btn");
  const logoBadge = document.getElementById("logo-badge");
  const appTitle = document.getElementById("app-title");
  const introTitle = document.getElementById("intro-title");
  const introDesc = document.getElementById("intro-desc");

  // SRS 진도 현황 요소
  const srsMasteredCount = document.getElementById("srs-mastered-count");
  const srsReviewCount = document.getElementById("srs-review-count");
  const srsNewCount = document.getElementById("srs-new-count");
  const resetProgressBtn = document.getElementById("reset-progress-btn");
  const questionSrsBadge = document.getElementById("question-srs-badge");

  const setupView = document.getElementById("setup-view");
  const quizView = document.getElementById("quiz-view");
  const resultView = document.getElementById("result-view");

  const openHistoryBtn = document.getElementById("open-history-btn");
  const viewHistoryBtn = document.getElementById("view-history-btn");
  const historyModal = document.getElementById("history-modal");
  const closeHistoryBtn = document.getElementById("close-history-btn");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const historyList = document.getElementById("history-list");
  const statTotalCount = document.getElementById("stat-total-count");
  const statAvgScore = document.getElementById("stat-avg-score");
  const statPassCount = document.getElementById("stat-pass-count");

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
  const currentScoreElem = document.getElementById("current-score");
  const quitBtn = document.getElementById("quit-btn");

  const questionCategory = document.getElementById("question-category");
  const ttsBtn = document.getElementById("tts-btn");

  // 듣기 플레이어 컨트롤러
  const listeningPlayerBox = document.getElementById("listening-player-box");
  const audioWavesWrap = document.getElementById("audio-waves-wrap");
  const listeningStatusText = document.getElementById("listening-status-text");
  const listeningSubtext = document.getElementById("listening-subtext");
  const listeningPlayPauseBtn = document.getElementById("listening-play-pause-btn");
  const playPauseIcon = document.getElementById("play-pause-icon");
  const playPauseLabel = document.getElementById("play-pause-label");
  const listeningRestartBtn = document.getElementById("listening-restart-btn");

  const standardQuestionBody = document.getElementById("standard-question-body");
  const mainChinese = document.getElementById("main-chinese");
  const mainPinyin = document.getElementById("main-pinyin");
  const subPrompt = document.getElementById("sub-prompt");
  const optionsList = document.getElementById("options-list");

  const explanationBox = document.getElementById("explanation-box");
  const feedbackBanner = document.getElementById("feedback-banner");
  const expCollocVal = document.getElementById("exp-colloc-val");
  const expDetailVal = document.getElementById("exp-detail-val");

  const listeningTranscriptCard = document.getElementById("listening-transcript-card");
  const transcriptDialogueList = document.getElementById("transcript-dialogue-list");
  const transcriptQuestionText = document.getElementById("transcript-question-text");
  const transcriptTranslation = document.getElementById("transcript-translation");
  const transcriptAudioBtn = document.getElementById("transcript-audio-btn");

  const standardExampleCard = document.getElementById("standard-example-card");
  const expAudioBtn = document.getElementById("exp-audio-btn");
  const expExampleCn = document.getElementById("exp-example-cn");
  const expExampleKr = document.getElementById("exp-example-kr");
  const nextBtn = document.getElementById("next-btn");

  const finalScoreElem = document.getElementById("final-score");
  const finalTotalElem = document.getElementById("final-total");
  const scorePercentageElem = document.getElementById("score-percentage");
  const resultBadge = document.getElementById("result-badge");
  const resultDiffBadge = document.getElementById("result-diff-badge");
  const resultMessage = document.getElementById("result-message");
  const retryBtn = document.getElementById("retry-btn");
  const homeBtn = document.getElementById("home-btn");

  const diffLabels = {
    "하": { label: "🟢 하 (기본)", cls: "green", chip: "하 (기본)" },
    "중": { label: "🟡 중 (실전)", cls: "yellow", chip: "중 (실전)" },
    "상": { label: "🔴 상 (심화)", cls: "red", chip: "상 (심화)" }
  };

  const modeConfigs = {
    hsk: {
      title: "HSK 5급 스마트 퀴즈",
      badge: "HSK 5",
      introTitle: "실전 HSK 5급 학습 모드를 선택하세요",
      introDesc: "어휘 암기, 사자성어 문맥 완성, 독해 1부분 搭配 배합, 필수 문법, 그리고 실전 듣기(听力)까지 원어민 음성으로 정복하세요.",
      modes: {
        vocab: { name: "필수 어휘 퀴즈", icon: "🎯", desc: "한자/병음 ➔ 한국어 뜻 및 핵심 예문" },
        listening: { name: "실전 듣기(听力) 퀴즈", icon: "🎧", desc: "남녀 2마디 대화 & 단문 청취 후 질문 풀이" },
        chengyu: { name: "사자성어(成语) 퀴즈", icon: "🀄", desc: "문맥 빈칸 채우기 & 빈출 30선 의미 파악" },
        cloze: { name: "독해 1부분 실전 빈칸", icon: "🔗", desc: "3초 컷! 고정 짝꿍 호응(搭配) 훈련" },
        grammar: { name: "필수 문법 & 어순 배열", icon: "📑", desc: "把/被자문, 존현문, 접속사 공식 및 쓰기" },
        mixed: { name: "종합 실전 모의고사", icon: "🎲", desc: "듣기, 어휘, 성어, 빈칸, 문법 전 영역 통합 출제" }
      }
    },
    ielts: {
      title: "IELTS 영어 마스터 퀴즈",
      badge: "IELTS",
      introTitle: "IELTS Academic & General 시험 대비 모드를 선택하세요",
      introDesc: "Band 7.0+ 아카데믹 어휘, Section 1~4 리스닝, 고득점 숙어(Idioms), 리딩 콜로케이션, 라이팅 복합 문법까지 미국식(US) 원어민 발음으로 마스터하세요.",
      modes: {
        vocab: { name: "IELTS 핵심 어휘", icon: "🎯", desc: "Band 6.5~7.5+ 아카데믹 필수 어휘 & 유의어" },
        listening: { name: "실전 리스닝(Listening)", icon: "🎧", desc: "대화 및 학술 강의 청취 후 질문 풀이" },
        chengyu: { name: "숙어 및 관용구(Idioms)", icon: "💡", desc: "스피킹 & 라이팅 점수 부스팅 필수 관용 표현" },
        cloze: { name: "리딩 Collocation 빈칸", icon: "🔗", desc: "아카데믹 빈출 고정 어휘 배합 완성" },
        grammar: { name: "라이팅 필수 문법 & 구문", icon: "📑", desc: "도치, 가정법, 분사구문 등 Band 7+ 복합 구문" },
        mixed: { name: "종합 실전 모의고사", icon: "🎲", desc: "리스닝, 어휘, 숙어, 콜로케이션, 문법 통합 출제" }
      }
    }
  };

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
    const langName = (currentLanguage === "hsk") ? "🇨🇳 HSK 5급" : "🇬🇧 IELTS 영어";
    if (confirm(`${langName}의 마스터(맞춘 문제) 및 복습(틀린 문제) 진도를 모두 초기화하고 처음부터 다시 시작하시겠습니까?`)) {
      const mastery = getMasteryState();
      const prefix = `${currentLanguage}_`;
      Object.keys(mastery).forEach(k => {
        if (k.startsWith(prefix)) {
          delete mastery[k];
        }
      });
      localStorage.setItem(getMasteryKey(), JSON.stringify(mastery));
      updateSrsDashboard();
      alert("학습 진도가 초기화되었습니다. 모든 문제가 다시 출제됩니다.");
    }
  }

  // 3. 다국어 고음질 음성(TTS) 탐색 및 정렬
  function initVoices() {
    if (!("speechSynthesis" in window)) return;
    const allVoices = window.speechSynthesis.getVoices();

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
        ttsVoiceSelect.innerHTML = `<option value="auto">✨ 최적 중국어 음성 (자동)</option>`;
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
        ttsVoiceSelect.innerHTML = `<option value="auto">✨ 미국식(US) 고음질 음성 (자동)</option>`;
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

  // 언어 전환 핸들러
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

    const conf = modeConfigs[lang];
    logoBadge.textContent = conf.badge;
    appTitle.textContent = conf.title;
    introTitle.textContent = conf.introTitle;
    introDesc.textContent = conf.introDesc;

    renderModeGrid();
    initVoices();
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

  // 발음 재생
  function playAudio(text, targetBtn) {
    if (!text || !("speechSynthesis" in window)) return;
    
    stopListeningAudio();
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/____|\[\s*____\s*\]|【|】/g, " ").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = (currentLanguage === "hsk") ? "zh-CN" : "en-US";
    utterance.rate = ttsSpeed;
    if (selectedVoice) utterance.voice = selectedVoice;

    const btn = targetBtn || ttsBtn;
    if (btn) btn.classList.add("playing");
    utterance.onend = () => { if (btn) btn.classList.remove("playing"); };
    utterance.onerror = () => { if (btn) btn.classList.remove("playing"); };

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

    isListeningPlaying = true;
    isListeningPaused = false;
    updatePlayerUI("playing");
    playNextSegment();
  }

  function playNextSegment() {
    if (!isListeningPlaying || isListeningPaused) return;

    if (currentSegmentIdx >= listeningSegments.length) {
      isListeningPlaying = false;
      isListeningPaused = false;
      updatePlayerUI("finished");
      return;
    }

    const seg = listeningSegments[currentSegmentIdx];
    const roleLabel = (currentLanguage === "hsk") ? `${seg.role} 청취 중...` : `Listening to ${seg.role}...`;
    listeningStatusText.textContent = `🎧 ${roleLabel} (${currentSegmentIdx + 1}/${listeningSegments.length})`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(seg.text);
    utterance.lang = (currentLanguage === "hsk") ? "zh-CN" : "en-US";
    utterance.rate = ttsSpeed;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      if (!isListeningPlaying || isListeningPaused) return;
      currentSegmentIdx++;
      const delay = (currentSegmentIdx === listeningSegments.length - 1) ? 750 : 550;
      dialogueTimer = setTimeout(() => {
        playNextSegment();
      }, delay);
    };

    utterance.onerror = () => {
      if (isListeningPlaying && !isListeningPaused) {
        currentSegmentIdx++;
        playNextSegment();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  function pauseListeningAudio() {
    if (!isListeningPlaying) return;
    isListeningPaused = true;
    clearTimeout(dialogueTimer);
    window.speechSynthesis.cancel();
    updatePlayerUI("paused");
  }

  function resumeListeningAudio() {
    if (!isListeningPaused) return;
    isListeningPaused = false;
    isListeningPlaying = true;
    updatePlayerUI("playing");
    playNextSegment();
  }

  function stopListeningAudio() {
    isListeningPlaying = false;
    isListeningPaused = false;
    clearTimeout(dialogueTimer);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    updatePlayerUI("idle");
  }

  function updatePlayerUI(state) {
    if (state === "playing") {
      audioWavesWrap.className = "audio-waves-wrap";
      playPauseIcon.textContent = "⏸️";
      playPauseLabel.textContent = "일시정지";
    } else if (state === "paused") {
      audioWavesWrap.className = "audio-waves-wrap paused";
      playPauseIcon.textContent = "▶️";
      playPauseLabel.textContent = "이어듣기";
      listeningStatusText.textContent = "⏸️ 일시정지됨 (이어듣기를 누르면 계속 재생됩니다)";
    } else if (state === "finished") {
      audioWavesWrap.className = "audio-waves-wrap stopped";
      playPauseIcon.textContent = "▶️";
      playPauseLabel.textContent = "다시듣기";
      listeningStatusText.textContent = "✅ 청취 완료! 질문에 알맞은 답을 고르세요.";
    } else if (state === "idle") {
      audioWavesWrap.className = "audio-waves-wrap stopped";
      playPauseIcon.textContent = "▶️";
      playPauseLabel.textContent = (currentLanguage === "hsk" ? "대화 듣기" : "Play Audio");
      listeningStatusText.textContent = (currentLanguage === "hsk" ? "🎧 대화를 주의 깊게 듣고 질문에 답하세요" : "🎧 Listen carefully and answer the question");
    }
  }

  // 5. 난이도 및 SRS(오답 반복 / 맞춘 문제 제외) 필터링 엔진
  function filterByDifficultyAndSrs(items, diff, requestedCount) {
    if (!items || items.length === 0) return [];
    const mastery = getMasteryState();

    // 1단계: 난이도별 일차 필터링
    const exact = items.filter(it => it.difficulty === diff);
    let diffFiltered = exact;
    if (diffFiltered.length < ((requestedCount === "all") ? items.length : requestedCount)) {
      let adjacent = [];
      if (diff === "하") adjacent = items.filter(it => it.difficulty === "중");
      else if (diff === "상") adjacent = items.filter(it => it.difficulty === "중");
      else adjacent = items.filter(it => it.difficulty === "하" || it.difficulty === "상");
      diffFiltered = [...exact, ...adjacent, ...items];
    }

    // 중복 제거
    const pool = [];
    const seenKeys = new Set();
    for (const item of diffFiltered) {
      const k = getItemKey(currentLanguage, item);
      if (!seenKeys.has(k)) {
        seenKeys.add(k);
        pool.push(item);
      }
    }

    // 2단계: SRS 상태 분류
    // review: 사용자가 틀렸던 문제 (최우선 출제)
    // new: 아직 맞춘 적 없는 미도전 문제
    // mastered: 이미 맞춘 문제 (출제 제외)
    const reviewList = [];
    const newList = [];
    const masteredList = [];

    pool.forEach(it => {
      const k = getItemKey(currentLanguage, it);
      const st = mastery[k] ? mastery[k].status : "new";
      if (st === "review") {
        reviewList.push({ ...it, _isReview: true });
      } else if (st === "mastered") {
        masteredList.push(it);
      } else {
        newList.push(it);
      }
    });

    const need = (requestedCount === "all") ? pool.length : requestedCount;

    // 핵심 규칙 1: 틀린 문제(reviewList)를 가장 먼저 담아서 또 출제되게 함!
    let candidates = [...shuffle(reviewList)];

    // 핵심 규칙 2: 맞춘 문제는 제외하고, 아직 안 푼 문제(newList)로 목표 개수 채움
    if (candidates.length < need) {
      candidates.push(...shuffle(newList));
    }

    // 만약 모든 문제를 마스터했거나 새 문제가 부족한 경우에만 마스터된 문제를 순환 보충
    if (candidates.length < need && masteredList.length > 0) {
      candidates.push(...shuffle(masteredList));
    }

    const unique = [];
    const seen = new Set();
    for (const item of candidates) {
      const key = getItemKey(currentLanguage, item);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    return unique;
  }

  // 6. 문제 생성 엔진 (HSK & IELTS 다국어 분기)
  function buildQuestions(lang, mode, count, diff) {
    let rawItems = [];

    if (lang === "hsk") {
      if (mode === "vocab") {
        const filtered = filterByDifficultyAndSrs(hskData.vocab, diff, count);
        let items = [];
        filtered.forEach(item => {
            const isReverse = Math.random() < 0.5;
            if (isReverse) {
                const wrongPool = hskData.vocab.filter(v => v.word !== item.word).map(v => v.word);
                const options = shuffle([item.word, ...sampleArray(wrongPool, 3)]);
                items.push({
                    type: "vocab",
                    rawItem: item,
                    isReview: Boolean(item._isReview),
                    difficulty: item.difficulty || diff,
                    category: `어휘 (${item.pos || "단어"}) [한국어->중국어]`,
                    chinese: item.meaning,
                    pinyin: "",
                    speechText: item.word,
                    prompt: "제시된 뜻을 가진 중국어 단어를 고르세요.",
                    options: options,
                    answer: item.word,
                    collocation: `단어: ${item.word} [${item.pinyin}] - ${item.pos}`,
                    detail: "HSK 5급 필수 빈출 어휘입니다.",
                    exampleCn: item.example || item.word,
                    exampleKr: `[뜻] ${item.meaning}`
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
                    prompt: "다음 한자 단어의 올바른 한국어 뜻을 고르세요.",
                    options: options,
                    answer: item.meaning,
                    collocation: `단어: ${item.word} [${item.pinyin}] - ${item.pos}`,
                    detail: "HSK 5급 필수 빈출 어휘입니다. 예문과 함께 기억해 두세요.",
                    exampleCn: item.example || item.word,
                    exampleKr: `[뜻] ${item.meaning}`
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
              pinyin: `정답 성어: ${item.chengyu} [${item.pinyin}]`,
              speechText: item.chengyu,
              prompt: "문맥의 빈칸 [ ____ ] 에 가장 어울리는 사자성어를 고르세요.",
              options: options,
              answer: correctVal,
              collocation: `성어 배합: ${item.chengyu} [${item.pinyin}]`,
              detail: `의미: ${item.meaning} (HSK 5급 가산점 필수 성어)`,
              exampleCn: item.example || item.sentence.replace("____", item.chengyu),
              exampleKr: `성어 의미: ${item.meaning}`
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
              prompt: "다음 사자성어의 한국어 의미로 알맞은 것을 고르세요.",
              options: options,
              answer: item.meaning,
              collocation: `성어: ${item.chengyu} [${item.pinyin}]`,
              detail: "5급 초빈출 30대 사자성어입니다.",
              exampleCn: item.example || item.sentence || item.chengyu,
              exampleKr: `[의미] ${item.meaning}`
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
            speechText: item.sentence,
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
          return {
            type: "grammar",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: `문법: ${item.category}`,
            chinese: item.question,
            pinyin: "",
            speechText: correctVal,
            prompt: "문법 규칙과 어순에 맞는 가장 올바른 보기를 고르세요.",
            options: shuffle([...item.options]),
            answer: correctVal,
            collocation: `핵심 문법: ${item.category}`,
            detail: item.explanation,
            exampleCn: correctVal,
            exampleKr: `${item.category} 공식이 적용된 모범 문장입니다.`
          };
        });
      } else if (mode === "mixed") {
        const l = buildQuestions("hsk", "listening", 999, diff);
        const v = buildQuestions("hsk", "vocab", 999, diff);
        const ch = buildQuestions("hsk", "chengyu", 999, diff);
        const cl = buildQuestions("hsk", "cloze", 999, diff);
        const g = buildQuestions("hsk", "grammar", 999, diff);
        rawItems = [...l, ...v, ...ch, ...cl, ...g];
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
              speechText: item.word,
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
              pinyin: `Target Idiom: ${item.idiom}`,
              speechText: item.idiom,
              prompt: "Choose the most appropriate idiom to fill in the blank [ ____ ]:",
              options: options,
              answer: item.idiom,
              collocation: `Idiom: ${item.idiom}`,
              detail: `Meaning: ${item.meaning} (High-scoring expression for IELTS Speaking & Writing)`,
              exampleCn: item.example || item.sentence.replace("____", item.idiom),
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
              prompt: "Select the correct Korean meaning for this academic idiom:",
              options: options,
              answer: item.meaning,
              collocation: `Idiom: ${item.idiom}`,
              detail: "High-scoring expression for IELTS Speaking & Writing Band 7.0+",
              exampleCn: item.example,
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
            pinyin: `Answer: ${item.answer}`,
            speechText: item.sentence,
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
          return {
            type: "grammar",
            rawItem: item,
            isReview: Boolean(item._isReview),
            difficulty: item.difficulty || diff,
            category: `Grammar: ${item.category}`,
            chinese: item.question,
            pinyin: "",
            speechText: correctVal,
            prompt: "Choose the sentence with flawless academic grammar and structure:",
            options: shuffle([...item.options]),
            answer: correctVal,
            collocation: `Structure: ${item.category}`,
            detail: item.explanation,
            exampleCn: correctVal,
            exampleKr: `${item.category} model sentence for IELTS Writing.`
          };
        });
      } else if (mode === "mixed") {
        const l = buildQuestions("ielts", "listening", 999, diff);
        const v = buildQuestions("ielts", "vocab", 999, diff);
        const id = buildQuestions("ielts", "chengyu", 999, diff);
        const cl = buildQuestions("ielts", "cloze", 999, diff);
        const g = buildQuestions("ielts", "grammar", 999, diff);
        rawItems = [...l, ...v, ...id, ...cl, ...g];
      }
    }

    const shuffled = shuffle(rawItems);
    if (count === "all" || count >= shuffled.length) return shuffled;
    return shuffled.slice(0, count);
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
      alert("출제할 문제가 없습니다. 진도 초기화를 통해 마스터한 단어를 다시 연습해 보세요.");
      return;
    }
    currentIndex = 0;
    score = 0;
    showView("quiz");
    renderCurrentQuestion();
  }

  function renderCurrentQuestion() {
    answered = false;
    const q = questions[currentIndex];
    currentSpeechText = q.speechText || q.chinese;
    currentExampleSpeechText = q.exampleCn || "";

    const conf = modeConfigs[currentLanguage];
    const meta = conf.modes[currentMode] || { name: "퀴즈", icon: "🎯" };
    quizModeTag.textContent = `${meta.icon} ${meta.name}`;

    const dInfo = diffLabels[currentDifficulty] || diffLabels["중"];
    if (quizDiffTag) {
      quizDiffTag.textContent = dInfo.label;
      quizDiffTag.className = `diff-status-tag ${dInfo.cls}`;
    }

    // 복습 문제 여부 배지 표시
    if (questionSrsBadge) {
      if (q.isReview) {
        questionSrsBadge.classList.remove("hidden");
        questionSrsBadge.textContent = "🔁 오답 집중 복습";
      } else {
        questionSrsBadge.classList.add("hidden");
      }
    }

    progressText.textContent = `문제 ${currentIndex + 1} / ${questions.length}`;
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
      stopListeningAudio();
      listeningPlayerBox.classList.add("hidden");
      standardQuestionBody.classList.remove("hidden");
      ttsBtn.style.display = "inline-flex";

      mainChinese.textContent = q.chinese;
      mainPinyin.textContent = q.pinyin || "";
      subPrompt.textContent = q.prompt;
    }

    explanationBox.classList.add("hidden");
    listeningTranscriptCard.classList.add("hidden");
    standardExampleCard.classList.remove("hidden");

    // 4지선다 보기 무작위 셔플 보장 (정답이 1번에 고정되는 문제 완벽 방지)
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
      setTimeout(() => {
        if (q.type === "listening") {
          playListeningFromCurrent();
        } else {
          playAudio(currentSpeechText, ttsBtn);
        }
      }, 350);
    }
  }

  function handleSelectOption(selectedBtn, chosenAnswer, q) {
    if (answered) return;
    answered = true;

    if (q.type === "listening") {
      stopListeningAudio();
    }

    const isCorrect = (chosenAnswer === q.answer);

    // 핵심: 맞춘 문제는 마스터(다음 시도 제외), 틀린 문제는 복습(다음 시도에 또 나옴)
    updateItemMastery(currentLanguage, q.rawItem, isCorrect);

    if (isCorrect) {
      playCorrectSound();
      score++;
      currentScoreElem.textContent = score;
      selectedBtn.classList.add("correct");
      feedbackBanner.textContent = (currentLanguage === "hsk") 
        ? "🎉 정답입니다! (맞춘 문제는 암기 완료 처리됩니다)" 
        : "🎉 Correct! (Mastered & will be excluded next time)";
      feedbackBanner.className = "feedback-banner correct";
    } else {
      playWrongSound();
      selectedBtn.classList.add("wrong");
      feedbackBanner.textContent = (currentLanguage === "hsk")
        ? `❌ 오답입니다. 정답은 [ ${q.answer} ] 입니다. (다음 퀴즈에 다시 출제됩니다)`
        : `❌ Incorrect. The answer is [ ${q.answer} ]. (Added to review list)`;
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
          <span class="speaker-tag ${d.speaker.includes('Man') || d.speaker.includes('David') || d.speaker.includes('男') ? 'man' : 'woman'}">${d.speaker}</span>
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

    const dInfo = diffLabels[currentDifficulty] || diffLabels["중"];
    if (resultDiffBadge) {
      resultDiffBadge.textContent = `난이도: ${dInfo.label}`;
      resultDiffBadge.className = `result-diff-badge ${dInfo.cls}`;
    }

    if (isPass) {
      resultBadge.textContent = (currentLanguage === "hsk") ? "합격 기준 도달 🏆" : "Band Target Achieved 🏆";
      resultBadge.className = "result-badge pass";
      resultMessage.textContent = (currentLanguage === "hsk")
        ? "훌륭합니다! 맞춘 문제는 다음 시도에서 제외되며, 틀린 문제만 모아서 집중 복습할 수 있습니다."
        : "Great job! Mastered questions are saved. Review will focus on any mistakes in your next attempt.";
    } else {
      resultBadge.textContent = "복습 필요 💡";
      resultBadge.className = "result-badge fail";
      resultMessage.textContent = "틀린 문제들은 다음 퀴즈 시도 시 자동으로 다시 출제되니 안심하고 복습하세요!";
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

    const conf = modeConfigs[record.language] || modeConfigs.hsk;
    const meta = conf.modes[record.mode] || { name: "퀴즈", icon: "🎯" };

    const newEntry = {
      id: Date.now(),
      language: record.language || "hsk",
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

    const totalCount = history.length;
    statTotalCount.textContent = totalCount;

    if (totalCount > 0) {
      const avg = Math.round(history.reduce((acc, cur) => acc + cur.percentage, 0) / totalCount);
      const passCount = history.filter(h => h.isPass).length;
      statAvgScore.textContent = `${avg}%`;
      statPassCount.textContent = `${passCount}회`;
    } else {
      statAvgScore.textContent = "0%";
      statPassCount.textContent = "0회";
    }

    historyList.innerHTML = "";
    if (totalCount === 0) {
      historyList.innerHTML = `<div class="empty-history">아직 학습 기록이 없습니다.<br>첫 퀴즈를 풀어보세요! 💪</div>`;
      return;
    }

    history.forEach(item => {
      const diffVal = item.difficulty || "중";
      const dInfo = diffLabels[diffVal] || diffLabels["중"];
      const isIelts = (item.language === "ielts");

      const itemEl = document.createElement("div");
      itemEl.className = "history-item";
      itemEl.innerHTML = `
        <div class="history-item-left">
          <div class="history-mode-line">
            <span class="history-lang-badge ${isIelts ? 'ielts' : 'hsk'}">${isIelts ? '🇬🇧 IELTS' : '🇨🇳 HSK'}</span>
            <span class="history-mode-tag">${item.modeIcon} ${item.modeName}</span>
            <span class="history-diff-badge ${dInfo.cls}">${dInfo.chip}</span>
          </div>
          <div class="history-date">${item.dateFormatted}</div>
        </div>
        <div class="history-item-right">
          <div class="history-score">${item.score} / ${item.total} (${item.percentage}%)</div>
          <span class="history-status-badge ${item.isPass ? 'pass' : 'fail'}">
            ${item.isPass ? '합격' : '복습'}
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
    if (confirm("정말로 모든 학습 기록을 삭제하시겠습니까?")) {
      localStorage.removeItem(getStorageKey());
      renderHistoryModal();
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
  }

  // 9. 이벤트 바인딩
  langHskBtn.addEventListener("click", () => setLanguage("hsk"));
  langIeltsBtn.addEventListener("click", () => setLanguage("ielts"));

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
  });

  ttsSpeedSelect.addEventListener("change", (e) => {
    ttsSpeed = parseFloat(e.target.value);
  });

  nextBtn.addEventListener("click", nextQuestion);

  quitBtn.addEventListener("click", () => {
    if (confirm("현재 퀴즈를 중단하고 메인 메뉴로 돌아갈까요?")) {
      stopListeningAudio();
      showView("setup");
    }
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
    renderModeGrid();
    initVoices();
    updateSrsDashboard();
  });
});
