# 🌐 다국어 마스터 퀴즈 플랫폼 (🇨🇳 HSK 5급 & 🇬🇧 IELTS 영어)

HSK 5급 중국어와 IELTS(International English Language Testing System) 영어를 한 화면에서 자유롭게 오가며 공부할 수 있는 올인원 인터랙티브 학습 시스템입니다.

---

## 📂 프로젝트 폴더 구조

```text
/Users/essim/Desktop/HSK5_Study/
├── index.html                             # 🌐 다국어 웹 퀴즈 앱 UI (HSK 5급 & IELTS 탭 스위처)
├── style.css                              # 🎨 반응형 스타일시트 (HSK 레드 & IELTS 네이비 테마)
├── app.js                                 # ⚡ 다국어 퀴즈 엔진 & Web Speech API (zh-CN & en-US)
├── vocab_data.js                          # ⚡ 오프라인 더블클릭 실행을 위한 다국어 통합 번들 데이터
├── start_web.py                           # 🚀 웹 퀴즈 로컬 서버 및 브라우저 자동 실행기
├── quiz_cli.py                            # 🎯 터미널 다국어 퀴즈 CLI (--lang hsk / ielts)
├── vocab/                                 # 🇨🇳 중국어 HSK 5급 데이터셋
│   ├── hsk5_core_vocabulary.json          # 📚 빈출 핵심 어휘 (난이도 상/중/하)
│   ├── hsk5_listening.json               # 🎧 듣기 1~2부분 실전 대화 및 단문 (난이도 상/중/하)
│   ├── hsk5_collocations.json            # 🔗 고정 짝꿍 배합(搭配)
│   ├── hsk5_chengyu.json                # 🀄 빈출 사자성어 30선 & 문맥 빈칸
│   ├── hsk5_cloze.json                   # 🧩 독해 1부분 실전 빈칸
│   └── hsk5_grammar.json                 # 📑 특수구문/접속사/어순배열 문법
└── ielts/                                 # 🇬🇧 영어 IELTS 데이터셋
    ├── ielts_vocab.json                  # 📚 Band 7+ 아카데믹 필수 어휘 및 유의어
    ├── ielts_listening.json              # 🎧 Section 1~4 실전 대화 및 학술 강의 리스닝
    ├── ielts_idioms.json                 # 💡 스피킹 & 라이팅 고득점 필수 관용구(Idioms)
    ├── ielts_cloze.json                  # 🔗 리딩 Academic Collocations 빈칸 완성
    └── ielts_grammar.json                # 📑 라이팅 Task 2 복합문/도치/분사구문 문법
```

---

## 🌐 1. 브라우저 스마트 웹 퀴즈 사용법 (강력 추천!)

```bash
# 방법 A: 더블클릭 (가장 간편)
# 바탕화면 HSK5_Study 폴더 내 'index.html'을 마우스로 더블클릭!

# 방법 B: 파이썬 런처 실행 (터미널)
cd /Users/essim/Desktop/HSK5_Study
python3 start_web.py
```

### 🌟 다국어 핵심 기능
1. **🧠 스마트 오답 집중 복습 (SRS) 시스템**:
   - **맞춘 단어/문제**: '마스터 완료(졸업)' 처리되어 **다음 퀴즈 시도에서 자동으로 출제 제외**.
   - **틀린 단어/문제**: '집중 복습' 대상으로 등록되어 **다음 퀴즈 시도 시 최우선 재출제**.
   - 메인 화면에 **마스터 / 복습 대기 / 미도전** 실시간 진도 대시보드 및 언제든 처음부터 다시 풀 수 있는 `[🔄 진도 초기화]` 버튼 제공.
2. **상단 언어 전환 탭**: `[ 🇨🇳 HSK 5급 ]`과 `[ 🇬🇧 IELTS 영어 ]`를 클릭 한 번으로 자유롭게 전환.
3. **고음질 원어민 음성(TTS)**:
   - 중국어 모드: `zh-CN` (Google 번역기 음성 / Apple Tingting 등)
   - 영어 모드: `en-US` (Google US English / Apple Samantha 미국식 원어민 음성)
4. **오디오 컨트롤 바**: 듣기/리스닝 문제 시 `[ ⏸️ 일시정지 ]`, `[ ▶️ 이어듣기 ]`, `[ 🔄 처음부터 ]` 조작 가능.
5. **🎵 정답 / 오답 맞춤형 효과음**: 정답 시 맑은 3음 차임벨(도-미-솔), 오답 시 부드러운 하강 버저음 자동 출력.
6. **상 / 중 / 하 3단계 난이도**: 기본 단문부터 장문 아카데믹 독백까지 맞춤 출제.
7. **학습 기록 연동**: 브라우저에 저장되는 기록에 언어 배지(`[🇨🇳 HSK]` / `[🇬🇧 IELTS]`)와 난이도가 함께 영구 보관.

---

## 💻 2. 터미널 올인원 퀴즈 프로그램 사용법 (CLI)

```bash
cd /Users/essim/Desktop/HSK5_Study

# 1. 인터랙티브 대화형 메뉴 실행 (언어 ➔ SRS 현황 ➔ 모드 ➔ 난이도 ➔ 문제 수 선택)
python3 quiz_cli.py

# 2. IELTS 영어 모드 실행 (--lang ielts)
# IELTS 리스닝 고난도(상) 5문제 (틀린 문제 우선 출제, 맞춘 문제 자동 제외)
python3 quiz_cli.py -l ielts --mode listening -d 상 -n 5

# IELTS 아카데믹 어휘(중) 5문제
python3 quiz_cli.py -l ielts --mode vocab -d 중 -n 5

# 3. 진도 초기화 (--reset)
python3 quiz_cli.py -l ielts --reset
python3 quiz_cli.py -l hsk --reset
```
