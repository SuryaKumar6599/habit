-- ============================================
-- DEMON SLAYER CORPS LEDGER — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================
-- 0. Clean up existing tables and triggers (to prevent "already exists" errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.encounter_logs CASCADE;
DROP TABLE IF EXISTS public.slayer_logs CASCADE;
DROP TABLE IF EXISTS public.breathing_techniques CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.crow_messages CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- 1. Profiles table (auto-created on signup via trigger)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT 'New Recruit',
  slayer_rank TEXT DEFAULT 'Mizunoto' CHECK (
    slayer_rank IN (
      'Mizunoto',
      'Mizunoe',
      'Kanoto',
      'Kanoe',
      'Tsuchinoto',
      'Tsuchinoe',
      'Hinoto',
      'Hinoe',
      'Kinoto',
      'Kinoe',
      'Hashira'
    )
  ),
  total_xp INTEGER DEFAULT 0,
  current_stamina INTEGER DEFAULT 100,
  max_stamina INTEGER DEFAULT 100,
  sword_durability INTEGER DEFAULT 100,
  crow_status TEXT DEFAULT 'Happy' CHECK (crow_status IN ('Happy', 'Hungry', 'Angry')),
  -- Phase 1 additions
  crow_relationship INTEGER DEFAULT 50 CHECK (
    crow_relationship BETWEEN 0 AND 100
  ),
  crow_last_interaction TIMESTAMPTZ DEFAULT now(),
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  breathing_element TEXT DEFAULT 'Water' CHECK (
    breathing_element IN (
      'Water',
      'Flame',
      'Thunder',
      'Wind',
      'Stone',
      'Mist',
      'Love',
      'Serpent',
      'Insect',
      'Moon',
      'Sun'
    )
  ),
  daily_missions JSONB DEFAULT '[]',
  missions_generated_at DATE,
  last_hashira_visit TIMESTAMPTZ,
  sword_aura TEXT DEFAULT 'none',
  sword_rank TEXT DEFAULT 'Standard',
  sword_element TEXT DEFAULT 'Water',
  sword_xp INTEGER DEFAULT 0,
  sword_level INTEGER DEFAULT 1,
  first_time_setup_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Breathing Techniques (Habits)
CREATE TABLE public.breathing_techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  breathing_element TEXT NOT NULL CHECK (
    breathing_element IN (
      'Water',
      'Flame',
      'Thunder',
      'Wind',
      'Stone',
      'Mist',
      'Love',
      'Serpent',
      'Insect',
      'Moon',
      'Sun'
    )
  ),
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  streak_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- 3. Slayer Logs (Habit Completions)
CREATE TABLE public.slayer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technique_id UUID NOT NULL REFERENCES public.breathing_techniques(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  executed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_gained INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(technique_id, executed_at)
);
-- 4. Encounter Logs (Focus Timer Sessions)
CREATE TABLE public.encounter_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  xp_gained INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);
-- 5. Indexes
CREATE INDEX idx_techniques_user ON public.breathing_techniques(user_id);
CREATE INDEX idx_logs_user ON public.slayer_logs(user_id);
CREATE INDEX idx_logs_date ON public.slayer_logs(executed_at);
CREATE INDEX idx_logs_technique ON public.slayer_logs(technique_id);
CREATE INDEX idx_encounter_user ON public.encounter_logs(user_id);
-- 5. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breathing_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slayer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounter_logs ENABLE ROW LEVEL SECURITY;
-- Profiles: users can read/update only their own row
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Techniques: users can CRUD only their own
CREATE POLICY "Users can view own techniques" ON public.breathing_techniques FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own techniques" ON public.breathing_techniques FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own techniques" ON public.breathing_techniques FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own techniques" ON public.breathing_techniques FOR DELETE USING (auth.uid() = user_id);
-- Logs: users can CRUD only their own
CREATE POLICY "Users can view own logs" ON public.slayer_logs FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.slayer_logs FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.slayer_logs FOR DELETE USING (auth.uid() = user_id);
-- Encounter Logs: users can only access their own sessions
CREATE POLICY "Users can view own encounters" ON public.encounter_logs FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own encounters" ON public.encounter_logs FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own encounters" ON public.encounter_logs FOR DELETE USING (auth.uid() = user_id);
-- 6. Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, display_name)
VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      'New Recruit'
    )
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 7. Analytics Events Table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_value NUMERIC,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own analytics" ON public.analytics_events FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own analytics" ON public.analytics_events FOR
SELECT USING (auth.uid() = user_id);
-- 8. Crow Inbox
CREATE TABLE public.crow_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'notice',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.crow_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.crow_messages FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.crow_messages FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.crow_messages FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.crow_messages FOR DELETE USING (auth.uid() = user_id);
-- 9. Hashira Encounter Logic
CREATE OR REPLACE FUNCTION public.can_spawn_hashira(user_id UUID) RETURNS BOOLEAN AS $$
DECLARE last_visit TIMESTAMPTZ;
BEGIN
SELECT last_hashira_visit INTO last_visit
FROM public.profiles
WHERE id = user_id;
IF last_visit IS NULL
OR last_visit < (now() - interval '24 hours') THEN RETURN TRUE;
END IF;
RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- DAILY MISSIONS SYSTEM
-- ==========================================

