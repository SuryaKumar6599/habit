BEGIN;

-- =================================================================================
-- Hashira Path Simulator - True Demon Campaigns Migration
-- Implements persistent demon campaigns for focus encounters.
-- =================================================================================

-- 1. Create demon_campaigns table
CREATE TABLE IF NOT EXISTS public.demon_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  demon_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Lower Moon',
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  linked_habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'defeated', 'fled')),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demon_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own campaigns" ON public.demon_campaigns;
CREATE POLICY "Users can manage own campaigns" ON public.demon_campaigns 
  FOR ALL USING (auth.uid() = user_id);

-- 2. Link activity_logs to demon campaigns to track damage
ALTER TABLE public.activity_logs
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.demon_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS damage_dealt INTEGER DEFAULT 0;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_demon_campaigns_user ON public.demon_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_campaign ON public.activity_logs(campaign_id);

COMMIT;
