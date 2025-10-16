-- Create email_campaigns table to track bulk emails
CREATE TABLE email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  recipient_filter JSONB, -- Store filter criteria (all_users, active_users, tournament_participants, etc.)
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- 'draft', 'sending', 'sent', 'failed'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_recipients table to track individual email sends
CREATE TABLE email_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_templates table for reusable email templates
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'general', 'tournament', 'welcome', 'notification'
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_email_campaigns_sender_id ON email_campaigns(sender_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
CREATE INDEX idx_email_recipients_campaign_id ON email_recipients(campaign_id);
CREATE INDEX idx_email_recipients_user_id ON email_recipients(user_id);
CREATE INDEX idx_email_recipients_status ON email_recipients(status);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- Create triggers for updated_at columns
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (name, subject, content, category) VALUES
('Hoş Geldin Mesajı', 'FILECHESS''e Hoş Geldiniz!', 
'Merhaba {{name}},

FILECHESS ailesine hoş geldiniz! Satranç turnuvalarımıza katılmaya hazır mısınız?

Platformumuzda:
- Çeşitli turnuvalara katılabilirsiniz
- ELO puanınızı geliştirebilirsiniz  
- Diğer oyuncularla yarışabilirsiniz

İlk turnuvanıza katılmak için: {{tournament_link}}

Başarılar dileriz!
FILECHESS Ekibi', 'welcome'),

('Turnuva Duyurusu', 'Yeni Turnuva: {{tournament_name}}', 
'Merhaba {{name}},

Yeni bir turnuva başlıyor! {{tournament_name}} turnuvasına katılmayı unutmayın.

Turnuva Detayları:
- Başlangıç: {{start_date}}
- Katılımcı Limiti: {{max_participants}}
- Ödül Havuzu: {{prize_pool}} TL

Hemen katıl: {{registration_link}}

Bol şans!
FILECHESS Ekibi', 'tournament'),

('Genel Duyuru', 'FILECHESS Duyurusu', 
'Merhaba {{name}},

Size önemli bir duyurumuz var:

{{announcement_content}}

Sorularınız için bizimle iletişime geçebilirsiniz.

Saygılarımızla,
FILECHESS Ekibi', 'general');
