// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
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
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const signupConfirmPassword = document.getElementById("signupConfirmPassword");

    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const btnLogin = document.getElementById("btnLogin");
    const btnSignup = document.getElementById("btnSignup");

    if (!loginForm || !signupForm || !loginTab || !signupTab || !btnLogin || !btnSignup) {
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

    // Login form using Firebase Authentication.
    btnLogin.addEventListener("click", async() => {

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            showError(loginAuthError, "Please enter both email and password.");
            return;
        }

        try {
            const userCridential = await signInWithEmailAndPassword(auth, email, password);
            console.log(userCridential.user.email);
            alert("Login successful!");
        } catch (error) {
            console.log(error.message);
            if (error.code === "auth/invalid-credential") {
                showError(loginAuthError, "Invalid email or password. Please try again.");
            } else {
                showError(loginAuthError, error.message || "Login failed.");
            }
        }
    });

    // Sign up form using Firebase Authentication.
    btnSignup.addEventListener("click", async() => {

        clearSignupErrors();
        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value.trim();
        const confirmPassword = signupConfirmPassword.value.trim();

        if (!name || !email || !password || !confirmPassword) {
            showError(signupAuthError, "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            showError(signupConfirmError, "Passwords do not match.");
            return;
        }

        try {
            const userCridential = await createUserWithEmailAndPassword(auth, email, password);
            console.log(userCridential.user.email);
            alert("Account created successfully!");
            showLogin();
        } catch (error) {
            console.log(error.message);
            if (error.code === "auth/email-already-in-use") {
                showError(signupAuthError, "This email is already registered. Please login or use a different email.");
            } else if (error.code === "auth/weak-password") {
                showError(signupAuthError, "Password is too weak. Please use at least 6 characters.");
            } else if (error.code === "auth/invalid-email") {
                showError(signupAuthError, "Invalid email address. Please check and try again.");
            } else {
                showError(signupAuthError, error.message || "Sign up failed.");
            }
        }
    });

});