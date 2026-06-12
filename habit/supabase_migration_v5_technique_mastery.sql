BEGIN;

-- =================================================================================
-- Hashira Path Simulator - Technique Mastery Migration (v5)
-- Adds level and xp tracking to individual techniques/habits.
-- =================================================================================

ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

ALTER TABLE public.breathing_techniques
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Note: The Category column already exists in habits as:
-- category TEXT DEFAULT 'Reading'
-- We will repurpose it on the client side for Mind/Body/Discipline.

COMMIT;
