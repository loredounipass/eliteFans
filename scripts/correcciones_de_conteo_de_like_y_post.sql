-- === START: ALTERS + TRIGGERS + BACKFILL ===
BEGIN;

-- 1) Añadir columna total_likes a profiles (si no existe)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;

-- 2) Reemplazar la función update_like_count para mantener posts.like_count y profiles.total_likes
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador en posts
    UPDATE public.posts
    SET like_count = COALESCE(like_count, 0) + 1
    WHERE id = NEW.post_id;

    -- Incrementar total_likes en el perfil del creador
    UPDATE public.profiles
    SET total_likes = COALESCE(total_likes, 0) + 1
    WHERE id = (SELECT creator_id FROM public.posts WHERE id = NEW.post_id);

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador en posts (si existe)
    UPDATE public.posts
    SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
    WHERE id = OLD.post_id;

    -- Decrementar total_likes en el perfil del creador (mantener >= 0)
    UPDATE public.profiles
    SET total_likes = GREATEST(COALESCE(total_likes, 0) - 1, 0)
    WHERE id = (SELECT creator_id FROM public.posts WHERE id = OLD.post_id);

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: si ya existe un trigger que llama a update_like_count() en la tabla likes, no hace falta recrearlo.
-- Si no existe, crear el trigger:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = 'on_like_changed' AND c.relname = 'likes'
  ) THEN
    DROP TRIGGER IF EXISTS on_like_changed ON public.likes;
    CREATE TRIGGER on_like_changed
      AFTER INSERT OR DELETE ON public.likes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_like_count();
  END IF;
END;
$$;

-- 3) Backfill: sincronizar post_count, total_likes, followers_count y following_count
-- 3.1 Backfill post_count
UPDATE public.profiles p
SET post_count = COALESCE(s.cnt, 0)
FROM (
  SELECT creator_id, COUNT(*) AS cnt
  FROM public.posts
  GROUP BY creator_id
) s
WHERE p.id = s.creator_id;

-- Ensure profiles with no posts get zero
UPDATE public.profiles
SET post_count = 0
WHERE post_count IS NULL;

-- 3.2 Backfill total_likes from posts.like_count
UPDATE public.profiles p
SET total_likes = COALESCE(s.likes, 0)
FROM (
  SELECT creator_id, SUM(COALESCE(like_count, 0)) AS likes
  FROM public.posts
  GROUP BY creator_id
) s
WHERE p.id = s.creator_id;

-- Ensure profiles without likes get zero
UPDATE public.profiles
SET total_likes = 0
WHERE total_likes IS NULL;

-- 3.3 Backfill followers_count
UPDATE public.profiles p
SET followers_count = COALESCE(s.followers, 0)
FROM (
  SELECT following_id, COUNT(*) AS followers
  FROM public.follows
  GROUP BY following_id
) s
WHERE p.id = s.following_id;

UPDATE public.profiles
SET followers_count = 0
WHERE followers_count IS NULL;

-- 3.4 Backfill following_count
UPDATE public.profiles p
SET following_count = COALESCE(s.following, 0)
FROM (
  SELECT follower_id, COUNT(*) AS following
  FROM public.follows
  GROUP BY follower_id
) s
WHERE p.id = s.follower_id;

UPDATE public.profiles
SET following_count = 0
WHERE following_count IS NULL;

COMMIT;
-- === END: ALTERS + TRIGGERS + BACKFILL ===