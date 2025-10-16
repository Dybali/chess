-- Create user_bans table to track banned users
CREATE TABLE user_bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent ban
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_actions table to track admin actions on users
CREATE TABLE user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'ban', 'unban', 'password_reset', 'profile_edit', 'status_change'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX idx_user_bans_is_active ON user_bans(is_active);
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX idx_user_actions_admin_id ON user_actions(admin_id);
CREATE INDEX idx_user_actions_created_at ON user_actions(created_at DESC);

-- Add status column to players table if not exists
ALTER TABLE players ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create trigger for user_actions updated_at
CREATE TRIGGER update_user_bans_updated_at BEFORE UPDATE ON user_bans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
