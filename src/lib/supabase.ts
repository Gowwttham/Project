import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
);

export type Meme = {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video' | 'gif';
  tags: string[];
  likes: number;
  downloads: number;
  is_template: boolean;
  category: string | null;
  user_id: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export const MEMES_BUCKET = 'memes';

export type Wish = {
  id: string;
  message: string;
  created_at: string;
};

export type UploadRequest = {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video' | 'gif';
  tags: string[];
  category: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};
