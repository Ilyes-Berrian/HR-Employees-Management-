/**
 * HRM Dashboard - Core client-side behavior.
 * Handles dark mode toggle (with localStorage persistence) and sidebar collapse.
 * Settings-specific interactions live in settings.js.
 */

document.addEventListener("DOMContentLoaded", () => {
    const body = document.querySelector(".dashboard-body");
    const darkToggle = document.getElementById("darkModeToggle");
    const wrapper = document.querySelector(".dashboard-wrapper");
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");

    const pageTitle = document.getElementById("pageTitle");
    const pageDescription = document.getElementById("pageDescription");

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

    if (sidebar && pageTitle && pageDescription) {
        sidebar.addEventListener("click", (event) => {
            const btn = event.target.closest("button.nav-item");
            if (!btn) return;

            const page = btn.dataset.page;
            if (!page) return;

            sidebar.querySelectorAll("button.nav-item").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            pageTitle.textContent = page;
            pageDescription.textContent = copyPageDescription(page);

            if (typeof window.showSettingsLayout === "function") {
                window.showSettingsLayout(page === "Settings");
            }

            if (typeof window.showProfileLayout === "function") {
                window.showProfileLayout(page === "Profile");
            }

            if (page === "Logout") {
                pageDescription.textContent = "Logging out...";
                window.location.href = "/home/auth/logout";
            }
        });
    }
});