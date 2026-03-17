document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const firebaseConfig = {
        apiKey: "AIzaSyBtgWu9o4ch8e54bYq_CSLPOOwMuenrmQg",
        authDomain: "hr-management-5db8b.firebaseapp.com",
        projectId: "hr-management-5db8b",
        storageBucket: "hr-management-5db8b.firebasestorage.app",
        messagingSenderId: "82299461173",
        appId: "1:82299461173:web:c45f93def8479c43011b7c"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    // Your web app's Firebase configuration


    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");

    const signupName = document.getElementById("signupName");
    const signupUsername = document.getElementById("signupUsername");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const signupConfirmPassword = document.getElementById("signupConfirmPassword");

    const loginAuthError = document.getElementById("loginAuthError");
    const signupAuthError = document.getElementById("signupAuthError");
    const signupConfirmPasswordError = document.getElementById("signupConfirmPasswordError");

    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const btnLogin = document.getElementById("btnLogin");
    const btnSignup = document.getElementById("btnSignup");

    if (!loginForm || !signupForm || !loginTab || !signupTab || !btnLogin || !btnSignup || !loginAuthError || !signupAuthError || !signupConfirmPasswordError) {
        return;
    }

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(";").shift();
        }
        return "";
    };

    const hideError = (element) => {
        element.classList.add("hidden");
    };

    const showError = (element, message) => {
        element.textContent = message;
        element.classList.remove("hidden");
    };

    const clearAllErrors = () => {
        hideError(loginAuthError);
        hideError(signupAuthError);
        hideError(signupConfirmPasswordError);
    };

    const showLogin = () => {
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        loginTab.classList.add("login-tab-active");
        signupTab.classList.remove("login-tab-active");
    };
    const showLogin = () => {
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        loginTab.classList.add("login-tab-active");
        signupTab.classList.remove("login-tab-active");
        clearAllErrors();
    };

    const showSignup = () => {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
        loginTab.classList.remove("login-tab-active");
        signupTab.classList.add("login-tab-active");
    };
    const showSignup = () => {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
        loginTab.classList.remove("login-tab-active");
        signupTab.classList.add("login-tab-active");
        clearAllErrors();
    };

    loginTab.addEventListener("click", showLogin);
    signupTab.addEventListener("click", showSignup);

    const postJson = async(url, payload) => {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify(payload)
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        return { response, data };
    };

    // Login form using Django Authentication.
    btnLogin.addEventListener("click", async() => {
        clearAllErrors();

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            showError(loginAuthError, "Please enter both email and password.");
            return;
        }

        try {
            const { response, data } = await postJson("/home/auth/login", { email, password });

            if (!response.ok) {
                showError(loginAuthError, data.message || "Invalid email or password. Please try again.");
                return;
            }

            window.location.href = "/home/";
        } catch (error) {
            console.log(error.message);
            showError(loginAuthError, "Login failed. Please try again.");
        }
    });

    // Sign up form using Django Authentication.
    btnSignup.addEventListener("click", async() => {
        clearAllErrors();

        const name = signupName.value.trim();
        const username = signupUsername.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value.trim();
        const confirmPassword = signupConfirmPassword.value.trim();

        if (!name || !username || !email || !password || !confirmPassword) {
            showError(signupAuthError, "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            showError(signupConfirmPasswordError, "Password doesn't match for password confirmation.");
            return;
        }

        try {
            const { response, data } = await postJson("/home/auth/signup", {
                name,
                username,
                email,
                password,
                confirmPassword
            });

            if (!response.ok) {
                if (data.code === "password_mismatch") {
                    showError(signupConfirmPasswordError, data.message || "Password doesn't match for password confirmation.");
                } else {
                    showError(signupAuthError, data.message || "Sign up failed.");
                }
                return;
            }

            showLogin();
            loginEmail.value = email;
            loginPassword.value = "";
        } catch (error) {
            console.log(error.message);
            showError(signupAuthError, "Sign up failed. Please try again.");
        }
    });

    [loginEmail, loginPassword, signupName, signupUsername, signupEmail, signupPassword, signupConfirmPassword].forEach((input) => {
        input.addEventListener("input", clearAllErrors);
    });
});