-- ============================================
-- MIGRATION V2: Primary habits + activity_logs
-- Run AFTER supabase_schema.sql in Supabase SQL Editor
-- ============================================

-- 1. Extend habits table with fields from breathing_techniques
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS breathing_element TEXT;

-- Backfill habits from breathing_techniques (same UUIDs)
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

-- 2. Unique constraint for one completion per habit per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_completion_unique
  ON public.activity_logs (user_id, habit_id, logged_date)
  WHERE activity_type = 'completion' AND habit_id IS NOT NULL;

-- 3. Mission progress from activity_logs (replaces slayer_logs / encounter_logs dependency)
CREATE OR REPLACE FUNCTION public.update_mission_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'slayer_logs' THEN
    UPDATE public.daily_missions
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id AND mission_type = 'specific_form'
      AND target_technique_id = NEW.technique_id
      AND current_count < target_count AND expires_at > now();

    UPDATE public.daily_missions
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id AND mission_type = 'any_form'
      AND current_count < target_count AND expires_at > now();

  ELSIF TG_TABLE_NAME = 'encounter_logs' THEN
    UPDATE public.daily_missions
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id AND mission_type = 'focus_session'
      AND current_count < target_count AND expires_at > now();

  ELSIF TG_TABLE_NAME = 'activity_logs' THEN
    IF NEW.activity_type = 'completion' AND NEW.habit_id IS NOT NULL THEN
      UPDATE public.daily_missions
      SET current_count = current_count + 1
      WHERE user_id = NEW.user_id AND mission_type = 'specific_form'
        AND target_technique_id = NEW.habit_id
        AND current_count < target_count AND expires_at > now();

      UPDATE public.daily_missions
      SET current_count = current_count + 1
      WHERE user_id = NEW.user_id AND mission_type = 'any_form'
        AND current_count < target_count AND expires_at > now();

    ELSIF NEW.activity_type = 'focus_session' THEN
      UPDATE public.daily_missions
      SET current_count = current_count + 1
      WHERE user_id = NEW.user_id AND mission_type = 'focus_session'
        AND current_count < target_count AND expires_at > now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_activity_log_insert ON public.activity_logs;
CREATE TRIGGER on_activity_log_insert
  AFTER INSERT ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_mission_progress();

-- 4. Generate missions from habits (fallback to breathing_techniques)
CREATE OR REPLACE FUNCTION public.generate_daily_missions(target_user_id UUID)
RETURNS SETOF public.daily_missions AS $$
DECLARE
  active_missions INTEGER;
  active_techniques INTEGER;
  legendary_target INTEGER;
  expire_time TIMESTAMPTZ;
  tech_record RECORD;
BEGIN
  SELECT COUNT(*) INTO active_techniques
  FROM public.habits
  WHERE user_id = target_user_id AND is_active = true;

  IF active_techniques = 0 THEN
    SELECT COUNT(*) INTO active_techniques
    FROM public.breathing_techniques
    WHERE user_id = target_user_id AND is_active = true;
  END IF;

  SELECT COUNT(*) INTO active_missions
  FROM public.daily_missions
  WHERE user_id = target_user_id AND expires_at > now();

  IF active_missions > 0 THEN
    UPDATE public.daily_missions
    SET title = CASE
          WHEN active_techniques = 0 AND mission_type = 'any_form' THEN 'Hold Total Concentration'
          ELSE title
        END,
        mission_type = CASE
          WHEN active_techniques = 0 AND mission_type = 'any_form' THEN 'focus_session'
          ELSE mission_type
        END,
        target_technique_id = CASE
          WHEN active_techniques = 0 AND mission_type = 'any_form' THEN NULL
          ELSE target_technique_id
        END,
        target_count = CASE
          WHEN mission_type = 'specific_form' THEN 1
          WHEN mission_type = 'any_form' THEN GREATEST(1, LEAST(target_count, GREATEST(active_techniques, 1)))
          WHEN mission_type = 'focus_session' THEN 1
          ELSE target_count
        END,
        current_count = LEAST(current_count, CASE
          WHEN mission_type = 'specific_form' THEN 1
          WHEN mission_type = 'any_form' THEN GREATEST(1, LEAST(target_count, GREATEST(active_techniques, 1)))
          WHEN mission_type = 'focus_session' THEN 1
          ELSE target_count
        END)
    WHERE user_id = target_user_id AND expires_at > now();

    RETURN QUERY SELECT * FROM public.daily_missions
      WHERE user_id = target_user_id AND expires_at > now()
      ORDER BY created_at ASC;
    RETURN;
  END IF;

  expire_time := date_trunc('day', now()) + interval '1 day' - interval '1 second';

  SELECT * INTO tech_record FROM public.habits
    WHERE user_id = target_user_id AND is_active = true
    ORDER BY RANDOM() LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO tech_record FROM public.breathing_techniques
      WHERE user_id = target_user_id AND is_active = true
      ORDER BY RANDOM() LIMIT 1;
  END IF;

  IF FOUND THEN
    INSERT INTO public.daily_missions (user_id, title, mission_type, target_technique_id, target_count, reward_xp, rarity, expires_at)
    VALUES (
      target_user_id,
      'Execute ' || COALESCE(tech_record.name, tech_record.form_name),
      'specific_form',
      tech_record.id,
      1, 10, 'Common', expire_time
    );
  ELSE
    INSERT INTO public.daily_missions (user_id, title, mission_type, target_count, reward_xp, rarity, expires_at)
    VALUES (target_user_id, 'Complete Your First Encounter', 'focus_session', 1, 10, 'Common', expire_time);
  END IF;

  INSERT INTO public.daily_missions (user_id, title, mission_type, target_count, reward_xp, rarity, expires_at)
  VALUES (target_user_id, 'Total Concentration Breathing', 'focus_session', 1, 50, 'Rare', expire_time);

  IF active_techniques > 0 THEN
    legendary_target := LEAST(active_techniques, 3);
    INSERT INTO public.daily_missions (user_id, title, mission_type, target_count, reward_xp, rarity, expires_at)
    VALUES (target_user_id, 'Push Past Your Limits', 'any_form', legendary_target, 100, 'Legendary', expire_time);
  ELSE
    INSERT INTO public.daily_missions (user_id, title, mission_type, target_count, reward_xp, rarity, expires_at)
    VALUES (target_user_id, 'Hold Total Concentration', 'focus_session', 1, 100, 'Legendary', expire_time);
  END IF;

  RETURN QUERY SELECT * FROM public.daily_missions
    WHERE user_id = target_user_id AND expires_at > now()
    ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Growth snapshots unique per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_snapshots_user_date
  ON public.growth_snapshots (user_id, snapshot_date);

-- 6. Expand slayer_rank CHECK for growth-system ranks
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_slayer_rank_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_slayer_rank_check CHECK (
  slayer_rank IN (
    'Recruit', 'Mizunoto', 'Mizunoe', 'Kanoto', 'Kanoe',
    'Tsuchinoto', 'Tsuchinoe', 'Hinoto', 'Hinoe',
    'Kinoto', 'Kinoe', 'Hashira Candidate', 'Hashira', 'Legendary Hashira'
  )
);
