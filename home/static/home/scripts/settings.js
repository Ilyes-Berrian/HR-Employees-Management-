/**
 * HRM Settings - Tab switching, profile upload, and password interactions.
 * Exposes window.showSettingsLayout so dashboard.js can toggle the settings layout
 * when the user clicks the Settings nav item.
 */

document.addEventListener("DOMContentLoaded", () => {
    const settingsTabs = document.querySelectorAll(".settings-tab");
    const settingsPanels = document.querySelectorAll(".settings-panel");

    const profileAvatar = document.getElementById("profileAvatar");
    const profileImage = document.getElementById("profileImage");
    const profileImageDelete = document.getElementById("profileImageDelete");
    const removeProfileImageFlag = document.getElementById("removeProfileImage");
    const profileFileName = document.getElementById("profileFileName");
    const personalForm = document.getElementById("personalSettingsForm");
    const fullNameInput = document.getElementById("fullName");
    const usernameInput = document.getElementById("username");
    const bioInput = document.getElementById("bio");
    const profileSaveStatus = document.getElementById("profileSaveStatus");
    const securityForm = document.getElementById("securitySettingsForm");
    const passwordSaveStatus = document.getElementById("passwordSaveStatus");

    const passwordToggles = document.querySelectorAll(".password-toggle");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const strengthFill = document.getElementById("strengthFill");
    const strengthValue = document.getElementById("strengthValue");
    const passwordMatchFeedback = document.getElementById("passwordMatchFeedback");

    const defaultContent = document.getElementById("defaultContent");
    const settingsLayout = document.getElementById("settingsLayout");
    let previewUrl = "";
    let hasServerProfileImage = false;

    // ------------------------------------------------------------------
    // Layout toggle — called by dashboard.js when the nav item is clicked
    // ------------------------------------------------------------------

    const showSettingsLayout = (isSettingsPage) => {
        if (!defaultContent || !settingsLayout) return;
        defaultContent.classList.toggle("hidden", isSettingsPage);
        settingsLayout.classList.toggle("hidden", !isSettingsPage);
    };

    window.showSettingsLayout = showSettingsLayout;

    // ------------------------------------------------------------------
    // Tab switching
    // ------------------------------------------------------------------

    const switchSettingsTab = (tabName) => {
        settingsTabs.forEach((tabBtn) => {
            tabBtn.classList.toggle("active", tabBtn.dataset.settingsTab === tabName);
        });
        settingsPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.settingsPanel === tabName);
        });
    };

    settingsTabs.forEach((tabBtn) => {
        tabBtn.addEventListener("click", () => {
            const tabName = tabBtn.dataset.settingsTab;
            if (tabName) switchSettingsTab(tabName);
        });
    });

    // ------------------------------------------------------------------
    // Profile picture upload — show selected filename
    // ------------------------------------------------------------------

    const setAvatarPreview = (imageUrl) => {
        if (!profileAvatar) return;

        if (!imageUrl) {
            profileAvatar.style.backgroundImage = "";
            profileAvatar.style.backgroundSize = "";
            profileAvatar.style.backgroundPosition = "";
            profileAvatar.style.backgroundRepeat = "";
            profileAvatar.textContent = "HR";
            return;
        }

        profileAvatar.style.backgroundImage = `url(${imageUrl})`;
        profileAvatar.style.backgroundSize = "cover";
        profileAvatar.style.backgroundPosition = "center";
        profileAvatar.style.backgroundRepeat = "no-repeat";
        profileAvatar.textContent = "";
    };

    const setDeleteImageVisibility = (isVisible) => {
        if (!profileImageDelete) return;
        profileImageDelete.classList.toggle("hidden", !isVisible);
    };

    const setProfileStatus = (message, type = "") => {
        if (!profileSaveStatus) return;
        profileSaveStatus.textContent = message;
        profileSaveStatus.classList.remove("success", "error");
        if (type) profileSaveStatus.classList.add(type);
    };

    const setPasswordStatus = (message, type = "") => {
        if (!passwordSaveStatus) return;
        passwordSaveStatus.textContent = message;
        passwordSaveStatus.classList.remove("success", "error");
        if (type) passwordSaveStatus.classList.add(type);
    };

    const loadProfile = async() => {
        if (!fullNameInput || !usernameInput || !bioInput) return;

        try {
            const response = await fetch("/home/auth/profile", {
                method: "GET",
                headers: { "X-Requested-With": "XMLHttpRequest" },
                credentials: "same-origin",
            });

            const data = await response.json();
            if (!response.ok || !data.ok || !data.profile) {
                return;
            }

            const { fullName, username, bio, profileImageUrl } = data.profile;
            fullNameInput.value = fullName || "";
            usernameInput.value = username || "";
            bioInput.value = bio || "";
            setAvatarPreview(profileImageUrl || "");
            hasServerProfileImage = Boolean(profileImageUrl);
            if (removeProfileImageFlag) {
                removeProfileImageFlag.value = "0";
            }
            setDeleteImageVisibility(hasServerProfileImage);

            if (profileFileName) {
                profileFileName.classList.remove("hidden");
                profileFileName.textContent = profileImageUrl ? "Current image loaded" : "No file selected";
            }
        } catch (_err) {
            // Keep default blank form when profile fetch fails.
        }
    };

    if (profileImage && profileFileName && profileAvatar) {
        profileImage.addEventListener("change", () => {
            const file = profileImage.files && profileImage.files[0];
            if (removeProfileImageFlag) {
                removeProfileImageFlag.value = "0";
            }
            if (file) {
                profileFileName.classList.add("hidden");
            } else {
                profileFileName.classList.remove("hidden");
                profileFileName.textContent = "No file selected";
                setDeleteImageVisibility(hasServerProfileImage);
            }
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                previewUrl = "";
            }

            if (!file) {
                setAvatarPreview("");
                return;
            }

            if (!file.type.startsWith("image/")) {
                profileFileName.textContent = "Please choose an image file";
                profileImage.value = "";
                profileFileName.classList.remove("hidden");
                setAvatarPreview("");
                return;
            }

            previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setDeleteImageVisibility(true);
        });
    }

    if (profileImageDelete) {
        profileImageDelete.addEventListener("click", () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                previewUrl = "";
            }

            if (profileImage) {
                profileImage.value = "";
            }

            hasServerProfileImage = false;
            setAvatarPreview("");
            setDeleteImageVisibility(false);

            if (removeProfileImageFlag) {
                removeProfileImageFlag.value = "1";
            }

            if (profileFileName) {
                profileFileName.classList.remove("hidden");
                profileFileName.textContent = "Image will be removed when you save changes";
            }
        });
    }

    if (personalForm) {
        personalForm.addEventListener("submit", async(event) => {
            event.preventDefault();

            const formData = new FormData(personalForm);
            const submitButton = personalForm.querySelector("button[type='submit']");
            if (submitButton) submitButton.disabled = true;
            setProfileStatus("Saving profile...", "");

            try {
                const response = await fetch("/home/auth/profile/update", {
                    method: "POST",
                    body: formData,
                    credentials: "same-origin",
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });

                const data = await response.json();
                if (!response.ok || !data.ok) {
                    setProfileStatus(data.message || "Could not save profile.", "error");
                    return;
                }

                if (data.profile) {
                    fullNameInput.value = data.profile.fullName || "";
                    usernameInput.value = data.profile.username || "";
                    bioInput.value = data.profile.bio || "";
                    setAvatarPreview(data.profile.profileImageUrl || "");
                    hasServerProfileImage = Boolean(data.profile.profileImageUrl);
                    if (removeProfileImageFlag) {
                        removeProfileImageFlag.value = "0";
                    }
                    setDeleteImageVisibility(hasServerProfileImage);

                    window.dispatchEvent(new CustomEvent("profile:updated", {
                        detail: { profile: data.profile }
                    }));

                    if (profileFileName) {
                        profileFileName.classList.remove("hidden");
                        profileFileName.textContent = data.profile.profileImageUrl ? "Profile image saved" : "No file selected";
                    }
                    if (profileImage) {
                        profileImage.value = "";
                    }
                    if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        previewUrl = "";
                    }
                }

                setProfileStatus(data.message || "Profile updated successfully.", "success");
            } catch (_err) {
                setProfileStatus("Network error while saving profile.", "error");
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    if (securityForm) {
        securityForm.addEventListener("submit", async(event) => {
            event.preventDefault();

            const formData = new FormData(securityForm);
            const submitButton = securityForm.querySelector("button[type='submit']");
            if (submitButton) submitButton.disabled = true;
            setPasswordStatus("Updating password...", "");

            try {
                const response = await fetch("/home/auth/password/update", {
                    method: "POST",
                    body: formData,
                    credentials: "same-origin",
                    headers: { "X-Requested-With": "XMLHttpRequest" },
                });

                const data = await response.json();
                if (!response.ok || !data.ok) {
                    setPasswordStatus(data.message || "Could not update password.", "error");
                    return;
                }

                securityForm.reset();
                paintPasswordStrength();
                validatePasswordMatch();
                setPasswordStatus(data.message || "Password updated successfully.", "success");
            } catch (_err) {
                setPasswordStatus("Network error while updating password.", "error");
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    // ------------------------------------------------------------------
    // Password strength meter
    // ------------------------------------------------------------------

    const evaluatePasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score += 25;
        if (/[A-Z]/.test(password)) score += 25;
        if (/[0-9]/.test(password)) score += 25;
        if (/[^A-Za-z0-9]/.test(password)) score += 25;
        return score;
    };

    const paintPasswordStrength = () => {
        if (!newPasswordInput || !strengthFill || !strengthValue) return;

        const score = evaluatePasswordStrength(newPasswordInput.value);
        let label = "Weak";
        let color = "#f08f2d";

        if (score >= 75) {
            label = "Strong";
            color = "#3f7aff";
        } else if (score >= 50) {
            label = "Medium";
            color = "#e4b52b";
        }

        strengthFill.style.width = `${score}%`;
        strengthFill.style.backgroundColor = color;
        strengthValue.textContent = label;

        const meter = strengthFill.closest(".strength-meter");
        if (meter) meter.setAttribute("aria-valuenow", String(score));
    };

    // ------------------------------------------------------------------
    // Password match validation
    // ------------------------------------------------------------------

    const validatePasswordMatch = () => {
        if (!newPasswordInput || !confirmPasswordInput || !passwordMatchFeedback) return;

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

    // ------------------------------------------------------------------
    // Show/hide password toggle
    // ------------------------------------------------------------------

    passwordToggles.forEach((toggleBtn) => {
        toggleBtn.addEventListener("click", () => {
            const inputId = toggleBtn.dataset.togglePassword;
            if (!inputId) return;

            const input = document.getElementById(inputId);
            if (!input) return;

            const isMasked = input.type === "password";
            input.type = isMasked ? "text" : "password";

            const icon = toggleBtn.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-eye", !isMasked);
                icon.classList.toggle("fa-eye-slash", isMasked);
            }
        });
    });

    // ------------------------------------------------------------------
    // Initial state
    // ------------------------------------------------------------------

    paintPasswordStrength();
    validatePasswordMatch();
    switchSettingsTab("personal");
    loadProfile();
    showSettingsLayout(false);
});