---
trigger: always_on
description: "HSK5_Study 5-Agent Hierarchy and Team Manager Orchestration Protocol"
---

# HSK5_Study 5-Agent Architecture & Orchestration Rule

In this project (`/Users/essim/Desktop/HSK5_Study`), any development, feature enhancement, bug fix, or refactoring must strictly adhere to the **5-Agent Hierarchical Team Structure**:

1. **👑 Team Manager Agent (`hsk5-team-manager`)**:
   - Central orchestrator and sole controller.
   - Decomposes user requests into non-overlapping tasks for specialist subagents.
   - Governs task flow, reviews QA results, and authorizes releases/deployments.
2. **🎨 UI/UX Architect Agent (`hsk5-ui-ux-architect`)**:
   - Owns HTML markup (`index.html`), CSS styling (`style.css`), responsive layout, and 3-language localization dictionaries (`I18N: ko, zh, en`).
3. **🧠 Quiz Engine Agent (`hsk5-quiz-engine`)**:
   - Owns 8 study modes, SRS spaced repetition algorithm, difficulty/quantity filtering, and dataset synchronization (`vocab/*.json`, `ielts/*.json`, `vocab_data.js`, `build_data.js`).
4. **🔊 Multimedia & Audio Agent (`hsk5-multimedia-audio`)**:
   - Owns Web Speech API TTS (`speechSynthesis`), Speech Recognition STT (`SpeechRecognition`), auto-pronunciation, playback speed, and LCS speech diff comparisons.
5. **🛡️ Validation & QA Agent (`hsk5-qa-validator`)**:
   - Mandatory Gatekeeper.
   - Performs syntax checking (`node --check`), SRS state validation, layout audit, and 8-mode regression testing.
   - Outputs standardized `PASS / FAIL` reports.

### Deployment Gatekeeper Requirement
- **No code, data, or feature may be pushed or deployed to GitHub without a formal `ALL PASS` sign-off from `hsk5-qa-validator` reviewed and approved by `hsk5-team-manager`.**
- Never execute standalone audio alerts (`afplay Glass.aiff` / `Sosumi.aiff`) inside subagents; only the top-level coordinator plays the final notification upon completion.
