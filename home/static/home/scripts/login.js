document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const rememberLogin = document.getElementById("rememberLogin");
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
    const forgotModal = document.getElementById("forgotPasswordModal");
    const btnLogin = document.getElementById("btnLogin");
    const btnSignup = document.getElementById("btnSignup");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
    const closeForgotModal = document.getElementById("closeForgotModal");

    const forgotStepDesc = document.getElementById("forgotStepDesc");
    const forgotStepEmail = document.getElementById("forgotStepEmail");
    const forgotStepCode = document.getElementById("forgotStepCode");
    const forgotStepReset = document.getElementById("forgotStepReset");
    const forgotEmailInput = document.getElementById("forgotEmailInput");
    const forgotCodeInput = document.getElementById("forgotCodeInput");
    const forgotNewPasswordInput = document.getElementById("forgotNewPasswordInput");
    const forgotConfirmPasswordInput = document.getElementById("forgotConfirmPasswordInput");
    const forgotSendCodeBtn = document.getElementById("forgotSendCodeBtn");
    const forgotVerifyCodeBtn = document.getElementById("forgotVerifyCodeBtn");
    const forgotResetPasswordBtn = document.getElementById("forgotResetPasswordBtn");
    const forgotFeedback = document.getElementById("forgotFeedback");

    if (!loginForm || !signupForm || !loginTab || !signupTab || !btnLogin || !btnSignup || !loginAuthError || !signupAuthError || !signupConfirmPasswordError || !forgotModal || !forgotPasswordBtn || !closeForgotModal || !forgotStepDesc || !forgotStepEmail || !forgotStepCode || !forgotStepReset || !forgotEmailInput || !forgotCodeInput || !forgotNewPasswordInput || !forgotConfirmPasswordInput || !forgotSendCodeBtn || !forgotVerifyCodeBtn || !forgotResetPasswordBtn || !forgotFeedback) {
        return console.error("One or more required elements are missing from the DOM.");
    }

    let currentResetEmail = "";
    let savedLoginEmail = "";

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

    const clearForgotFeedback = () => {
        forgotFeedback.classList.add("hidden");
        forgotFeedback.classList.remove("modal-success");
        forgotFeedback.textContent = "";
    };

    const showForgotFeedback = (message, isError = true) => {
        forgotFeedback.textContent = message;
        forgotFeedback.classList.remove("hidden");
        if (isError) {
            forgotFeedback.classList.remove("modal-success");
        } else {
            forgotFeedback.classList.add("modal-success");
        }
    };

    const setForgotStep = (step) => {
        forgotStepEmail.classList.add("hidden");
        forgotStepCode.classList.add("hidden");
        forgotStepReset.classList.add("hidden");

        if (step === "email") {
            forgotStepDesc.textContent = "Enter your email address and we'll send you a code to reset your password.";
            forgotStepEmail.classList.remove("hidden");
            return;
        }

        if (step === "code") {
            forgotStepDesc.textContent = "Check your inbox, then enter the code we sent to your email.";
            forgotStepCode.classList.remove("hidden");
            return;
        }

        forgotStepDesc.textContent = "Code verified. Enter your new password.";
        forgotStepReset.classList.remove("hidden");
    };

    const resetForgotFlow = () => {
        currentResetEmail = "";
        forgotEmailInput.value = "";
        forgotCodeInput.value = "";
        forgotNewPasswordInput.value = "";
        forgotConfirmPasswordInput.value = "";
        clearForgotFeedback();
        setForgotStep("email");
    };

    const showLogin = () => {
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        forgotModal.classList.add("hidden");
        loginTab.classList.add("login-tab-active");
        signupTab.classList.remove("login-tab-active");
        clearAllErrors();
    };

    const showSignup = () => {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
        forgotModal.classList.add("hidden");
        loginTab.classList.remove("login-tab-active");
        signupTab.classList.add("login-tab-active");
        clearAllErrors();
    };

    const showForgot = () => {
        resetForgotFlow();
        forgotModal.classList.remove("hidden");
        loginForm.classList.add("hidden");
        signupForm.classList.add("hidden");
        loginTab.classList.remove("login-tab-active");
        signupTab.classList.remove("login-tab-active");
        clearAllErrors();
    };

    const hideForgot = () => {
        forgotModal.classList.add("hidden");
        showLogin();
    };


    loginTab.addEventListener("click", showLogin);
    signupTab.addEventListener("click", showSignup);
    forgotPasswordBtn.addEventListener("click", (e) => {
        savedLoginEmail = loginEmail.value.trim().toLowerCase();
        e.preventDefault();
        showForgot();
    });
    closeForgotModal.addEventListener("click", hideForgot);

    forgotModal.addEventListener("click", (event) => {
        if (event.target === forgotModal) {
            hideForgot();
        }
    });

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
        const rememberMe = Boolean(rememberLogin && rememberLogin.checked);

        if (!email || !password) {
            showError(loginAuthError, "Please enter both email and password.");
            return;
        }

        try {
            const { response, data } = await postJson("/home/auth/login", { email, password, rememberMe });

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

    forgotSendCodeBtn.addEventListener("click", async() => {
        clearForgotFeedback();

        const email = forgotEmailInput.value.trim().toLowerCase();
        if (!email) {
            showForgotFeedback("Please enter your email address.");
            return;
        }

        if (savedLoginEmail && email !== savedLoginEmail) {
            showForgotFeedback("Email does not match the one entered on login. Please enter the same email.");
            return;
        }

        try {
            const { response, data } = await postJson("/home/auth/password/forgot/send-code", { email });

            if (!response.ok) {
                showForgotFeedback(data.message || "Unable to send code. Please try again.");
                return;
            }

            currentResetEmail = email;
            forgotCodeInput.value = "";
            setForgotStep("code");
            showForgotFeedback(data.message || "Verification code sent.", false);
        } catch (error) {
            console.log(error.message);
            showForgotFeedback("Unable to send code. Please try again.");
        }
    });

    forgotVerifyCodeBtn.addEventListener("click", async() => {
        clearForgotFeedback();

        const code = forgotCodeInput.value.trim();
        if (!currentResetEmail) {
            setForgotStep("email");
            showForgotFeedback("Please enter your email first.");
            return;
        }

        if (!code) {
            showForgotFeedback("Please enter the verification code.");
            return;
        }

        try {
            const { response, data } = await postJson("/home/auth/password/forgot/verify-code", {
                email: currentResetEmail,
                code
            });

            if (!response.ok) {
                showForgotFeedback(data.message || "Invalid verification code.");
                return;
            }

            setForgotStep("reset");
            showForgotFeedback(data.message || "Code verified.", false);
        } catch (error) {
            console.log(error.message);
            showForgotFeedback("Verification failed. Please try again.");
        }
    });

    forgotResetPasswordBtn.addEventListener("click", async() => {
        clearForgotFeedback();

        const newPassword = forgotNewPasswordInput.value.trim();
        const confirmPassword = forgotConfirmPasswordInput.value.trim();

        if (!currentResetEmail) {
            setForgotStep("email");
            showForgotFeedback("Session expired. Start again with your email.");
            return;
        }

        if (!newPassword || !confirmPassword) {
            showForgotFeedback("Please enter and confirm the new password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            showForgotFeedback("New password and confirmation do not match.");
            return;
        }

        try {
            const { response, data } = await postJson("/home/auth/password/forgot/reset", {
                email: currentResetEmail,
                newPassword,
                confirmPassword
            });

            if (!response.ok) {
                showForgotFeedback(data.message || "Could not update password.");
                return;
            }

            showForgotFeedback(data.message || "Password changed successfully.", false);
            loginEmail.value = currentResetEmail;
            loginPassword.value = "";

            window.setTimeout(() => {
                hideForgot();
            }, 1000);
        } catch (error) {
            console.log(error.message);
            showForgotFeedback("Could not update password. Please try again.");
        }
    });

    [loginEmail, loginPassword, signupName, signupUsername, signupEmail, signupPassword, signupConfirmPassword].forEach((input) => {
        if (input) {
            input.addEventListener("input", clearAllErrors);
        }
    });

    [forgotEmailInput, forgotCodeInput, forgotNewPasswordInput, forgotConfirmPasswordInput].forEach((input) => {
        input.addEventListener("input", clearForgotFeedback);
    });
});