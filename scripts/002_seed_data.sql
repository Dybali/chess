-- Insert sample players
INSERT INTO public.players (name, email, elo_rating, games_played, wins, losses, draws) VALUES
('Ahmet Yılmaz', 'ahmet@example.com', 1850, 45, 28, 12, 5),
('Mehmet Kaya', 'mehmet@example.com', 1720, 38, 22, 14, 2),
('Fatma Demir', 'fatma@example.com', 1650, 32, 18, 11, 3),
('Ali Özkan', 'ali@example.com', 1580, 28, 15, 10, 3),
('Ayşe Şahin', 'ayse@example.com', 1520, 25, 12, 11, 2),
('Mustafa Çelik', 'mustafa@example.com', 1480, 22, 10, 10, 2),
('Zeynep Arslan', 'zeynep@example.com', 1420, 20, 8, 10, 2),
('Emre Doğan', 'emre@example.com', 1380, 18, 7, 9, 2),
('Selin Yıldız', 'selin@example.com', 1340, 16, 6, 8, 2),
('Burak Aydın', 'burak@example.com', 1300, 14, 5, 7, 2),
('Elif Koç', 'elif@example.com', 1280, 12, 4, 6, 2),
('Oğuz Polat', 'oguz@example.com', 1250, 10, 3, 5, 2),
('Deniz Güler', 'deniz@example.com', 1220, 8, 2, 4, 2),
('Ceren Aktaş', 'ceren@example.com', 1200, 6, 1, 3, 2),
('Kerem Bulut', 'kerem@example.com', 1180, 4, 0, 2, 2),
('Nisa Erdoğan', 'nisa@example.com', 1160, 2, 0, 1, 1);

-- Insert sample tournaments
INSERT INTO public.tournaments (name, description, start_date, end_date, max_participants, entry_fee, prize_pool, status, current_round, total_rounds) VALUES
('FILECHESS Açık Turnuvası 2024', 'Yılın en büyük satranç turnuvası', '2024-12-15 10:00:00+03', '2024-12-15 18:00:00+03', 32, 50.00, 1000.00, 'active', 3, 5),
('Başlangıç Seviyesi Turnuvası', 'Yeni başlayanlar için özel turnuva', '2024-12-20 14:00:00+03', '2024-12-20 20:00:00+03', 16, 25.00, 400.00, 'upcoming', 0, 4),
('Hızlı Satranç Şampiyonası', 'Blitz formatında heyecanlı maçlar', '2024-12-22 19:00:00+03', '2024-12-22 22:00:00+03', 24, 30.00, 600.00, 'upcoming', 0, 6);

-- Insert tournament participants for the active tournament
INSERT INTO public.tournament_participants (tournament_id, player_id, current_table, points, tie_break_score)
SELECT 
  t.id,
  p.id,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY p.elo_rating DESC) <= 4 THEN 1
    WHEN ROW_NUMBER() OVER (ORDER BY p.elo_rating DESC) <= 8 THEN 2
    WHEN ROW_NUMBER() OVER (ORDER BY p.elo_rating DESC) <= 12 THEN 3
    ELSE 4
  END as current_table,
  ROUND(RANDOM() * 3, 1) as points,
  ROUND(RANDOM() * 100, 2) as tie_break_score
FROM public.tournaments t
CROSS JOIN public.players p
WHERE t.name = 'FILECHESS Açık Turnuvası 2024'
LIMIT 16;

-- Insert some sample games
INSERT INTO public.games (tournament_id, white_player_id, black_player_id, result, round_number, table_number, played_at)
SELECT 
  t.id,
  p1.id,
  p2.id,
  CASE ROUND(RANDOM() * 2)
    WHEN 0 THEN '1-0'
    WHEN 1 THEN '0-1'
    ELSE '1/2-1/2'
  END as result,
  ROUND(RANDOM() * 2 + 1) as round_number,
  ROUND(RANDOM() * 3 + 1) as table_number,
  NOW() - INTERVAL '1 day' * RANDOM() * 7
FROM public.tournaments t
CROSS JOIN public.players p1
CROSS JOIN public.players p2
WHERE t.name = 'FILECHESS Açık Turnuvası 2024'
AND p1.id != p2.id
LIMIT 20;
