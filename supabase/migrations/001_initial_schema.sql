-- Function: generate 6-character room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT[] := ARRAY['A','B','C','D','E','F','G','H','J','K','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL DEFAULT generate_room_code(),
  host_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  current_round INTEGER NOT NULL DEFAULT 1,
  round_active BOOLEAN DEFAULT FALSE,
  hostless_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_token UUID DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Buzzes table
CREATE TABLE buzzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  buzzed_at TIMESTAMPTZ DEFAULT now(),
  buzz_order BIGSERIAL NOT NULL,
  is_skipped BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_buzzes_room_round_order ON buzzes(room_id, round_number, buzz_order);

-- RLS: enable on tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzes ENABLE ROW LEVEL SECURITY;

-- RLS policies: rooms
CREATE POLICY "Anyone can view rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT WITH CHECK (true);

-- RLS policies: players
CREATE POLICY "Anyone can view players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join as player" ON players
  FOR INSERT WITH CHECK (true);

-- RLS policies: buzzes
CREATE POLICY "Anyone can view buzzes" ON buzzes
  FOR SELECT USING (true);

CREATE POLICY "Players can insert buzzes" ON buzzes
  FOR INSERT WITH CHECK (true);

-- Note: UPDATE on buzzes and rooms is restricted at the application layer
-- using host_token checks in the WHERE clause for MVP.
