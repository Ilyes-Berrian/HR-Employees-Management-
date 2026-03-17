/**
 * HRM Dashboard - Client-side behavior
 * Handles dark mode toggle (with localStorage persistence) and sidebar collapse on mobile.
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM references
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

    /**
     * Apply theme: adds/removes .dark-mode on body and syncs checkbox state.
     * @param {string} theme - "dark" or "light"
     */
    const applyTheme = (theme) => {
        const isDark = theme === "dark";
        body.classList.toggle("dark-mode", isDark);
        darkToggle.checked = isDark;
    };

    // Restore saved theme, or use system preference
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
        applyTheme(storedTheme);
    } else {
        const prefersDark =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark ? "dark" : "light");
    }

    // Listen for dark mode toggle changes and persist
    darkToggle.addEventListener("change", () => {
        const theme = darkToggle.checked ? "dark" : "light";
        applyTheme(theme);
        window.localStorage.setItem(THEME_KEY, theme);
    });

    // Sidebar: toggle icon-only mode (keep icons visible, hide labels)
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            wrapper.classList.toggle("sidebar-icon-only");
        });
    }

    // Sidebar navigation: set active item + update main content
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

            switch (page) {
                case "Dashboard":
                    pageDescription.textContent =
                        "Overview of key HR metrics and shortcuts.";
                    break;
                case "Database":
                    pageDescription.textContent =
                        "Browse employees, departments, and records stored in your database.";
                    break;
                case "Add":
                    pageDescription.textContent =
                        "Create a new employee, department, or HR request.";
                    break;
                case "Attestations":
                    pageDescription.textContent =
                        "Generate and manage HR attestations and documents.";
                    break;
                case "Settings":
                    pageDescription.textContent =
                        "Configure roles, permissions, and system preferences.";
                    break;
                case "Profile":
                    pageDescription.textContent =
                        "View and edit your profile information.";
                    break;
                case "Logout":
                    pageDescription.textContent = "Logging out...";
                    break;
                default:
                    pageDescription.textContent = "Section selected.";
            }
        });
    }
});