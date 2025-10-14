-- Add data_base45 column to photos to store binary data encoded in base45

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS data_base45 TEXT;

-- Optional: create an index for creator_id and created_at are already present

-- NOTE: After applying this migration, you may want to backfill any existing images
-- from storage into this column if migrating from bucket storage.
