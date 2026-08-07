/*
# Add upload_requests table for developer approval flow

1. New Tables
- `upload_requests`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text, nullable)
  - `media_url` (text, not null) — public URL of the uploaded media in storage
  - `media_type` (text, not null) — one of: image, video, gif
  - `tags` (text[], default empty)
  - `category` (text, nullable) — optional category, e.g. 'onlyfans'
  - `status` (text, not null default 'pending') — one of: pending, approved, rejected
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `upload_requests`.
- Allow anon + authenticated full CRUD (single-tenant no-auth app; approval is enforced in the UI, gated behind the developer password).

3. Notes
- Non-developer uploads land here with status 'pending'.
- The developer reviews them via the notification panel and approves (insert into memes) or rejects (delete).
*/

CREATE TABLE IF NOT EXISTS upload_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video','gif')),
  tags text[] NOT NULL DEFAULT '{}',
  category text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS upload_requests_status_idx ON upload_requests (status, created_at DESC);

ALTER TABLE upload_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_upload_requests" ON upload_requests;
CREATE POLICY "anon_select_upload_requests" ON upload_requests FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_upload_requests" ON upload_requests;
CREATE POLICY "anon_insert_upload_requests" ON upload_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_upload_requests" ON upload_requests;
CREATE POLICY "anon_update_upload_requests" ON upload_requests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_upload_requests" ON upload_requests;
CREATE POLICY "anon_delete_upload_requests" ON upload_requests FOR DELETE
  TO anon, authenticated USING (true);
