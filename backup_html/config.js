// Konfigurasi Aplikasi (SIMPLIFIED - No VisualModal)
const SUPABASE_URL = 'https://dwtzkrfdchatqubrgmvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHprcmZkY2hhdHF1YnJnbXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzkyOTEsImV4cCI6MjA5MTk1NTI5MX0.6GujiUhYJkg4vGL0SGqe1816dSmH2lV-7lW3B5ahiM4';
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';

// Initialize Supabase Client immediately
var supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
window.supabaseClient = supabaseClient;


// Simple ensureSupabase for compatibility
window.ensureSupabase = async function () {
    if (window.supabaseClient) return window.supabaseClient;

    // If SDK wasn't ready, try again
    if (typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return window.supabaseClient;
    }

    console.error('Supabase SDK not loaded');
    return null;
};

// Auth check function
function checkAuth() {
    try {
        const session = localStorage.getItem('user_session');
        if (!session) return null;
        return JSON.parse(session);
    } catch (e) {
        localStorage.removeItem('user_session');
        return null;
    }
}

// Simple VisualModal fallback (just uses native alerts)
window.VisualModal = {
    alert: function (message, title) {
        alert(title + '\n\n' + message);
        return Promise.resolve(true);
    },
    confirm: function (message, title) {
        return Promise.resolve(confirm(title + '\n\n' + message));
    }
};
