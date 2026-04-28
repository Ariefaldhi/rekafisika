const fs = require('fs');
const configPath = './build-config.js'; // I'll extract from here or just use supabase.js manually if it's node.

// Wait, I can't run supabase-js easily in scratch without npm install.
// I will just use fetch to hit Supabase REST API directly!

const path = require('path');
const envPath = path.join(__dirname, '../.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            if (key.trim() === 'SUPABASE_URL') supabaseUrl = values.join('=').trim();
            if (key.trim() === 'SUPABASE_ANON_KEY' || key.trim() === 'SUPABASE_KEY') supabaseKey = values.join('=').trim();
        }
    });
}
console.log(supabaseUrl, supabaseKey.substring(0, 5));

fetch(`${supabaseUrl}/rest/v1/sesi_kelas?select=*&limit=1`, {
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    }
}).then(res => res.json()).then(data => {
    console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
