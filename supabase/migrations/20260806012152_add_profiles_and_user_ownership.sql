/*
# Add public profiles + user ownership on memes

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one row per user
  - `username` (text, unique, not null) — display handle, default to email prefix
  - `avatar_url` (text, nullable) — optional profile picture URL
  - `bio` (text, nullable) — short bio
  - `created_at` (timestamptz, default now()) — join date

2. Modified Tables
- `memes`
  - Add `user_id uuid` (nullable, references auth.users ON DELETE SET NULL) — owner of the meme.
  - Add index on `user_id` for profile queries.
- `upload_requests`
  - Add `user_id uuid` (nullable, references auth.users ON DELETE SET NULL) — submitter.

3. Security
- `profiles`: enable RLS.
  - SELECT is public (TO anon, authenticated) so anyone can view a profile.
  - INSERT only via trigger (never direct from client).
  - UPDATE/DELETE restricted to the owner (authenticated, auth.uid() = id).
- `memes`: existing SELECT stays public; writes already require authenticated (from prior migration).
  - No change to existing policies — the new `user_id` column is just data.
- `upload_requests`: unchanged policies.

4. Automation
- Trigger `on_auth_user_created` creates a `profiles` row automatically when a new auth user signs up.
  - Username defaults to the part before "@" in the email.
  - This means every user has a profile from the moment they register — no client-side setup needed.

5. Important Notes
1. The `profiles.id` column is both PK and FK to auth.users, so there is exactly one profile per user.
2. The trigger is SECURITY DEFINER so it can insert into profiles even though clients cannot.
3. Existing memes get `user_id = null` (anonymous uploads from before auth). New uploads will set it.
4. Username uniqueness is enforced by a unique constraint; the trigger-generated name includes a short random suffix to avoid collisions on identical email prefixes.
*/

-- 1. profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_unique UNIQUE (username)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- public read
DROP POLICY IF EXISTS "public_select_profiles" ON profiles;
CREATE POLICY "public_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

-- owner update
DROP POLICY IF EXISTS "owner_update_profile" ON profiles;
CREATE POLICY "owner_update_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- owner delete
DROP POLICY IF EXISTS "owner_delete_profile" ON profiles;
CREATE POLICY "owner_delete_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- 2. add user_id to memes + upload_requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'memes' AND column_name = 'user_id') THEN
    ALTER TABLE memes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'upload_requests' AND column_name = 'user_id') THEN
    ALTER TABLE upload_requests ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS memes_user_id_idx ON memes (user_id);
CREATE INDEX IF NOT EXISTS upload_requests_user_id_idx ON upload_requests (user_id);

-- 3. auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  suffix text;
  uname text;
BEGIN
  base := split_part(NEW.email, '@', 1);
  suffix := substr(md5(random()::text), 1, 4);
  uname := base || '_' || suffix;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, uname)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
