-- Create photos and videos tables for uploads

CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  filename TEXT,
  title TEXT,
  description TEXT,
  mime_type TEXT,
  size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_creator_id ON photos(creator_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public photos are viewable by everyone"
  ON photos FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert own photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = creator_id);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  filename TEXT,
  title TEXT,
  description TEXT,
  mime_type TEXT,
  size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public videos are viewable by everyone"
  ON videos FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert own videos"
  ON videos FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own videos"
  ON videos FOR UPDATE
  USING (auth.uid() = creator_id);