DROP TABLE IF EXISTS public.daily_missions CASCADE;

CREATE TABLE public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mission_type TEXT NOT NULL DEFAULT 'any_form', -- any_form, specific_form, focus_session
  target_technique_id UUID REFERENCES public.breathing_techniques(id) ON DELETE CASCADE,
  target_count INTEGER NOT NULL,
  current_count INTEGER DEFAULT 0,
  reward_xp INTEGER NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'Common', -- Common, Rare, Legendary
  is_claimed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own missions" ON public.daily_missions
  FOR ALL USING (auth.uid() = user_id);

-- Function to generate daily missions on-demand and return them
CREATE OR REPLACE FUNCTION public.generate_daily_missions(target_user_id UUID)
RETURNS SETOF public.daily_missions AS $$
DECLARE
  active_missions INTEGER;
  expire_time TIMESTAMPTZ;
  tech_record RECORD;
BEGIN
  -- 1. Check existing unexpired missions
  SELECT COUNT(*) INTO active_missions
  FROM public.daily_missions
  WHERE user_id = target_user_id AND expires_at > now();

  IF active_missions > 0 THEN
    RETURN QUERY SELECT * FROM public.daily_missions WHERE user_id = target_user_id AND expires_at > now() ORDER BY created_at ASC;
    RETURN;
  END IF;

  -- 2. Generate new missions
  expire_time := date_trunc('day', now()) + interval '1 day' - interval '1 second';

  -- COMMON: Execute a specific form (or any if no forms exist)
  SELECT * INTO tech_record FROM public.breathing_techniques WHERE user_id = target_user_id AND is_active = true ORDER BY RANDOM() LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.daily_missions (user_id, title, mission_type, target_technique_id, target_count, reward_xp, rarity, expires_at)
    VALUES (target_user_id, 'Execute ' || tech_record.form_name, 'specific_form', tech_record.id, 3, 10, 'Common', expire_time);
  ELSE
    INSERT INTO public.daily_missions (user_id, title, mission_type, target_count, reward_xp, rarity, expires_at)
    VALUES (target_user_id, 'Execute Any Form', 'any_form', 3, 10, 'Common', expire_time);
  END IF;

  -- RARE: Focus Session
  INSERT INTO public.daily_missions (user_id, title, mission_type, target_count, reward_xp, rarity, expires_at)
  VALUES (target_user_id, 'Total Concentration Breathing', 'focus_session', 2, 50, 'Rare', expire_time);

  -- LEGENDARY: General consistency (e.g., execute any 10 forms)
  INSERT INTO public.daily_missions (user_id, title, mission_type, target_count, reward_xp, rarity, expires_at)
  VALUES (target_user_id, 'Push Past Your Limits', 'any_form', 10, 100, 'Legendary', expire_time);

  -- 3. Return newly created missions
  RETURN QUERY SELECT * FROM public.daily_missions WHERE user_id = target_user_id AND expires_at > now() ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- DAILY MISSIONS TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_mission_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'slayer_logs' THEN
    -- Advance specific_form missions
    UPDATE public.daily_missions
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id AND mission_type = 'specific_form' AND target_technique_id = NEW.technique_id AND current_count < target_count AND expires_at > now();

    -- Advance any_form missions
    UPDATE public.daily_missions
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id AND mission_type = 'any_form' AND current_count < target_count AND expires_at > now();
    
  ELSIF TG_TABLE_NAME = 'encounter_logs' THEN
    -- Advance focus_session missions
    UPDATE public.daily_missions
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id AND mission_type = 'focus_session' AND current_count < target_count AND expires_at > now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_slayer_log_insert ON public.slayer_logs;
CREATE TRIGGER on_slayer_log_insert
  AFTER INSERT ON public.slayer_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_mission_progress();

DROP TRIGGER IF EXISTS on_encounter_log_insert ON public.encounter_logs;
CREATE TRIGGER on_encounter_log_insert
  AFTER INSERT ON public.encounter_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_mission_progress();

-- ==========================================
-- TOTAL CONCENTRATION GROWTH SYSTEM (PHASE 1)
-- ==========================================

