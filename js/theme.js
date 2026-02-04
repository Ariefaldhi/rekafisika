// Theme Management
const themeToggleBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-desktop');
const themeIcons = document.querySelectorAll('#theme-icon, #theme-icon-desktop');

// Check Initial Theme
function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        updateIcons(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateIcons(false);
    }
}

// Toggle Theme
function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        updateIcons(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        updateIcons(true);
    }
}

// Update Icons
function updateIcons(isDark) {
    themeIcons.forEach(icon => {
        if (isDark) {
            icon.className = 'fa-solid fa-moon text-yellow-300';
        } else {
            icon.className = 'fa-solid fa-sun text-orange-500';
        }
    });
}

// Event Listeners
themeToggleBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', toggleTheme);
});

// Init on load
initTheme();
