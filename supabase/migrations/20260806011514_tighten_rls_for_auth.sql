/*
# Tighten RLS: require sign-in for uploads and approval queue

1. Changes to `memes`
- SELECT stays public (guests can browse the gallery).
- INSERT / UPDATE / DELETE now require `authenticated` (only logged-in users can upload or manage memes).

2. Changes to `upload_requests`
- All CRUD now requires `authenticated`. This table holds the developer approval queue and community submissions; only logged-in users should read or modify it.

3. Changes to `wishes`
- Unchanged — stays public (guests can submit wishes).

4. Security
- Replaces the previous anon-permissive policies on `memes` and `upload_requests` with authenticated-scoped ones.
- No data is lost; only access is narrowed.
*/

-- memes: SELECT stays public, writes require auth
DROP POLICY IF EXISTS "anon_select_memes" ON memes;
CREATE POLICY "anon_select_memes" ON memes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_memes" ON memes;
CREATE POLICY "auth_insert_memes" ON memes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_memes" ON memes;
CREATE POLICY "auth_update_memes" ON memes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_memes" ON memes;
CREATE POLICY "auth_delete_memes" ON memes FOR DELETE
  TO authenticated USING (true);

-- upload_requests: all CRUD requires auth
DROP POLICY IF EXISTS "anon_select_upload_requests" ON upload_requests;
CREATE POLICY "auth_select_upload_requests" ON upload_requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_upload_requests" ON upload_requests;
CREATE POLICY "auth_insert_upload_requests" ON upload_requests FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_upload_requests" ON upload_requests;
CREATE POLICY "auth_update_upload_requests" ON upload_requests FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_upload_requests" ON upload_requests;
CREATE POLICY "auth_delete_upload_requests" ON upload_requests FOR DELETE
  TO authenticated USING (true);
