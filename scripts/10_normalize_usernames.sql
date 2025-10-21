-- 10_normalize_usernames.sql
-- Migración para normalizar usernames existentes a lowercase y actualizar el trigger
-- Instrucciones: ejecutar en la base de datos (p. ej. en Supabase SQL editor).

-- 1) Hacer un respaldo de seguridad antes de ejecutar.
--    RECOMMENDACIÓN: Crear un dump o copiar la tabla profiles a profiles_backup.

-- 2) Normalizar usernames existentes. Esto convierte a lowercase y elimina espacios alrededor.
BEGIN;

-- Crear una copia de seguridad rápida (opcional pero recomendada)
CREATE TABLE IF NOT EXISTS profiles_backup AS TABLE profiles WITH NO DATA;
INSERT INTO profiles_backup SELECT * FROM profiles;

-- Actualizar usernames a lower(trim(username)). Pero debemos tratar posibles conflictos
-- Si dos usernames normalizados colisionan (p.ej. 'User' y 'user'), añadiremos un sufijo incremental

-- Crear una tabla temporal con el mapping desired_username -> id
CREATE TEMP TABLE tmp_usernames AS
SELECT id, username, lower(trim(username)) AS desired
FROM profiles
WHERE username IS NOT NULL;

-- Encontrar duplicados en desired
CREATE TEMP TABLE tmp_duplicates AS
SELECT desired, count(*) AS cnt
FROM tmp_usernames
GROUP BY desired
HAVING count(*) > 1;

-- Para usernames sin duplicados, actualizamos directamente
UPDATE profiles p
SET username = t.desired
FROM tmp_usernames t
LEFT JOIN tmp_duplicates d ON t.desired = d.desired
WHERE p.id = t.id AND d.desired IS NULL;

-- Para usernames duplicados, asignar sufijos seguros (_1, _2, ...)
DO $$
DECLARE
  rec RECORD;
  i INT;
BEGIN
  FOR rec IN SELECT desired FROM tmp_duplicates LOOP
    i := 1;
    FOR r IN SELECT id, username FROM tmp_usernames WHERE desired = rec.desired ORDER BY id LOOP
      -- Intenta asignar desired, if occupied, intenta desired_i
      LOOP
        BEGIN
          UPDATE profiles SET username = rec.desired WHERE id = r.id AND NOT EXISTS (SELECT 1 FROM profiles WHERE username = rec.desired AND id <> r.id);
          IF FOUND THEN
            EXIT; -- asignado
          ELSE
            -- asignar desired_{i}
            UPDATE profiles SET username = rec.desired || '_' || i::text WHERE id = r.id AND NOT EXISTS (SELECT 1 FROM profiles WHERE username = rec.desired || '_' || i::text);
            IF FOUND THEN
              i := i + 1;
              EXIT; -- asignado
            END IF;
            i := i + 1;
          END IF;
        EXCEPTION WHEN unique_violation THEN
          -- seguir intentando con siguiente i
          i := i + 1;
        END;
      END LOOP;
    END LOOP;
  END LOOP;
END$$;

-- Asegurar que no haya usernames nulos ni vacíos
UPDATE profiles SET username = lower(trim(COALESCE(username, ''))) WHERE username IS NOT NULL;

-- Verificación rápida: mostrar cuántos usuarios por username normalizado
-- SELECT username, count(*) FROM profiles GROUP BY username HAVING count(*) > 1;

-- 3) Crear índice funcional para búsquedas eficientes (lower(username))
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (lower(username));

-- 4) Actualizar la función/trigger handle_new_user para insertar siempre normalized username
-- Nota: esto reemplaza la definición previa de la función. Se usa lower(trim(...)) para normalizar.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    lower(trim(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)))),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-crear trigger si es necesario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMIT;

-- End of migration
