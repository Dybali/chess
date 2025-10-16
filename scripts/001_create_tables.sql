-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  elo_rating INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER DEFAULT 32,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  tournament_type TEXT DEFAULT 'swiss' CHECK (tournament_type IN ('swiss', 'round_robin', 'elimination')),
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament participants table
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  current_table INTEGER DEFAULT 1,
  points DECIMAL(3,1) DEFAULT 0,
  tie_break_score DECIMAL(10,2) DEFAULT 0,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- Create tournament tables (masa sistemi)
CREATE TABLE IF NOT EXISTS public.tournament_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  round_number INTEGER NOT NULL,
  white_player_id UUID REFERENCES public.players(id),
  black_player_id UUID REFERENCES public.players(id),
  result TEXT CHECK (result IN ('1-0', '0-1', '1/2-1/2', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, table_number, round_number)
);

-- Create games table for detailed game records
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  white_player_id UUID NOT NULL REFERENCES public.players(id),
  black_player_id UUID NOT NULL REFERENCES public.players(id),
  result TEXT CHECK (result IN ('1-0', '0-1', '1/2-1/2')),
  round_number INTEGER,
  table_number INTEGER,
  pgn TEXT,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since login is disabled)
CREATE POLICY "Allow public read access to players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tournament_participants" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tournament_tables" ON public.tournament_tables FOR SELECT USING (true);
CREATE POLICY "Allow public read access to games" ON public.games FOR SELECT USING (true);

-- Create policies for insert/update (for admin operations)
CREATE POLICY "Allow public insert to players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to tournaments" ON public.tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to tournaments" ON public.tournaments FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to tournament_participants" ON public.tournament_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to tournament_participants" ON public.tournament_participants FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to tournament_tables" ON public.tournament_tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to tournament_tables" ON public.tournament_tables FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to games" ON public.games FOR UPDATE USING (true);
