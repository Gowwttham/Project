/*
# Create memes table + storage bucket (no-auth, single-tenant)

1. New Tables
- `memes`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text, nullable)
  - `media_url` (text, not null) — public URL of the uploaded media in storage
  - `media_type` (text, not null) — one of: image, video, gif
  - `tags` (text[], default empty) — free-form tags
  - `likes` (integer, default 0) — like counter
  - `downloads` (integer, default 0) — download counter
  - `is_template` (boolean, default false) — whether this meme is also offered as a blank template
  - `created_at` (timestamptz, default now())

2. Storage
- Public bucket `memes` for storing uploaded media files (images/videos/gifs).

3. Security
- Enable RLS on `memes`.
- Allow anon + authenticated full CRUD because the app is intentionally public/shared (no sign-in).
- Storage bucket policies: public read + anon/authenticated upload.

4. Notes
- No user_id / auth because the app has no sign-in screen.
- Likes are a simple counter (no per-user dedup) to keep the app simple and serverless.
*/

CREATE TABLE IF NOT EXISTS memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video','gif')),
  tags text[] NOT NULL DEFAULT '{}',
  likes integer NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0,
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memes_created_at_idx ON memes (created_at DESC);
CREATE INDEX IF NOT EXISTS memes_likes_idx ON memes (likes DESC);

ALTER TABLE memes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_memes" ON memes;
CREATE POLICY "anon_select_memes" ON memes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_memes" ON memes;
CREATE POLICY "anon_insert_memes" ON memes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_memes" ON memes;
CREATE POLICY "anon_update_memes" ON memes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_memes" ON memes;
CREATE POLICY "anon_delete_memes" ON memes FOR DELETE
  TO anon, authenticated USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('memes', 'memes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_memes_bucket" ON storage.objects;
CREATE POLICY "anon_read_memes_bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'memes');

DROP POLICY IF EXISTS "anon_upload_memes_bucket" ON storage.objects;
CREATE POLICY "anon_upload_memes_bucket" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'memes');

DROP POLICY IF EXISTS "anon_update_memes_bucket" ON storage.objects;
CREATE POLICY "anon_update_memes_bucket" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'memes') WITH CHECK (bucket_id = 'memes');

DROP POLICY IF EXISTS "anon_delete_memes_bucket" ON storage.objects;
CREATE POLICY "anon_delete_memes_bucket" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'memes');