-- 1. Create habits table (Supersedes breathing_techniques)
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breathing_technique TEXT NOT NULL DEFAULT 'Water Breathing',
  category TEXT DEFAULT 'Reading',
  weight INTEGER DEFAULT 1,
  target_frequency_per_week INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

-- 2. Create activity_logs table (Supersedes slayer_logs and encounter_logs)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('completion', 'miss', 'relapse', 'wisteria_rest', 'focus_session', 'workout')),
  value NUMERIC,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own activity logs" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

-- 3. Create growth_snapshots table
CREATE TABLE public.growth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  days_trained INTEGER DEFAULT 0,
  consistency_percent NUMERIC DEFAULT 0,
  growth_multiplier NUMERIC DEFAULT 1.0,
  corruption_index NUMERIC DEFAULT 0,
  snapshot_rank TEXT DEFAULT 'Recruit',
  snapshot_sword_tier TEXT DEFAULT 'Wooden Sword',
  snapshot_breathing_balance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.growth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own snapshots" ON public.growth_snapshots FOR SELECT USING (auth.uid() = user_id);

-- 4. Initial Migration Logic (Non-breaking mapping)
-- This creates habits from existing breathing_techniques
INSERT INTO public.habits (id, user_id, name, breathing_technique, target_frequency_per_week, created_at)
SELECT id, user_id, form_name, breathing_element, CASE WHEN frequency = 'daily' THEN 7 ELSE 1 END, created_at
FROM public.breathing_techniques
ON CONFLICT DO NOTHING;

-- Map slayer_logs to activity_logs
INSERT INTO public.activity_logs (id, user_id, habit_id, activity_type, value, logged_date, created_at)
SELECT id, user_id, technique_id, 'completion', xp_gained, executed_at, created_at
FROM public.slayer_logs
ON CONFLICT DO NOTHING;

-- Map encounter_logs to activity_logs
INSERT INTO public.activity_logs (id, user_id, activity_type, value, logged_date, created_at)
SELECT id, user_id, 'focus_session', duration_minutes, completed_at::date, completed_at
FROM public.encounter_logs
ON CONFLICT DO NOTHING;

-- 5. Add new RPG fields to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS growth_multiplier NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS consistency_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS corruption_index NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sword_tier TEXT DEFAULT 'Wooden Sword',
ADD COLUMN IF NOT EXISTS archetype TEXT DEFAULT 'Unassigned',
ADD COLUMN IF NOT EXISTS resonance_level INTEGER DEFAULT 1;

-- 6. Wisteria House Recovery System
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wisteria_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wisteria_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wisteria_end_date DATE,
ADD COLUMN IF NOT EXISTS wisteria_last_earned DATE;

-- 7. Hashira Exam System
CREATE TABLE IF NOT EXISTS public.hashira_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_rank TEXT NOT NULL,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE NOT NULL,
  required_consistency INTEGER NOT NULL DEFAULT 90,
  required_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed', 'cooldown')),
  cooldown_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hashira_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own exams" ON public.hashira_exams
  FOR ALL USING (auth.uid() = user_id);

-- 8. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON public.activity_logs(logged_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_growth_snapshots_user ON public.growth_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_snapshots_date ON public.growth_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);

-- 9. Function: Award Wisteria token if user has 14 days >= 80% consistency
CREATE OR REPLACE FUNCTION public.check_wisteria_eligibility(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  recent_consistency NUMERIC;
  tokens INTEGER;
  last_earned DATE;
BEGIN
  SELECT wisteria_tokens, wisteria_last_earned
  INTO tokens, last_earned
  FROM public.profiles WHERE id = target_user_id;

  -- Only check if < 3 tokens and not earned in last 14 days
  IF tokens >= 3 THEN RETURN; END IF;
  IF last_earned IS NOT NULL AND last_earned > (CURRENT_DATE - 14) THEN RETURN; END IF;

  -- Check last 14 days' activity_logs completion rate
  SELECT
    ROUND(
      COUNT(CASE WHEN activity_type = 'completion' THEN 1 END)::NUMERIC /
      NULLIF(COUNT(CASE WHEN activity_type IN ('completion','miss') THEN 1 END), 0) * 100
    )
  INTO recent_consistency
  FROM public.activity_logs
  WHERE user_id = target_user_id
    AND logged_date >= CURRENT_DATE - 14;

  IF recent_consistency >= 80 THEN
    UPDATE public.profiles
    SET wisteria_tokens = LEAST(tokens + 1, 3),
        wisteria_last_earned = CURRENT_DATE
    WHERE id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function: Deactivate expired Wisteria Wards automatically
CREATE OR REPLACE FUNCTION public.expire_wisteria_wards()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET wisteria_active = false,
      wisteria_end_date = NULL
  WHERE wisteria_active = true
    AND wisteria_end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;