"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Stats = {
  totalTournaments: number;
  totalPlayers: number;
  activeTournaments: number;
}

type Tournament = {
  id: string;
  name: string;
  status: string;
  start_date: string;
}

type Player = {
  id: string;
  name: string;
  email: string;
  elo_rating: number;
  is_banned: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalTournaments: 0,
    totalPlayers: 0,
    activeTournaments: 0
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuthenticated");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }

    // Verileri yükle
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    try {
      // İstatistikler
      const [
        { count: totalTournaments },
        { count: totalPlayers },
        { count: activeTournaments }
      ] = await Promise.all([
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('status', 'active')
      ]);

      setStats({
        totalTournaments: totalTournaments || 0,
        totalPlayers: totalPlayers || 0,
        activeTournaments: activeTournaments || 0
      });

      // Turnuvalar
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      setTournaments(tournamentsData || []);

      // Oyuncular
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .order('elo_rating', { ascending: false });

      setPlayers(playersData || []);

    } catch (error: any) {
      console.error('Veri yükleme hatası:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Turnuva İşlemleri
  const handleCreateTournament = async () => {
    router.push('/create-tournament');
  };

  const handleEditTournament = async (id: string) => {
    router.push(`/tournaments/${id}/manage`);
  };

  const handleCancelTournament = async (id: string) => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      await supabase
        .from('tournaments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      loadData(); // Yeniden yükle
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Oyuncu İşlemleri
  const handleBanPlayer = async (id: string) => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      await supabase
        .from('players')
        .update({ is_banned: true })
        .eq('id', id);
      
      loadData(); // Yeniden yükle
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanPlayer = async (id: string) => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      await supabase
        .from('players')
        .update({ is_banned: false })
        .eq('id', id);
      
      loadData(); // Yeniden yükle
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateElo = async (id: string, newElo: number) => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      await supabase
        .from('players')
        .update({ elo_rating: newElo })
        .eq('id', id);
      
      loadData(); // Yeniden yükle
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Turnuva İşlemleri
  const handleTurnuvaIptal = async (id: string) => {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase
        .from('tournaments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      await loadData();
      alert('Turnuva iptal edildi');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleYeniTurnuva = () => {
    router.push('/create-tournament');
  };

  const handleTurnuvaDuzenle = (id: string) => {
    router.push(`/tournaments/${id}/manage`);
  };

  // Oyuncu İşlemleri
  const handleOyuncuBanla = async (id: string) => {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase
        .from('players')
        .update({ is_banned: true })
        .eq('id', id);
      
      await loadData();
      alert('Oyuncu yasaklandı');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBanKaldir = async (id: string) => {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase
        .from('players')
        .update({ is_banned: false })
        .eq('id', id);
      
      await loadData();
      alert('Oyuncu yasağı kaldırıldı');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEloGuncelle = async (id: string, amount: number) => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: player } = await supabase
        .from('players')
        .select('elo_rating')
        .eq('id', id)
        .single();
      
      const yeniElo = (player?.elo_rating || 1200) + amount;
      
      await supabase
        .from('players')
        .update({ elo_rating: yeniElo })
        .eq('id', id);
      
      await loadData();
      alert(`ELO güncellendi: ${amount > 0 ? '+' : ''}${amount}`);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
                <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
              <p className="text-sm text-gray-500">Sistem Yönetimi</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Turnuva Yönetimi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Turnuva Yönetimi</h2>
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto mb-4">
                {tournaments.map(tournament => (
                  <div key={tournament.id} className="p-2 border-b flex justify-between items-center">
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-sm text-gray-500">{tournament.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleTurnuvaDuzenle(tournament.id)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                        disabled={loading}
                      >
                        Düzenle
                      </button>
                      <button 
                        onClick={() => handleTurnuvaIptal(tournament.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        disabled={loading || tournament.status === 'cancelled'}
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleYeniTurnuva}
                className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2"
                disabled={loading}
              >
                Yeni Turnuva Oluştur
              </button>
        </div>
            </div>

          {/* Oyuncu Yönetimi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Oyuncu Yönetimi</h2>
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto mb-4">
                {players.map(player => (
                  <div key={player.id} className="p-2 border-b">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-gray-500">{player.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">ELO: {player.elo_rating}</span>
                        <button 
                          onClick={() => handleEloGuncelle(player.id, 100)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          disabled={loading}
                        >
                          +100
                        </button>
                        <button 
                          onClick={() => handleEloGuncelle(player.id, -100)}
                          className="px-2 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                          disabled={loading}
                        >
                          -100
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      {player.is_banned ? (
                        <button 
                          onClick={() => handleBanKaldir(player.id)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          disabled={loading}
                        >
                          Yasağı Kaldır
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOyuncuBanla(player.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          disabled={loading}
                        >
                          Yasakla
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
                {loading && <div className="text-sm text-blue-600 mt-2">İşlem yapılıyor...</div>}
              </div>
                </div>
            </div>

          {/* Sistem Yönetimi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sistem Yönetimi</h2>
            <div className="space-y-3">
              <button className="w-full p-3 bg-emerald-500 text-white rounded hover:bg-emerald-600 flex items-center justify-center gap-2">
                Sistem İstatistikleri
              </button>
              <button className="w-full p-3 bg-cyan-500 text-white rounded hover:bg-cyan-600 flex items-center justify-center gap-2">
                Veritabanı Yönetimi
              </button>
              <button className="w-full p-3 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center gap-2">
                Log Kayıtları
              </button>
                  </div>
                </div>

          {/* İstatistikler */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">İstatistikler</h2>
                <div className="space-y-4">
                        <div>
                <p className="text-sm text-gray-500">Toplam Turnuva</p>
                <p className="text-2xl font-bold">{stats.totalTournaments}</p>
                </div>
            <div>
                <p className="text-sm text-gray-500">Toplam Oyuncu</p>
                <p className="text-2xl font-bold">{stats.totalPlayers}</p>
            </div>
                        <div>
                <p className="text-sm text-gray-500">Aktif Turnuvalar</p>
                <p className="text-2xl font-bold">{stats.activeTournaments}</p>
                    </div>
                    </div>
                  </div>

          {/* Hızlı İşlemler */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
                  <div className="space-y-3">
              <button className="w-full p-3 bg-rose-500 text-white rounded hover:bg-rose-600 flex items-center justify-center gap-2">
                Turnuva İptal Et
              </button>
              <button className="w-full p-3 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center justify-center gap-2">
                Eşleştirme Yap
              </button>
              <button className="w-full p-3 bg-lime-500 text-white rounded hover:bg-lime-600 flex items-center justify-center gap-2">
                Sonuç Girişi
              </button>
            </div>
            </div>

          {/* Ayarlar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Ayarlar</h2>
            <div className="space-y-3">
              <button className="w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center justify-center gap-2">
                Sistem Ayarları
              </button>
              <button className="w-full p-3 bg-teal-500 text-white rounded hover:bg-teal-600 flex items-center justify-center gap-2">
                Yetkilendirme
              </button>
              <button className="w-full p-3 bg-violet-500 text-white rounded hover:bg-violet-600 flex items-center justify-center gap-2">
                Yedekleme
              </button>
            </div>
                  </div>
                </div>
      </div>
    </div>
  );
}
