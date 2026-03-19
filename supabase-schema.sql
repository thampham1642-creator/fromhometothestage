-- ============================================
-- FROM HOME TO THE STAGE — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT        UNIQUE NOT NULL,
  name               TEXT,
  avatar_url         TEXT,
  current_streak     INTEGER     NOT NULL DEFAULT 0,
  longest_streak     INTEGER     NOT NULL DEFAULT 0,
  last_practiced_at  DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions bank
CREATE TABLE IF NOT EXISTS public.questions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  text       TEXT        NOT NULL,
  difficulty TEXT        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category   TEXT,
  is_custom  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Practice sessions
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id  UUID        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  difficulty   TEXT        NOT NULL,
  practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reflections
CREATE TABLE IF NOT EXISTS public.reflections (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id   UUID        REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  practiced_on DATE        NOT NULL,
  feeling      TEXT        NOT NULL,
  did_well     TEXT        NOT NULL,
  improve      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT        NOT NULL,
  description       TEXT        NOT NULL,
  duration_days     INTEGER     NOT NULL,
  goal_count        INTEGER     NOT NULL,
  difficulty_filter TEXT        CHECK (difficulty_filter IN ('easy','medium','hard','any')) DEFAULT 'any',
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at           TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID        NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress     INTEGER     NOT NULL DEFAULT 0,
  completed    BOOLEAN     NOT NULL DEFAULT FALSE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can view, only owner can update their own row
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Questions: publicly readable, insert restricted to authenticated users
CREATE POLICY "questions_select_all" ON public.questions FOR SELECT USING (true);
CREATE POLICY "questions_insert"     ON public.questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Practice sessions: users can only see and create their own
CREATE POLICY "sessions_select_own"  ON public.practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own"  ON public.practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reflections: users can only see and create their own
CREATE POLICY "reflections_select_own" ON public.reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reflections_insert_own" ON public.reflections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges: publicly readable
CREATE POLICY "challenges_select_all" ON public.challenges FOR SELECT USING (true);

-- Participants: anyone can view (for leaderboards), users can only join/update their own
CREATE POLICY "participants_select_all"   ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert_own"   ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participants_update_own"   ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SEED — Questions (30 total)
-- ============================================

INSERT INTO public.questions (text, difficulty, category) VALUES
('If you could have any superpower for just one day, what would it be and why?',     'easy', 'imagination'),
('What is one habit that has genuinely improved your life?',                          'easy', 'personal'),
('Describe your ideal morning routine.',                                              'easy', 'lifestyle'),
('What is the best advice you have ever received?',                                   'easy', 'wisdom'),
('If you could learn any skill instantly, what would it be?',                         'easy', 'growth'),
('What book, movie, or show has influenced you the most, and why?',                   'easy', 'culture'),
('If you could live in any era of history, which would you choose?',                  'easy', 'imagination'),
('What does your perfect weekend look like?',                                         'easy', 'lifestyle'),
('What is something small that makes you genuinely happy?',                           'easy', 'personal'),
('If you could have dinner with anyone — alive or dead — who would it be?',           'easy', 'imagination'),
('Describe a time you completely changed your mind about something important.',       'medium', 'growth'),
('What habit do you think everyone should develop, and why?',                         'medium', 'insight'),
('Talk about a challenge you are currently facing and how you are dealing with it.',  'medium', 'personal'),
('What does success mean to you — and how has that definition evolved?',              'medium', 'values'),
('If you had to give a 5-minute talk tomorrow, what topic would you choose?',        'medium', 'speaking'),
('What is a belief you hold that most people around you disagree with?',             'medium', 'values'),
('Describe a failure that turned out to be a blessing in disguise.',                 'medium', 'growth'),
('What would you do differently if you knew no one would judge you?',                'medium', 'insight'),
('Talk about someone who shaped who you are today.',                                 'medium', 'personal'),
('What is the most important lesson you learned in the past year?',                  'medium', 'reflection'),
('Should social media companies be held legally responsible for mental health effects on teens?', 'hard', 'society'),
('If you were in government for one year, what is the first policy you would implement?',        'hard', 'politics'),
('Is it ever ethical to break the law? Give a nuanced argument.',                    'hard', 'ethics'),
('How should governments balance economic growth with climate action?',               'hard', 'policy'),
('Debate: remote work is fundamentally better than office work — but only for some people. Who, and why?', 'hard', 'work'),
('Should there be an upper limit on personal wealth? Defend your position.',         'hard', 'economics'),
('Is social media doing more harm than good to democracy?',                           'hard', 'society'),
('Should universities still be the default path after high school?',                 'hard', 'education'),
('What is the biggest risk humanity faces in the next 50 years?',                    'hard', 'futures'),
('Is cancel culture a form of accountability or mob justice?',                       'hard', 'culture');

-- ============================================
-- SEED — Challenges
-- ============================================

INSERT INTO public.challenges (title, description, duration_days, goal_count, difficulty_filter, starts_at, ends_at) VALUES
('14-Day Speaking Streak',  'Answer one question every day for 14 consecutive days. Build the habit, own the stage.', 14, 14, 'any',  NOW(), NOW() + INTERVAL '14 days'),
('30 Hard Questions Club',  'Complete 30 hard-level questions this month. Not for the faint-hearted.',                30, 30, 'hard', NOW(), NOW() + INTERVAL '30 days'),
('Toastmasters Week',       'A curated 7-day sprint with questions designed for Toastmasters members.',               7,  7,  'any',  NOW(), NOW() + INTERVAL '7 days');
