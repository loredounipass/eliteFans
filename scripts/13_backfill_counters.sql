-- Backfill script to initialize profile counters (post_count, total_likes, followers_count, following_count)
-- Run this once in a safe environment (staging) and review results before prod.

-- 1) Backfill post_count from posts
UPDATE profiles p
SET post_count = COALESCE(sub.count, 0)
FROM (
  SELECT creator_id, COUNT(*) AS count
  FROM posts
  GROUP BY creator_id
) AS sub
WHERE p.id = sub.creator_id;

-- 2) Backfill total_likes from posts.like_count (if posts.like_count maintained)
UPDATE profiles p
SET total_likes = COALESCE(sub.likes, 0)
FROM (
  SELECT creator_id, SUM(COALESCE(like_count, 0)) AS likes
  FROM posts
  GROUP BY creator_id
) AS sub
WHERE p.id = sub.creator_id;

-- 3) Backfill followers_count and following_count from follows
UPDATE profiles p
SET followers_count = COALESCE(sub.followers, 0),
    following_count = COALESCE(sub.following, 0)
FROM (
  SELECT
    f.following_id AS id,
    COUNT(*) FILTER (WHERE f.following_id IS NOT NULL) AS followers,
    0 AS following
  FROM follows f
  GROUP BY f.following_id
) AS sub
WHERE p.id = sub.id;

-- For following_count we do a separate update
UPDATE profiles p
SET following_count = COALESCE(sub.count, 0)
FROM (
  SELECT follower_id, COUNT(*) AS count
  FROM follows
  GROUP BY follower_id
) AS sub
WHERE p.id = sub.follower_id;

-- 4) Optional: verify results
-- SELECT id, username, post_count, total_likes, followers_count, following_count FROM profiles ORDER BY username LIMIT 50;
