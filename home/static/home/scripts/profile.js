/**
 * HRM Profile - Loads and renders the logged-in user's profile data.
 * Exposes window.showProfileLayout so land_page.js can toggle the profile
 * layout when the user clicks the Profile nav item.
 */

document.addEventListener("DOMContentLoaded", () => {
    const profileLayout = document.getElementById("profileLayout");
    const profilePageAvatar = document.getElementById("profilePageAvatar");
    const profilePageFullName = document.getElementById("profilePageFullName");
    const profilePageBio = document.getElementById("profilePageBio");
    const profilePageBadge = document.getElementById("profilePageBadge");
    const profilePageUsername = document.getElementById("profilePageUsername");
    const profilePageEmail = document.getElementById("profilePageEmail");
    const profilePageStatusText = document.getElementById("profilePageStatusText");
    const profileEditBtn = document.getElementById("profileEditBtn");
    const defaultContent = document.getElementById("defaultContent");

    // ------------------------------------------------------------------
    // Layout toggle — called by land_page.js when the nav item is clicked
    // ------------------------------------------------------------------

    const showProfileLayout = (isProfilePage) => {
        if (!profileLayout) return;
        profileLayout.classList.toggle("hidden", !isProfilePage);

        // Profile page has its own full layout — hide the default content area
        if (defaultContent && isProfilePage) {
            defaultContent.classList.add("hidden");
        }

        if (isProfilePage) loadProfilePage();
    };

    window.showProfileLayout = showProfileLayout;

    // ------------------------------------------------------------------
    // Avatar helper
    // ------------------------------------------------------------------

    const setAvatar = (imageUrl, fallbackText = "HR") => {
        if (!profilePageAvatar) return;

        if (imageUrl) {
            profilePageAvatar.style.backgroundImage = `url(${imageUrl})`;
            profilePageAvatar.style.backgroundSize = "cover";
            profilePageAvatar.style.backgroundPosition = "center";
            profilePageAvatar.style.backgroundRepeat = "no-repeat";
            profilePageAvatar.textContent = "";
        } else {
            profilePageAvatar.style.backgroundImage = "";
            profilePageAvatar.style.backgroundSize = "";
            profilePageAvatar.style.backgroundPosition = "";
            profilePageAvatar.style.backgroundRepeat = "";
            profilePageAvatar.textContent = fallbackText;
        }
    };

    const getInitials = (fullName, username) => {
        const source = (fullName || username || "HR").trim();
        if (!source) return "HR";

        const parts = source.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    };

    const setProfileFallback = (message = "Could not load profile data.") => {
        if (profilePageFullName) profilePageFullName.textContent = "PROFILE";
        if (profilePageBio) profilePageBio.textContent = message;
        if (profilePageUsername) profilePageUsername.textContent = "—";
        if (profilePageEmail) profilePageEmail.textContent = "—";
        if (profilePageStatusText) profilePageStatusText.textContent = "Unknown";
        if (profilePageBadge) {
            profilePageBadge.innerHTML = '<i class="fas fa-circle"></i> Unknown';
            profilePageBadge.classList.add("inactive");
        }
        setAvatar("", "HR");
    };

    const renderProfile = (profileData) => {
        if (!profileData) return;

        const {
            fullName,
            username,
            bio,
            profileImageUrl,
            email,
            isActive,
        } = profileData;

        const initials = getInitials(fullName, username);

        if (profilePageFullName) {
            profilePageFullName.textContent = (fullName || username || "—").toUpperCase();
        }

        if (profilePageBio) {
            profilePageBio.textContent = bio || "No bio added yet.";
        }

        if (profilePageUsername) {
            profilePageUsername.textContent = username || "—";
        }

        if (profilePageEmail) {
            profilePageEmail.textContent = email || "—";
        }

        const active = isActive !== false;
        const statusLabel = active ? "Active" : "Inactive";

        if (profilePageBadge) {
            profilePageBadge.innerHTML = `<i class="fas fa-circle"></i> ${statusLabel}`;
            profilePageBadge.classList.toggle("inactive", !active);
        }

        if (profilePageStatusText) {
            profilePageStatusText.textContent = statusLabel;
        }

        setAvatar(profileImageUrl || "", initials);
    };

    // ------------------------------------------------------------------
    // Fetch and render profile data
    // ------------------------------------------------------------------

    const loadProfilePage = async() => {
        try {
            const response = await fetch("/home/auth/profile", {
                method: "GET",
                headers: { "X-Requested-With": "XMLHttpRequest" },
                credentials: "same-origin",
            });

            let data = {};
            try {
                data = await response.json();
            } catch (_jsonError) {
                setProfileFallback();
                return;
            }

            if (!response.ok || !data.ok || !data.profile) {
                setProfileFallback(data.message || "Could not load profile data.");
                return;
            }

            renderProfile(data.profile);
        } catch (_err) {
            setProfileFallback();
        }
    };

    window.addEventListener("profile:updated", (event) => {
        const profileData = event.detail && event.detail.profile;
        if (!profileData) return;
        renderProfile(profileData);
    });

    // ------------------------------------------------------------------
    // Edit button — navigate to the Settings tab
    // ------------------------------------------------------------------

    if (profileEditBtn) {
        profileEditBtn.addEventListener("click", () => {
            const settingsNavBtn = document.querySelector("button.nav-item[data-page='Settings']");
            if (settingsNavBtn) settingsNavBtn.click();
        });
    }

    // ------------------------------------------------------------------
    // Initial state — hidden until user navigates to Profile
    // ------------------------------------------------------------------

    showProfileLayout(false);
});