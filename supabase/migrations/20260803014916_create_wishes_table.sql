/*
# Create wishes table for Help box

1. New Tables
- `wishes`
  - `id` (uuid, primary key)
  - `message` (text, not null) — the wish/request typed by a visitor
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `wishes`.
- INSERT: allow anon + authenticated to insert new wishes (visitors submitting the help form).
- SELECT: deny by default (no SELECT policy) — visitors cannot read other people's wishes.
  Only the developer (via the Supabase dashboard / service role) can view submitted wishes.
- UPDATE / DELETE: no policies — wishes are immutable once submitted.

3. Notes
- This is a no-auth public app. Visitors submit wishes anonymously.
- Wishes are private to the developer: no anon/authenticated SELECT policy means the table
  is write-only from the client. The developer reads wishes through the Supabase dashboard
  or service-role access, functioning like a private notification inbox.
*/

CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wishes_created_at_idx ON wishes (created_at DESC);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to INSERT wishes
DROP POLICY IF EXISTS "anon_insert_wishes" ON wishes;
CREATE POLICY "anon_insert_wishes" ON wishes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- No SELECT policy: wishes are private (developer-only, read via dashboard/service role)
-- No UPDATE/DELETE policies: wishes are immutable once submitted
