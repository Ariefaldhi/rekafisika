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
  created_at?: string;
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
  questions?: string[]; 
  tables?: { title: string; columns: string[]; rows: number }[];
}

export interface Module {
  id: string;
  topic: string;
  description?: string;
  sort_order: number;
  is_visible: boolean;
  is_locked: boolean;
  steps: ModuleStep[];
  lkpd_url?: string;
  lkpd_title?: string;
  created_at: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  is_visible: boolean;
  reflection_questions?: string[];
  created_at: string;
  learning_path_modules?: LearningPathModule[];
}

export interface LearningPathModule {
  id: string;
  path_id: string;
  module_id: string;
  order_index: number;
  module?: Module;
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
