# HSK5_Study 프로젝트 개발 및 서브 에이전트 표준 가이드 (HSK5_Study Dev Guide)

본 문서는 **HSK5_Study** (`/Users/essim/Desktop/HSK5_Study`, GitHub: [https://github.com/ses840105/HSK5_Study](https://github.com/ses840105/HSK5_Study), Live: [https://ses840105.github.io/HSK5_Study/](https://ses840105.github.io/HSK5_Study/))의 5대 전문 서브 에이전트 역할 및 책임, **5-Step Development Pipeline (기획부터 라이브 검증까지)**, 그리고 로컬/CI 자동화 도구 운영 표준을 정의합니다.

---

## 📑 목차 (Table of Contents)
1. [Part 1: Sub-Agent Roles & Responsibilities (5대 전문 에이전트 역할 및 책임)](#part-1-sub-agent-roles--responsibilities)
2. [Part 2: The 5-Step Development Pipeline (5단계 표준 개발 파이프라인)](#part-2-the-5-step-development-pipeline)
   - [Step 1: 기획 & 브랜치 생성 (Planning & Branching)](#step-1-기획--브랜치-생성-planning--branching)
   - [Step 2: 역할별 에이전트 구현 (Agent Implementation)](#step-2-역할별-에이전트-구현-agent-implementation)
   - [Step 3: 로컬 검증 (QA Gatekeeper Verification)](#step-3-로컬-검증-qa-gatekeeper-verification)
   - [Step 4: Git Push & 배포 (Merge & Deployment)](#step-4-git-push--배포-merge--deployment)
   - [Step 5: 라이브 최종 점검 (Live Production Smoke Test)](#step-5-라이브-최종-점검-live-production-smoke-test)
3. [Part 3: Test Automation & CI/CD Guide (자동화 스크립트 및 CI 운영)](#part-3-test-automation--cicd-guide)

---

## Part 1: Sub-Agent Roles & Responsibilities

프로젝트 내 모든 변경 작업은 엄격한 단일 책임 원칙(Single Responsibility Principle)에 따라 5대 에이전트로 분할되어 수행됩니다.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     👑 1. Team Manager Agent                            │
│                 (총괄 지휘, 태스크 분해, QA 검토, 배포 승인)                 │
└──────────┬─────────────────────────────┬───────────────────────────────┘
           │                             │
           ▼                             ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 🎨 2. UI/UX Architect   │  │ 🧠 3. Quiz Engine       │  │ 🔊 4. Multimedia/Audio │
│ (HTML/CSS, 반응형, i18n) │  │ (8대 모드, SRS, DB 필터)│  │ (TTS/STT, 배속, LCS Diff)│
└──────────┬──────────────┘  └───────────┬─────────────┘  └───────────┬─────────────┘
           │                             │                            │
           └─────────────────────────────┼────────────────────────────┘
                                         ▼
                    ┌────────────────────────────────────────┐
                    │      🛡️ 5. Validation & QA Agent       │
                    │   (Gatekeeper: 구문/SRS/회귀 전수 검증)   │
                    └────────────────────┬───────────────────┘
                                         ▼ [ALL PASS Sign-off]
                    ┌────────────────────────────────────────┐
                    │      🚀 Production Deployment          │
                    │      (build_data.js & GitHub Push)     │
                    └────────────────────┬───────────────────┘
                                         ▼
                    ┌────────────────────────────────────────┐
                    │      🌐 Live Production Smoke Test     │
                    │      (scripts/smoke_test_live.js)      │
                    └────────────────────────────────────────┘
```

### 👑 1. Team Manager Agent (`hsk5-team-manager`)
- **담당 영역**: 프로젝트 전체 총괄 오케스트레이션 및 릴리즈 승인
- **주요 책임**:
  - 사용자 요구사항 접수, 영향도 분석, 비충돌(non-overlapping) 서브 에이전트 태스크 분해.
  - Step 1 브랜치 생성 지휘 및 Step 2 구현 순서(선후 관계) 조율.
  - Step 3 `hsk5-qa-validator`의 `[PASS] HSK5_Study Local Stable` 리포트 심사.
  - Step 4 GitHub `main` 배포 승인 및 Step 5 라이브 연동 최종 종결(Task Closed).

### 🎨 2. UI/UX Architect Agent (`hsk5-ui-ux-architect`)
- **담당 영역**: `index.html`, `style.css`, `app.js` (UI 렌더링 & `I18N`)
- **주요 책임**:
  - 시맨틱 HTML5 구조 유지, 과목 전환(`HSK 5급` / `IELTS 영어`), 언어 스위처(`🇨🇳 中文`, `🇰🇷 한국어`, `🇬🇧 English`).
  - 모바일(320px~480px) 뷰포트에서 SRS 요약 박스(`#srs-mastered-count`, `#srs-review-count`, `#srs-new-count`) 텍스트 클리핑 방지 및 시작 버튼(`#start-btn`) 하단 정렬 유지.
  - 3개 언어 다국어 번역 사전(`I18N = { ko, zh, en }`) 동기화.

### 🧠 3. Quiz Engine Agent (`hsk5-quiz-engine`)
- **담당 영역**: `app.js` (State Machine & Logic), `vocab_data.js`, `build_data.js`, `vocab/*.json`, `ielts/*.json`
- **주요 책임**:
  - 8대 학습 모드(`vocab`, `listening`, `chengyu`/`idioms`, `cloze`, `reading`, `grammar`, `dictation`, `mixed`) 출제/채점 관리.
  - 간격 반복(SRS) 시스템: `localStorage` 기반 마스터(`mastered`, 자동 졸업), 복습 대기(`review`, 우선 출제), 미도전(`new`) 상태 전이 및 초기화.
  - `node build_data.js`를 통한 데이터셋 번들 컴파일 및 무결성 유지.

### 🔊 4. Multimedia & Audio Agent (`hsk5-multimedia-audio`)
- **담당 영역**: `app.js` (TTS, STT, Diff), `index.html` (오디오 컨트롤 UI)
- **주요 책임**:
  - Web Speech API TTS(`speechSynthesis`) 비동기 충돌 방지(`speechSessionId`, `cancel()`), 2인 대화 재생 및 지문 낭독.
  - 세부 재생 속도 옵션(`0.8x`, `1.0x`, `1.2x`, `1.5x` 등) `SpeechSynthesisUtterance.rate` 바인딩.
  - 말하기 딕테이션(`SpeechRecognition`) 마이크 제어, 중국어/영어 음성인식 정규화, LCS 기반 글자/단어 단위 정밀 Diff 시각화.

### 🛡️ 5. Validation & Quality Assurance Agent (`hsk5-qa-validator`)
- **담당 영역**: `scripts/validate_local.js`, `scripts/smoke_test_live.js`, CI/CD 검증 스위트
- **주요 책임**:
  - **Gatekeeper 원칙**: 구문 검증(`node --check`), DOM ID 및 CSS 매핑 무결성, SRS 5문항 풀이 + F5 리로드 영속성 검증.
  - 전 영역 회귀 테스트 수행 후 `[PASS] HSK5_Study Local Stable` 신호 발행.
  - 배포 후 Step 5 라이브 스모크 테스트(`scripts/smoke_test_live.js`) 수행.

---

## Part 2: The 5-Step Development Pipeline

모든 기능 추가 및 버그 수정은 아래 5단계를 엄격히 순서대로 밟아야 합니다:

```
[Step 1: 기획&브랜치] ──> [Step 2: 에이전트 구현] ──> [Step 3: 로컬 검증 (QA)] ──> [Step 4: Git Push & 배포] ──> [Step 5: 라이브 최종 점검]
```

### Step 1: 기획 & 브랜치 생성 (Planning & Branching)
- **주관**: 👑 Team Manager Agent
- **절차**:
  1. 사용자 요구사항을 접수하고 영향받는 파일 스코프(`index.html`, `style.css`, `app.js`, `vocab/*.json` 등)를 식별합니다.
  2. `main` 브랜치를 최신 상태로 동기화하고 의도를 명확히 표현하는 기능 브랜치를 생성합니다:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b feature/<feature-name>   # 또는 fix/<bug-name>
     ```
  3. 브랜치 명명 표준:
     - `feature/speaking-dictation-speed`
     - `feature/reading-passage-fontsize`
     - `fix/srs-counter-persistence`

### Step 2: 역할별 에이전트 구현 (Agent Implementation)
- **주관**: 각 전문 서브 에이전트 (`🎨 UI/UX`, `🧠 Quiz Engine`, `🔊 Multimedia`)
- **구현 표준**:
  - **UI/UX 구현 지침**:
    - 인라인 스타일(`style="..."`) 대신 클래스 기반 재정의(`.srs-stat-box`, `.action-wrap`, 미디어 쿼리)를 우선 사용합니다.
    - 모바일 화면(최소 320px~480px)에서 버튼 잘림, 텍스트 줄바꿈 충돌이 없도록 방어적으로 스타일링합니다.
    - 다국어 번역 사전(`I18N.ko`, `I18N.zh`, `I18N.en`)에 누락된 키가 없도록 대칭성을 유지합니다.
  - **데이터셋 JSON 스키마 지침** (`vocab/*.json`, `ielts/*.json`):
    - 반드시 JSON 배열(`[...]`) 구조여야 하며, 고유 식별자(`id`), 난이도(`difficulty`: 하/중/상), 원문 및 정답/해설 필드가 필수 포함되어야 합니다.
    - 데이터 파일 수정 후 즉시 `node build_data.js`를 실행하여 `vocab_data.js` 번들을 최신화합니다.
  - **음성/멀티미디어 구현 지침**:
    - 음성 배속 변경 시 `ttsSpeedSelect` 변경 이벤트와 `SpeechSynthesisUtterance.rate`를 100% 동기화합니다.
    - 문제 전환 시 기존 발화가 중첩되지 않도록 `window.speechSynthesis.cancel()` 처리를 누락하지 않습니다.

### Step 3: 로컬 검증 (QA Gatekeeper Verification)
- **주관**: 🛡️ Validation & QA Agent
- **자동화 도구**:
  ```bash
  node scripts/validate_local.js
  ```
- **검증 체크리스트**:
  1. **콘솔 에러 0개 (Console Error 0)**: `node --check` 및 샌드박스 VM 실행 시 `Uncaught ReferenceError`나 `TypeError`가 0개여야 함.
  2. **모바일 반응형 UI 정렬**: 320px~480px 뷰포트에서 SRS 통계 박스 텍스트 클리핑 방지 및 `#start-btn` 정상 정렬.
  3. **SRS 로직 및 F5 새로고침 영속성**: 5문항 풀이 시뮬레이션 후 `localStorage` 저장 확인 ➔ 브라우저 새로고침(F5) 시뮬레이션 후에도 SRS 마스터/복습 카운트가 100% 유지되어야 함.
  4. **오디오 세부 배속 검증**: `0.8x`, `1.0x`, `1.2x`, `1.5x` 선택 시 실제 발화 `rate` 일치 확인.
  5. **회귀 테스트**: 기존 8대 모드 및 HSK/IELTS 과목 전환 기능 정상 작동 확인.
- **Rollback Rule (롤백 수칙)**:
  - 검증 항목 중 단 하나라도 실패하면 즉시 직전 커밋으로 롤백하거나 에러 원인을 완벽히 수정한 후 재검증합니다.
- **Gatekeeper 승인 신호**:
  - 검증 완료 시 반드시 터미널에 아래 승인 신호가 출력되어야 Step 4 배포 단계로 진입할 수 있습니다:
    ```
    🎉 [PASS] HSK5_Study Local Stable
    ```

### Step 4: Git Push & 배포 (Merge & Deployment)
- **주관**: 👑 Team Manager Agent
- **커밋 메시지 표준 (Semantic Commit Messages)**:
  - `feat: <신규 기능 요약>` (예: `feat: 자동 발음 속도 세부 배속 선택 기능 추가 및 UI 정렬 수정`)
  - `fix: <버그 수정 요약>` (예: `fix: 모바일 화면 SRS 카운터 텍스트 클리핑 수정`)
  - `docs: <문서 갱신 요약>` (예: `docs: 개발 가이드 및 5단계 파이프라인 표준 추가`)
  - `style: <UI 디자인/CSS 수정>` (예: `style: 퀴즈 시작 버튼 하단 정렬 최적화`)
- **배포 실행 명령**:
  ```bash
  git add .
  git commit -m "feat: 자동 발음 속도 세부 배속 선택 기능 추가 및 UI 정렬 수정"
  git push origin feature/<feature-name>
  git checkout main
  git pull origin main
  git merge feature/<feature-name>
  git push origin main
  ```

### Step 5: 라이브 최종 점검 (Live Production Smoke Test)
- **주관**: 🛡️ Validation & QA Agent (최종 확인: 👑 Team Manager Agent)
- **자동화 도구**:
  ```bash
  node scripts/smoke_test_live.js
  ```
- **검증 절차**:
  1. 배포 대상 라이브 URL: [https://ses840105.github.io/HSK5_Study/](https://ses840105.github.io/HSK5_Study/)
  2. CDN 캐시를 완전히 우회(`Ctrl + F5` 동등: `Cache-Control: no-cache` 및 타임스탬프 쿼리 `?cb=...`)하여 원격 에셋을 페칭합니다.
  3. 신규 기능 배포 서명(`1.5x`, `IELTS 영어`, `HSK 5급`, `퀴즈 시작하기 🚀`)이 원격 라이브 사이트에 실제 반영되었는지 검증합니다.
  4. 프로덕션 자바스크립트 에셋을 샌드박스 VM에서 실행하여 실서버 런타임 콘솔 에러가 0개임을 확인합니다.
  5. 최종 라이브 신호 확인:
     ```
     🎉 [PASS] HSK5_Study Live Production Smoke Test Complete — Task Closed
     ```
  6. 위 신호 수신 시 사용자의 기능 개발 작업이 최종적으로 **종결(Closed)**됩니다.

---

## Part 3: Test Automation & CI/CD Guide

### 1. 로컬 자동 검증 스크립트 실행
```bash
node scripts/validate_local.js
```
- Node.js 내장 모듈(`vm`, `fs`, `path`, `child_process`)만을 사용하여 별도의 `npm install` 없이 즉시 실행됩니다.
- 구문 오류, JSON 무결성, 반응형 CSS, 오디오 배속, SRS 영속성을 전수 검사합니다.

### 2. 라이브 스모크 테스트 실행
```bash
node scripts/smoke_test_live.js
```
- GitHub Pages 배포 완료 시점(약 20~40초 소요)을 자동으로 감지하고 최대 12회 폴링하여 라이브 반영을 검증합니다.

### 3. GitHub Actions CI/CD (`.github/workflows/ci-validate.yml`)
- `main`, `feature/**`, `fix/**` 브랜치에 푸시되거나 PR이 생성될 때 자동으로 동작합니다.
- `node --check` 및 `node scripts/validate_local.js`를 실행하여 회귀 버그 발생 시 빌드를 자동 차단합니다.
