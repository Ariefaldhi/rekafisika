const fs = require('fs');
const path = require('path');

// Simple .env parser
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim();
        }
    });
}

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_PLACEHOLDER';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY_PLACEHOLDER';
const groqApiKey = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_PLACEHOLDER';

const configContent = `// Konfigurasi Aplikasi (SIMPLIFIED - No VisualModal)
const SUPABASE_URL = '${supabaseUrl}';
const SUPABASE_ANON_KEY = '${supabaseKey}';
const GROQ_API_KEY = '${groqApiKey}';

// Initialize Supabase Client immediately
let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
}

// Simple ensureSupabase for compatibility
window.ensureSupabase = async function() {
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
    alert: function(message, title) {
        alert(title + '\\n\\n' + message);
        return Promise.resolve(true);
    },
    confirm: function(message, title) {
        return Promise.resolve(confirm(title + '\\n\\n' + message));
    }
};
`;

fs.writeFileSync('config.js', configContent);
console.log('✅ config.js generated successfully (SIMPLIFIED VERSION).');
