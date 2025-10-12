-- Policies to allow uploads to the 'elitebucket' storage bucket
-- Copy & run these in Supabase SQL editor (Project -> SQL Editor)

-- 1) Allow authenticated users to INSERT objects into storage.objects for elitebucket
-- This permits browser clients with a valid authenticated session to upload files to that bucket.
DROP POLICY IF EXISTS "Allow authenticated inserts to elitebucket" ON storage.objects;
CREATE POLICY "Allow authenticated inserts to elitebucket"
  ON storage.objects
  FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' AND bucket_id = 'elitebucket' );

-- 2) (Optional) Allow public SELECT for objects in elitebucket
-- This makes getPublicUrl work without signed URLs. If you want the bucket private, DO NOT run this.
DROP POLICY IF EXISTS "Allow public read for elitebucket" ON storage.objects;
CREATE POLICY "Allow public read for elitebucket"
  ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'elitebucket' );

-- 3) (Optional) Allow authenticated users to DELETE/UPDATE their own objects
-- If you want users to be able to manage only their own uploads, modify as needed.
DROP POLICY IF EXISTS "Allow authenticated deletes for elitebucket (owner)" ON storage.objects;
CREATE POLICY "Allow authenticated deletes for elitebucket (owner)"
  ON storage.objects
  FOR DELETE
  USING ( auth.role() = 'authenticated' AND bucket_id = 'elitebucket' AND owner = auth.uid() );

DROP POLICY IF EXISTS "Allow authenticated updates for elitebucket (owner)" ON storage.objects;
CREATE POLICY "Allow authenticated updates for elitebucket (owner)"
  ON storage.objects
  FOR UPDATE
  USING ( auth.role() = 'authenticated' AND bucket_id = 'elitebucket' AND owner = auth.uid() )
  WITH CHECK ( auth.role() = 'authenticated' AND bucket_id = 'elitebucket' AND owner = auth.uid() );

-- NOTES:
-- - Run only the policies that match your security model. For public buckets, only the SELECT policy is necessary for reads.
-- - If you prefer private buckets (recommended for exclusive content), keep INSERT allowed for authenticated users
--   and DO NOT run the public SELECT policy; instead, generate signed URLs server-side with createSignedUrl() when serving content.
-- - After running these policies, re-try an upload from the browser and check the Network/Console logs.
