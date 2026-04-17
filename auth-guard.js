(function() {
    const session = localStorage.getItem('user_session');
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    
    // Whitelist for pages that don't need auth (none for now besides login)
    const isLoginPage = page === 'login.html';
    const isAuthIgnored = isLoginPage;

    if (!session) {
        if (!isAuthIgnored) {
            window.location.href = 'login.html' + (page !== 'index.html' ? '?redirect=' + page : '');
        }
    } else {
        const user = JSON.parse(session);
        // Guest Restriction
        if (user.is_guest) {
            const guestAllowed = ['index.html', 'modul.html', 'detail_modul.html', 'login.html'];
            const normalizedPage = page.split('?')[0];
            if (!guestAllowed.includes(normalizedPage)) {
                window.location.href = 'index.html';
            }

            // Global UI Hider for Guests
            document.addEventListener('DOMContentLoaded', () => {
                // Hide links to restricted pages
                const restrictedPaths = ['lainnya.html', 'profil.html', 'keaktifan.html', 'admin.html', 'hasil_ajar.html', 'bank_soal.html'];
                document.querySelectorAll('a').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && restrictedPaths.some(p => href.includes(p))) {
                        link.classList.add('hidden');
                    }
                });
                
                // Hide specific containers
                ['resume-learning-container', 'announcement-section'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('hidden');
                });
            });
        }
    }
})();
