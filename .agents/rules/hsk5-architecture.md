---
trigger: always_on
description: "HSK5_Study 5-Agent Hierarchy and 5-Step Development Pipeline Protocol"
---

# HSK5_Study 5-Agent Architecture & 5-Step Pipeline Rule

In this project (`/Users/essim/Desktop/HSK5_Study`), all development, feature enhancement, bug fixes, or refactoring must strictly adhere to the **5-Agent Hierarchical Team Structure** and the **5-Step Development Pipeline**:

```
[Step 1: 기획&브랜치] ──> [Step 2: 에이전트 구현] ──> [Step 3: 로컬 검증 (QA)] ──> [Step 4: Git Push & 배포] ──> [Step 5: 라이브 최종 점검]
```

### 1. 5-Agent Roles & Hierarchy
1. **👑 Team Manager Agent (`hsk5-team-manager`)**:
   - Central orchestrator and sole controller.
   - Decomposes user requests into non-overlapping tasks, manages Step 1 branching, coordinates Step 2 implementation, reviews Step 3 QA, authorizes Step 4 releases, and verifies Step 5 live smoke test.
2. **🎨 UI/UX Architect Agent (`hsk5-ui-ux-architect`)**:
   - Owns HTML markup (`index.html`), CSS styling (`style.css`), responsive layout (<= 480px defensive rules), and 3-language localization dictionaries (`I18N: ko, zh, en`).
3. **🧠 Quiz Engine Agent (`hsk5-quiz-engine`)**:
   - Owns 8 study modes, SRS spaced repetition algorithm, difficulty/quantity filtering, and dataset compilation (`vocab/*.json`, `ielts/*.json`, `vocab_data.js`, `build_data.js`).
4. **🔊 Multimedia & Audio Agent (`hsk5-multimedia-audio`)**:
   - Owns Web Speech API TTS (`speechSynthesis`), Speech Recognition STT (`SpeechRecognition`), auto-pronunciation, playback speed (0.8x, 1.0x, 1.2x, 1.5x), and LCS speech diff comparisons.
5. **🛡️ Validation & QA Agent (`hsk5-qa-validator`)**:
   - Mandatory Gatekeeper.
   - Performs syntax checking (`node --check`), SRS state validation, layout audit, and 8-mode regression testing via `node scripts/validate_local.js`.
   - Runs post-deployment live smoke testing via `node scripts/smoke_test_live.js`.

### 2. Mandatory Gatekeeper Signals & Rules
- **Step 3 Gatekeeper Requirement**:
  - No code or data may be committed or merged into `main` without running `node scripts/validate_local.js` and obtaining the explicit gatekeeper signal:
    ```
    🎉 [PASS] HSK5_Study Local Stable
    ```
- **Step 4 Deployment**:
  - Use Semantic Commit messages (`feat:`, `fix:`, `docs:`, `style:`) and merge to `main`.
- **Step 5 Live Verification**:
  - After deployment, run `node scripts/smoke_test_live.js` against `https://ses840105.github.io/HSK5_Study/` to obtain:
    ```
    🎉 [PASS] HSK5_Study Live Production Smoke Test Complete — Task Closed
    ```
- **Audio Rule**:
  - Never execute standalone audio alerts (`afplay Glass.aiff` / `Sosumi.aiff`) inside subagents; only the top-level coordinator plays the final notification upon full completion.
