-- Create posts table for creator content
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[], -- Array of image/video URLs
  media_type TEXT CHECK (media_type IN ('image', 'video', 'mixed')),
  is_locked BOOLEAN DEFAULT false, -- If true, requires subscription or payment
  price DECIMAL(10, 2) DEFAULT 0, -- Pay-per-view price (0 if subscription only)
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies for posts
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (
    NOT is_locked OR 
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE subscriber_id = auth.uid() 
      AND creator_id = posts.creator_id 
      AND status = 'active'
    )
  );

CREATE POLICY "Creators can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = creator_id);

-- Function to update post count
CREATE OR REPLACE FUNCTION update_profile_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET post_count = post_count - 1 WHERE id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update post count
DROP TRIGGER IF EXISTS on_post_created_or_deleted ON posts;
CREATE TRIGGER on_post_created_or_deleted
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_profile_post_count();
