# Jetski Development Guide for HSK5_Study

본 문서는 Jetski CLI 에이전트 및 팀 개발자를 위한 **HSK5_Study** 프로젝트 표준 개발 및 오케스트레이션 가이드입니다. (`HSK5_Study_Dev_Guide.md`와 동일한 5단계 개발 파이프라인 표준을 공유합니다.)

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

### Step 2: 역할별 에이전트 구현 (Agent Implementation)
- **주관**: 각 전문 서브 에이전트 (`🎨 UI/UX`, `🧠 Quiz Engine`, `🔊 Multimedia`)
- **구현 표준**:
  - **UI/UX 구현 지침**: 인라인 스타일 지양, 클래스 기반 반응형 스타일링, `I18N` 3개국어 대칭성 보장.
  - **데이터셋 JSON 스키마 지침**: JSON 배열 구조 및 필수 필드 보장, `node build_data.js`로 번들 동기화.
  - **멀티미디어 구현 지침**: Web Speech API 세션 분리(`speechSessionId`), 배속 rate 바인딩.

### Step 3: 로컬 검증 (QA Gatekeeper Verification)
- **주관**: 🛡️ Validation & QA Agent
- **자동화 도구**:
  ```bash
  node scripts/validate_local.js
  ```
- **검증 항목**:
  1. 콘솔 에러 0개 (`node --check` 및 브라우저 VM 런타임)
  2. 모바일 반응형(<= 480px) SRS 카운터 및 `#start-btn` 정렬
  3. 5문항 풀이 시뮬레이션 및 새로고침(F5) 영속성
  4. 오디오 세부 배속(`0.8x`, `1.0x`, `1.2x`, `1.5x`)
  5. 회귀 테스트 및 롤백 수칙 준수
- **Gatekeeper 승인 신호**:
  ```
  🎉 [PASS] HSK5_Study Local Stable
  ```

### Step 4: Git Push & 배포 (Merge & Deployment)
- **주관**: 👑 Team Manager Agent
- **Semantic Commit 표준**: `feat:`, `fix:`, `docs:`, `style:`
- **배포 명령**:
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
- **최종 종결 신호**:
  ```
  🎉 [PASS] HSK5_Study Live Production Smoke Test Complete — Task Closed
  ```

---

## Part 3: Test Automation & CI/CD Guide
1. **로컬 자동 검증**: `node scripts/validate_local.js` (외부 npm 종속성 없음)
2. **라이브 스모크 테스트**: `node scripts/smoke_test_live.js` (GitHub Pages 원격 검증)
3. **GitHub Actions CI/CD**: `.github/workflows/ci-validate.yml` (PR 및 푸시 시 자동 검증)
