BEGIN;

-- =================================================================================
-- Hashira Path Simulator - Event Sourcing Migration
-- Safely migrate legacy data into the new event-sourced tables.
-- =================================================================================

-- 0. Ensure target columns exist on habits table
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS breathing_element TEXT;

-- 1. Migrate legacy breathing techniques into the new habits table
INSERT INTO public.habits (
  id, user_id, name, description, breathing_technique, category,
  breathing_element, frequency, streak_count, target_frequency_per_week,
  is_active, created_at
)
SELECT
  id, user_id, form_name, description,
  breathing_element || ' Breathing', breathing_element,
  breathing_element, frequency, streak_count,
  CASE WHEN frequency = 'daily' THEN 7 ELSE 1 END,
  is_active, created_at
FROM public.breathing_techniques
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  breathing_element = EXCLUDED.breathing_element,
  frequency = EXCLUDED.frequency,
  streak_count = EXCLUDED.streak_count,
  is_active = EXCLUDED.is_active;

-- 2. Migrate legacy slayer_logs into the unified activity_logs ledger (completions)
INSERT INTO public.activity_logs (
  id, user_id, habit_id, activity_type, value, logged_date, created_at
)
SELECT
  id, user_id, technique_id, 'completion', xp_gained, executed_at, created_at
FROM public.slayer_logs
ON CONFLICT DO NOTHING;

-- 3. Migrate legacy encounter_logs into the unified activity_logs ledger (focus sessions)
INSERT INTO public.activity_logs (
  id, user_id, activity_type, value, logged_date, created_at
)
SELECT
  id, user_id, 'focus_session', duration_minutes, completed_at::date, completed_at
FROM public.encounter_logs
ON CONFLICT DO NOTHING;

COMMIT;
