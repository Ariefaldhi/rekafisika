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
    sort_order INTEGER NOT NULL DEFAULT 1,
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

-- Tabel Rangkaian Ajar (Learning Path)
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    reflection_questions TEXT[] DEFAULT '{}',
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Tabel Relasi Modul ke Rangkaian Ajar
CREATE TABLE IF NOT EXISTS public.learning_path_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    UNIQUE(path_id, module_id)
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

-- Tabel Jawaban Refleksi Modul Siswa
CREATE TABLE IF NOT EXISTS public.reflection_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_nim TEXT NOT NULL,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    group_name TEXT,
    teaching_code TEXT,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(student_nim, module_id, step_index)
);

-- Tabel Jawaban Refleksi Rangkaian Ajar
CREATE TABLE IF NOT EXISTS public.path_reflection_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_nim TEXT NOT NULL,
    path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    teaching_code TEXT,
    group_name TEXT,
    answers JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(student_nim, path_id)
);

-- Tabel Sesi Kelas Live (Teacher Paced)
CREATE TABLE IF NOT EXISTS public.sesi_kelas (
    kode_kelas TEXT PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    halaman_aktif INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ==========================================
-- 2. Kebijakan Keamanan / RLS (Row Level Security)
-- ==========================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_reflection_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesi_kelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.learning_paths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.learning_path_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.module_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.reflection_answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.path_reflection_answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.sesi_kelas FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 3. Storage Bucket
-- ==========================================

INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'materials');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'materials');

-- ==========================================
-- 4. Trigger Otomatis
-- ==========================================

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
    user_name := COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1));
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'); -- Default ke teacher sesuai permintaan user

    INSERT INTO public.profiles (id, nim, nama, role)
    VALUES (NEW.id, NEW.email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, role = EXCLUDED.role;

    INSERT INTO public.students (nim, name, role)
    VALUES (NEW.email, user_name, user_role)
    ON CONFLICT (nim) DO UPDATE SET name = EXCLUDED.name;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
