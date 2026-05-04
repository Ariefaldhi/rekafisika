import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ──────────────────────────────────────────────
// Database types (minimal, expand as needed)
// ──────────────────────────────────────────────
export interface UserSession {
  role: 'admin' | 'teacher' | 'student';
  nama: string;
  nim: string;
  email?: string;
  teaching_code?: string | null;
  profile_photo_url?: string | null;
  is_guest?: boolean;
  active_module_id?: string;
  teacher_name?: string;
}

export interface ModuleStep {
  type: 'ppt' | 'pdf' | 'video' | 'phet' | 'refleksi' | 'link';
  title: string;
  url: string;
  instruction?: string;
  question?: string;
  answer_key?: string;
  start_page?: number;
  end_page?: number;
  start_time?: number;
  end_time?: number;
  phet_questions?: string[];
  phet_tables?: { columns: string[]; rows: number }[];
  questions?: string[]; // for refleksi
}

export interface Module {
  id: string;
  topic: string;
  description?: string;
  week: number;
  is_visible: boolean;
  is_locked: boolean;
  steps: ModuleStep[];
  lkpd_url?: string;
  created_at: string;
}

export interface ModuleProgress {
  module_id: string;
  student_nim: string;
  is_completed: boolean;
  completed_steps?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent';
  created_at: string;
}
