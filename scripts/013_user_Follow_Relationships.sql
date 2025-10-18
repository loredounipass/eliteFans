-- Create follows table for user following functionality
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure a user can't follow the same person twice
  UNIQUE(follower_id, following_id),

  -- Ensure a user can't follow themselves
  CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_created_at_idx ON follows(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
-- Users can view all follows (for public follower/following counts)
CREATE POLICY "allow_read_all_follows" ON follows
FOR SELECT
USING (true);

-- Users can only follow others (insert their own follows)
CREATE POLICY "allow_insert_own_follows" ON follows
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- Users can only unfollow (delete their own follows)
CREATE POLICY "allow_delete_own_follows" ON follows
FOR DELETE TO authenticated
USING (auth.uid() = follower_id);

-- Add follower and following counts to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;

    -- Increment followers count for the followed user
    UPDATE profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles
    SET following_count = following_count - 1
    WHERE id = OLD.follower_id;

    -- Decrement followers count for the unfollowed user
    UPDATE profiles
    SET followers_count = followers_count - 1
    WHERE id = OLD.following_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update follow counts
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Initialize follower counts for existing users
UPDATE profiles
SET
  followers_count = (
    SELECT COUNT(*) FROM follows WHERE following_id = profiles.id
  ),
  following_count = (
    SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id
  );
