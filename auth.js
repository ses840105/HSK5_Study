document.addEventListener("DOMContentLoaded", () => {
  const authContainer = document.getElementById("auth-container");
  const appContainer = document.querySelector(".app-container");

  const loginSection = document.getElementById("login-section");
  const signupSection = document.getElementById("signup-section");
  const goSignupBtn = document.getElementById("go-signup");
  const goLoginBtn = document.getElementById("go-login");

  const loginIdInput = document.getElementById("auth-id");
  const loginPwInput = document.getElementById("auth-pw");
  const loginBtn = document.getElementById("login-btn");

  const signupIdInput = document.getElementById("signup-id");
  const signupPwInput = document.getElementById("signup-pw");
  const signupPwConfirmInput = document.getElementById("signup-pw-confirm");
  const signupBtn = document.getElementById("signup-btn");

  const logoutBtn = document.getElementById("logout-btn");

  // 상태 확인 및 메인 앱 상태 동기화
  function checkAuth() {
    const user = localStorage.getItem("loggedInUser");
    const userGreeting = document.getElementById("user-greeting");

    if (user) {
      authContainer.style.display = "none";
      appContainer.style.display = "flex";
      if (userGreeting) {
        if (typeof window.updateUserGreeting === "function") {
          window.updateUserGreeting(user);
        } else {
          userGreeting.innerText = `${user}님 반갑습니다!`;
        }
      }
    } else {
      authContainer.style.display = "flex";
      appContainer.style.display = "none";
      if (userGreeting) userGreeting.innerText = "";
    }

    if (typeof window.onAuthStateChanged === "function") {
      window.onAuthStateChanged(user);
    }
  }
  window.checkAuth = checkAuth;

  // 화면 전환
  goSignupBtn.addEventListener("click", () => {
    loginSection.style.display = "none";
    signupSection.style.display = "block";
  });

  goLoginBtn.addEventListener("click", () => {
    signupSection.style.display = "none";
    loginSection.style.display = "block";
  });

  // DB Mock (로컬 스토리지)
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("mock_users") || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveUsers(users) {
    localStorage.setItem("mock_users", JSON.stringify(users));
  }

  // 회원가입 로직
  signupBtn.addEventListener("click", () => {
    const id = signupIdInput.value.trim();
    const pw = signupPwInput.value.trim();
    const pwc = signupPwConfirmInput.value.trim();

    if (!id || !pw) return alert("아이디와 비밀번호를 입력해주세요.");
    if (pw !== pwc) return alert("비밀번호가 일치하지 않습니다.");

    const users = getUsers();
    if (users[id]) {
      return alert("이미 존재하는 아이디입니다.");
    }

    users[id] = pw;
    saveUsers(users);

    signupIdInput.value = "";
    signupPwInput.value = "";
    signupPwConfirmInput.value = "";
    localStorage.setItem("loggedInUser", id);
    goLoginBtn.click();
    checkAuth();
  });

  // 로그인 로직
  loginBtn.addEventListener("click", () => {
    const id = loginIdInput.value.trim();
    const pw = loginPwInput.value.trim();

    if (!id || !pw) return alert("아이디와 비밀번호를 입력해주세요.");

    const users = getUsers();
    if (users[id] && users[id] === pw) {
      localStorage.setItem("loggedInUser", id);
      checkAuth();
    } else {
      alert("아이디 또는 비밀번호가 잘못되었습니다.");
    }
  });

  // 엔터키 입력 지원
  [loginIdInput, loginPwInput].forEach(inp => {
    if (inp) {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") loginBtn.click();
      });
    }
  });

  [signupIdInput, signupPwInput, signupPwConfirmInput].forEach(inp => {
    if (inp) {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") signupBtn.click();
      });
    }
  });

  // 로그아웃 로직
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      loginIdInput.value = "";
      loginPwInput.value = "";
      checkAuth();
    });
  }

  // 초기 실행
  checkAuth();
});
