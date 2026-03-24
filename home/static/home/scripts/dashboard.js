/**
 * HRM Dashboard - Client-side behavior
 * Handles dark mode, sidebar states, settings tabs, and lightweight settings interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
    const body = document.querySelector(".dashboard-body");
    const darkToggle = document.getElementById("darkModeToggle");
    const wrapper = document.querySelector(".dashboard-wrapper");
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");

    const pageTitle = document.getElementById("pageTitle");
    const pageDescription = document.getElementById("pageDescription");
    const defaultContent = document.getElementById("defaultContent");
    const settingsLayout = document.getElementById("settingsLayout");

    const settingsTabs = document.querySelectorAll(".settings-tab");
    const settingsPanels = document.querySelectorAll(".settings-panel");

    const profileImage = document.getElementById("profileImage");
    const profileFileName = document.getElementById("profileFileName");

    const passwordToggles = document.querySelectorAll(".password-toggle");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const strengthFill = document.getElementById("strengthFill");
    const strengthValue = document.getElementById("strengthValue");
    const passwordMatchFeedback = document.getElementById("passwordMatchFeedback");

    if (!body || !darkToggle || !wrapper) {
        return;
    }

    const THEME_KEY = "hrm-theme";

    const applyTheme = (theme) => {
        const isDark = theme === "dark";
        body.classList.toggle("dark-mode", isDark);
        darkToggle.checked = isDark;
    };

    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
        applyTheme(storedTheme);
    } else {
        const prefersDark =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark ? "dark" : "light");
    }

    darkToggle.addEventListener("change", () => {
        const theme = darkToggle.checked ? "dark" : "light";
        applyTheme(theme);
        window.localStorage.setItem(THEME_KEY, theme);
    });

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            wrapper.classList.toggle("sidebar-icon-only");
        });
    }

    const showSettingsLayout = (isSettingsPage) => {
        if (!defaultContent || !settingsLayout) {
            return;
        }

        defaultContent.classList.toggle("hidden", isSettingsPage);
        settingsLayout.classList.toggle("hidden", !isSettingsPage);
    };

    const copyPageDescription = (page) => {
        switch (page) {
            case "Dashboard":
                return "Overview of key HR metrics and shortcuts.";
            case "Database":
                return "Browse employees, departments, and records stored in your database.";
            case "Add":
                return "Create a new employee, department, or HR request.";
            case "Attestations":
                return "Generate and manage HR attestations and documents.";
            case "Settings":
                return "Manage profile details and account security settings.";
            case "Profile":
                return "View and edit your profile information.";
            default:
                return "Section selected.";
        }
    };

    const switchSettingsTab = (tabName) => {
        settingsTabs.forEach((tabBtn) => {
            tabBtn.classList.toggle("active", tabBtn.dataset.settingsTab === tabName);
        });

        settingsPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.settingsPanel === tabName);
        });
    };

    if (settingsTabs.length) {
        settingsTabs.forEach((tabBtn) => {
            tabBtn.addEventListener("click", () => {
                const tabName = tabBtn.dataset.settingsTab;
                if (!tabName) {
                    return;
                }
                switchSettingsTab(tabName);
            });
        });
    }

    if (sidebar && pageTitle && pageDescription) {
        sidebar.addEventListener("click", (event) => {
            const btn = event.target.closest("button.nav-item");
            if (!btn) return;

            const page = btn.dataset.page;
            if (!page) return;

            const allNavButtons = sidebar.querySelectorAll("button.nav-item");
            allNavButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            pageTitle.textContent = page;
            pageDescription.textContent = copyPageDescription(page);

            showSettingsLayout(page === "Settings");

            if (page === "Logout") {
                pageDescription.textContent = "Logging out...";
                window.location.href = "/home/auth/logout";
            }
        });
    }

    if (profileImage && profileFileName) {
        profileImage.addEventListener("change", () => {
            const selectedFile = profileImage.files && profileImage.files[0];
            profileFileName.textContent = selectedFile ? selectedFile.name : "No file selected";
        });
    }

    const evaluatePasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score += 25;
        if (/[A-Z]/.test(password)) score += 25;
        if (/[0-9]/.test(password)) score += 25;
        if (/[^A-Za-z0-9]/.test(password)) score += 25;
        return score;
    };

    const paintPasswordStrength = () => {
        if (!newPasswordInput || !strengthFill || !strengthValue) {
            return;
        }

        const score = evaluatePasswordStrength(newPasswordInput.value);
        let label = "Weak";
        let color = "#f08f2d";

        if (score >= 75) {
            label = "Strong";
            color = "#12755a";
        } else if (score >= 50) {
            label = "Medium";
            color = "#e4b52b";
        }

        strengthFill.style.width = `${score}%`;
        strengthFill.style.backgroundColor = color;
        strengthValue.textContent = label;

        const meter = strengthFill.closest(".strength-meter");
        if (meter) {
            meter.setAttribute("aria-valuenow", String(score));
        }
    };

    const validatePasswordMatch = () => {
        if (!newPasswordInput || !confirmPasswordInput || !passwordMatchFeedback) {
            return;
        }

        const newValue = newPasswordInput.value;
        const confirmValue = confirmPasswordInput.value;

        passwordMatchFeedback.classList.remove("valid", "invalid");

        if (!confirmValue) {
            passwordMatchFeedback.textContent = "";
            return;
        }

        if (newValue === confirmValue) {
            passwordMatchFeedback.textContent = "Passwords match.";
            passwordMatchFeedback.classList.add("valid");
        } else {
            passwordMatchFeedback.textContent = "Passwords do not match.";
            passwordMatchFeedback.classList.add("invalid");
        }
    };

    if (newPasswordInput) {
        newPasswordInput.addEventListener("input", () => {
            paintPasswordStrength();
            validatePasswordMatch();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", validatePasswordMatch);
    }

    if (passwordToggles.length) {
        passwordToggles.forEach((toggleBtn) => {
            toggleBtn.addEventListener("click", () => {
                const inputId = toggleBtn.dataset.togglePassword;
                if (!inputId) {
                    return;
                }

                const input = document.getElementById(inputId);
                if (!input) {
                    return;
                }

                const isMasked = input.type === "password";
                input.type = isMasked ? "text" : "password";

                const icon = toggleBtn.querySelector("i");
                if (icon) {
                    icon.classList.toggle("fa-eye", !isMasked);
                    icon.classList.toggle("fa-eye-slash", isMasked);
                }
            });
        });
    }

    paintPasswordStrength();
    validatePasswordMatch();
    switchSettingsTab("personal");
    showSettingsLayout(false);
});