-- RekaFisika Supabase Schema Full Setup
-- Salin dan jalankan seluruh kode ini di dalam menu SQL Editor Supabase Anda.

-- ==========================================
-- 1. Tabel Utama
-- ==========================================

-- Tabel Students (Tetap dipertahankan untuk kompatibilitas dan fitur admin manual)
CREATE TABLE IF NOT EXISTS public.students (
    nim TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    access_code TEXT,
    profile_photo_url TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Tabel Profil (Opsional, untuk menangkap data dari Supabase Auth secara otomatis)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    nim TEXT UNIQUE,
    role TEXT DEFAULT 'student',
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);


-- Tabel Modul Pembelajaran
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week INTEGER NOT NULL DEFAULT 1,
    topic TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    video_url TEXT,
    lkpd_url TEXT,
    lkpd_title TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    is_locked BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Tabel Kemajuan Modul Peserta
CREATE TABLE IF NOT EXISTS public.module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    student_nim TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_steps JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(student_nim, module_id)
);

-- Tabel Penugasan (Tugas)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    submission_link TEXT,
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Tabel Pengumpulan Tugas Peserta
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_nim TEXT NOT NULL,
    content JSONB,
    file_url TEXT,
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(student_nim, assignment_id)
);

-- Tabel Log Partisipasi / Keaktifan Kelas
CREATE TABLE IF NOT EXISTS public.participation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_nim TEXT NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    points INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Tabel Kehadiran / Presensi Kelas
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_nim TEXT NOT NULL,
    meeting_code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alfa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(student_nim, meeting_code)
);

-- Tabel Pengumuman & Pengaturan Global Khusus
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'system_maintenance', 'info', 'urgent'
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Tabel Jawaban Refleksi Siswa
CREATE TABLE IF NOT EXISTS public.reflection_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_nim TEXT NOT NULL,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {question, answer}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(student_nim, module_id, step_index)
);

-- Untuk modul yang sudah ada, tambahkan kolom lkpd jika belum ada:
-- ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS lkpd_url TEXT;
-- ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS lkpd_title TEXT;

-- ==========================================
-- 2. Kebijakan Keamanan / RLS (Row Level Security)
-- ==========================================
-- Opsional: Mengizinkan akses publik penuh (seperti API standar frontend)
-- PENTING: Jika aplikasi digunakan di sisi production sungguhan dengan Auth Supabase, ubah kebijakan di bawah.

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers ENABLE ROW LEVEL SECURITY;

-- Aktifkan semua aksi terhadap pengguna terautentikasi / anon (karena desain saat ini pure frontend check)
CREATE POLICY "Public Access" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.module_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.assignment_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.participation_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.attendance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.reflection_answers FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 3. Storage Bucket (Opsional)
-- ==========================================
-- Catatan: Bucket tidak dapat dibuat via SQL biasa secara langsung, 
-- pastikan Anda punya Bucket Supabase bernama 'materials' secara manual di dashboard.
-- Akses penyimpanan juga di set menjadi Publik secara manual.

-- ==========================================
-- 4. Trigger Otomatis (WAJIB DIJALANKAN)
--    Setiap user baru yang mendaftar via Supabase Auth
--    akan otomatis dimasukkan ke tabel students & profiles.
-- ==========================================

-- Fungsi yang dipanggil oleh trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
BEGIN
    -- Ambil nama dan role dari metadata pendaftaran
    user_name := COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1));
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

    -- Insert ke profiles (terhubung langsung ke auth.users)
    INSERT INTO public.profiles (id, nim, nama, role)
    VALUES (NEW.id, NEW.email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE
        SET nama = EXCLUDED.nama,
            role = EXCLUDED.role;

    -- Insert ke students (untuk kompatibilitas fitur yang pakai student_nim)
    INSERT INTO public.students (nim, name, role)
    VALUES (NEW.email, user_name, user_role)
    ON CONFLICT (nim) DO UPDATE
        SET name = EXCLUDED.name;

    RETURN NEW;
END;
$$;

-- Pasang trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Selesai!
