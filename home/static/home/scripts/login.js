document.addEventListener("DOMContentLoaded", () => {
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const btnLogin = document.getElementById("btnLogin");
  const btnSignup = document.getElementById("btnSignup");

  if (!loginTab || !signupTab || !btnLogin || !btnSignup) {
    return;
  }

  const showLogin = () => {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    loginTab.classList.add("login-tab-active");
    signupTab.classList.remove("login-tab-active");
  };

  const showSignup = () => {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    loginTab.classList.remove("login-tab-active");
    signupTab.classList.add("login-tab-active");
  };

  loginTab.addEventListener("click", showLogin);
  signupTab.addEventListener("click", showSignup);

  // Login form – front-end only (no Firebase)
  btnLogin.addEventListener("click", async () => {

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    console.log("Login submitted:", { email });
    alert("connect to Django or Firebase later.");
  });

  // Sign up form – front-end only (no Firebase)
  btnSignup.addEventListener("click", async () => {

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    const confirmPassword = signupConfirmPassword.value.trim();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log("Signup submitted:", { name, email });
    alert("connect to Django or Firebase later.");
    showLogin();
  });
});