// Konfigurasi Supabase
// Salin file ini menjadi 'config.js' dan isi dengan kunci asli Anda.

const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
const GROQ_API_KEY = 'your-groq-api-key-here';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi Utility Global (sama seperti config.js asli, tapi tanpa logic auth rahasia jika ada)
// ...

function checkAuth() {
    const session = localStorage.getItem('user_session');
    if (!session) return null;
    return JSON.parse(session);
}

// Event Dispatcher untuk menandakan Supabase siap (opsional jika dibutuhkan logic lain)
window.isSupabaseReady = true;
document.dispatchEvent(new Event('supabaseReady'));
