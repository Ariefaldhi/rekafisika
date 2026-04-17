(function() {
    const sessionStr = localStorage.getItem('user_session');
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const normalizedPage = page.split('?')[0];
    
    // Whitelist for pages that don't need auth
    const isLoginPage = normalizedPage === 'login.html';

    if (!sessionStr) {
        if (!isLoginPage) {
            window.location.href = 'login.html' + (normalizedPage !== 'index.html' ? '?redirect=' + normalizedPage : '');
        }
        return;
    }

    const user = JSON.parse(sessionStr);

    // --- SECURITY: Role Based Access Control (RBAC) ---
    // Strict block for Admin Panel
    if (normalizedPage === 'admin.html' && user.role !== 'admin') {
        console.warn("Unauthorized access to Admin Panel blocked.");
        window.location.href = 'index.html';
        return;
    }

    // Strict block for Teacher Dashboard
    if (normalizedPage === 'hasil_ajar.html' && user.role !== 'teacher' && user.role !== 'admin') {
        console.warn("Unauthorized access to Teacher Dashboard blocked.");
        window.location.href = 'index.html';
        return;
    }

    // Guest Restriction (Teaching Code users)
    if (user.is_guest) {
        const guestAllowed = ['index.html', 'modul.html', 'detail_modul.html', 'login.html'];
        if (!guestAllowed.includes(normalizedPage)) {
            window.location.href = 'index.html';
            return;
        }

        // Global UI Hider for Guests
        document.addEventListener('DOMContentLoaded', () => {
            const restrictedPaths = ['lainnya.html', 'profil.html', 'keaktifan.html', 'admin.html', 'hasil_ajar.html', 'bank_soal.html'];
            document.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href');
                if (href && restrictedPaths.some(p => href.includes(p))) {
                    link.classList.add('hidden');
                }
            });
            ['resume-learning-container', 'announcement-section'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });
        });
    }

    // --- BACKGROUND SYNC: Dynamic Role Refresh ---
    // If Admin changes a user role in DB, this syncs the localStorage session without logout
    if (!user.is_guest && !isLoginPage) {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for Supabase to be ready from config.js
            setTimeout(async () => {
                if (window.supabaseClient && (user.nim || user.email)) {
                    try {
                        const identifier = user.nim || user.email;
                        const { data, error } = await supabaseClient
                            .from('profiles')
                            .select('role, nama')
                            .eq('nim', identifier)
                            .maybeSingle();
                        
                        if (data && data.role !== user.role) {
                            console.log(`[AuthGuard] Role update detected: ${user.role} -> ${data.role}`);
                            user.role = data.role;
                            user.nama = data.nama;
                            localStorage.setItem('user_session', JSON.stringify(user));
                            
                            // If user is on a page where role changes UI (like lainnya.html), force refresh
                            if (normalizedPage === 'lainnya.html' || normalizedPage === 'index.html') {
                                window.location.reload();
                            }
                        }
                    } catch (e) {
                        // Silent fail for sync
                    }
                }
            }, 500); // 0.5s delay to ensure config.js/Supabase initialized
        });
    }
})();
