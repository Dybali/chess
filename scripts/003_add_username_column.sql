-- Add username column to players table
ALTER TABLE players ADD COLUMN username TEXT UNIQUE;

-- Add index for faster username lookups
CREATE INDEX idx_players_username ON players(username);

-- Add constraint to ensure username is not null for new records
ALTER TABLE players ADD CONSTRAINT username_not_empty CHECK (username IS NOT NULL AND LENGTH(username) >= 3);
