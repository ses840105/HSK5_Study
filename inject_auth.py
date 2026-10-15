import re

with open("index.html", "r") as f:
    html = f.read()

# 1. Add auth container right after <body>
auth_ui = """
  <!-- Auth Container -->
  <div id="auth-container" class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <h2>👋 환영합니다!</h2>
        <p>계속하려면 로그인하세요.</p>
      </div>
      <div id="login-section">
        <input type="text" id="auth-id" placeholder="아이디" class="auth-input">
        <input type="password" id="auth-pw" placeholder="비밀번호" class="auth-input">
        <button id="login-btn" class="action-btn w-100">로그인</button>
        <p class="auth-switch">계정이 없으신가요? <span id="go-signup">회원가입</span></p>
      </div>
      <div id="signup-section" style="display: none;">
        <input type="text" id="signup-id" placeholder="새 아이디" class="auth-input">
        <input type="password" id="signup-pw" placeholder="비밀번호" class="auth-input">
        <input type="password" id="signup-pw-confirm" placeholder="비밀번호 확인" class="auth-input">
        <button id="signup-btn" class="action-btn w-100" style="background: var(--success);">회원가입</button>
        <p class="auth-switch">이미 계정이 있으신가요? <span id="go-login">로그인</span></p>
      </div>
    </div>
  </div>
"""
html = html.replace('<body>', '<body>\n' + auth_ui)

# 2. Add logout button to header-right
logout_btn = '<button id="logout-btn" class="header-action-btn" style="color: var(--danger);" title="로그아웃"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></button>\n        '
html = html.replace('<div class="header-right">', '<div class="header-right">\n        ' + logout_btn)

# 3. Add auth.js script tag
html = html.replace('<script src="app.js"></script>', '<script src="auth.js"></script>\n  <script src="app.js"></script>')

with open("index.html", "w") as f:
    f.write(html)
print("index.html updated.")
