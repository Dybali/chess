"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Trophy,
  TrendingUp,
  BarChart3,
  UserCheck,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Table,
  Settings2,
  Bell,
  CheckCircle,
  Clock,
} from "lucide-react"
import { LiveNotifications } from "@/components/live-notifications"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { redirect } from "next/navigation"

// Admin koruması - sadece belirli e-postalar admin olabilir
const ADMIN_EMAILS = [
  "admin@filechess.com",
  "yönetici@filechess.com", 
  "admin@example.com" // Test için
]

// Mock admin data
const adminStats = {
  totalUsers: 821,
  activeUsers: 156,
  totalTournaments: 85,
  activeTournaments: 3,
  totalGames: 3873,
  todayGames: 24,
  revenue: 12500,
  monthlyRevenue: 2800,
}

const recentUsers = [
  { id: 1, name: "Ahmet Yılmaz", email: "ahmet@example.com", rating: 1850, joinDate: "2024-01-10", status: "active" },
  { id: 2, name: "Mehmet Kaya", email: "mehmet@example.com", rating: 1720, joinDate: "2024-01-09", status: "active" },
  { id: 3, name: "Ayşe Demir", email: "ayse@example.com", rating: 1680, joinDate: "2024-01-08", status: "pending" },
]

const recentTournaments = [
  {
    id: 1,
    name: "Haftalık Hızlı Turnuva",
    participants: 24,
    status: "active",
    date: "2024-01-15",
    currentRound: 3,
    totalRounds: 7,
    tables: 12,
  },
  {
    id: 2,
    name: "Aylık Klasik Turnuva",
    participants: 16,
    status: "completed",
    date: "2024-01-10",
    currentRound: 7,
    totalRounds: 7,
    tables: 8,
  },
  {
    id: 3,
    name: "Yeni Başlayanlar",
    participants: 8,
    status: "pending",
    date: "2024-01-20",
    currentRound: 0,
    totalRounds: 5,
    tables: 4,
  },
]

// Mock system alerts data
const systemAlerts = [
  { id: 1, type: "warning", message: "Disk alanı %80 dolu", time: "15:30" },
  { id: 2, type: "info", message: "Yeni güncelleme mevcut", time: "14:45" },
  { id: 3, type: "error", message: "Sunucu hatası", time: "13:10" },
]

// Function to fetch real notifications from database
async function getNotifications() {
  try {
    const supabase = createClient()
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) throw error
    return notifications || []
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

// Function to get notification stats
async function getNotificationStats() {
  try {
    const supabase = createClient()
    const { data: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("is_read", false)

    const { data: todayCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .gte("created_at", new Date().toISOString().split("T")[0])

    return {
      unread: unreadCount?.length || 0,
      today: todayCount?.length || 0,
    }
  } catch (error) {
    console.error("Error fetching notification stats:", error)
    return { unread: 0, today: 0 }
  }
}

// Function to get real user data
async function getRealUsers() {
  try {
    const supabase = createClient()
    const { data: users, error } = await supabase
      .from("players")
      .select("id, name, email, elo_rating, created_at")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) throw error
    return users || []
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

// Function to get real tournament data
async function getRealTournaments() {
  try {
    const supabase = createClient()
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select(`
        id, 
        name, 
        status, 
        created_at,
        max_participants,
        tournament_participants(count)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) throw error
    return tournaments || []
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return []
  }
}

// Function to get real stats
async function getRealStats() {
  try {
    const supabase = createClient()
    
    // Get user count
    const { count: userCount } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })

    // Get tournament count
    const { count: tournamentCount } = await supabase
      .from("tournaments")
      .select("*", { count: "exact", head: true })

    // Get active tournament count
    const { count: activeTournamentCount } = await supabase
      .from("tournaments")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Get games count
    const { count: gamesCount } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true })

    return {
      totalUsers: userCount || 0,
      totalTournaments: tournamentCount || 0,
      activeTournaments: activeTournamentCount || 0,
      totalGames: gamesCount || 0,
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      totalUsers: 0,
      totalTournaments: 0,
      activeTournaments: 0,
      totalGames: 0,
    }
  }
}

export default function AdminDashboard() {
  const [notifications, setNotifications] = useState([])
  const [notificationStats, setNotificationStats] = useState({ unread: 0, today: 0 })
  const [realUsers, setRealUsers] = useState([])
  const [realTournaments, setRealTournaments] = useState([])
  const [realStats, setRealStats] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    activeTournaments: 0,
    totalGames: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [notificationsData, statsData, usersData, tournamentsData, realStatsData] = await Promise.all([
          getNotifications(),
          getNotificationStats(),
          getRealUsers(),
          getRealTournaments(),
          getRealStats()
        ])
        
        setNotifications(notificationsData)
        setNotificationStats(statsData)
        setRealUsers(usersData)
        setRealTournaments(tournamentsData)
        setRealStats(realStatsData)
      } catch (error) {
        console.error("Error loading admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Admin verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">F</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">FILECHESS</h1>
                  <p className="text-xs text-muted-foreground">Admin Paneli</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <LiveNotifications />
              <Button variant="ghost" asChild>
                <Link href="/">Ana Sayfa</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/tournaments">Turnuvalar</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/players">Oyuncular</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">FILECHESS sistem yönetimi ve istatistikleri</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{realUsers.length}</span> son kayıt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Turnuva</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realStats.totalTournaments}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">{realStats.activeTournaments}</span> aktif turnuva
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Oyun</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realStats.totalGames}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">Oynanan</span> toplam oyun
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem Durumu</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Aktif</div>
              <p className="text-xs text-muted-foreground">Sistem çalışıyor</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-1" />
              Bildirimler
              {notificationStats.unread > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1">
                  {notificationStats.unread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tournaments">Turnuvalar</TabsTrigger>
            <TabsTrigger value="tables">Masa Yönetimi</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="reports">Raporlar</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>

          {/* New Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Bildirimler</h2>
                <p className="text-muted-foreground">Sistem bildirimleri ve kullanıcı aktiviteleri</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Tümünü Okundu İşaretle
                </Button>
              </div>
            </div>

            {/* Notification Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Okunmamış
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{notificationStats.unread}</div>
                  <p className="text-sm text-muted-foreground">Bekleyen bildirim</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    Bugün
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">{notificationStats.today}</div>
                  <p className="text-sm text-muted-foreground">Bugünkü bildirimler</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                    Toplam
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-600 mb-2">{notifications.length}</div>
                  <p className="text-sm text-muted-foreground">Son bildirimler</p>
                </CardContent>
              </Card>
            </div>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <CardTitle>Son Bildirimler</CardTitle>
                <CardDescription>Sistem ve kullanıcı aktivite bildirimleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${
                          !notification.is_read ? "bg-blue-50 border-blue-200" : "bg-background"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {notification.type === "user_registration" && (
                            <UserCheck className="w-5 h-5 text-green-600" />
                          )}
                          {notification.type === "tournament_created" && <Trophy className="w-5 h-5 text-blue-600" />}
                          {notification.type === "tournament_completed" && (
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          )}
                          {!["user_registration", "tournament_created", "tournament_completed"].includes(
                            notification.type,
                          ) && <Bell className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.created_at).toLocaleString("tr-TR")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {!notification.is_read && (
                                <Badge variant="default" className="text-xs">
                                  Yeni
                                </Badge>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Henüz bildirim yok</h3>
                      <p className="text-muted-foreground">
                        Sistem aktiviteleri ve kullanıcı eylemleri burada görünecek
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Son Kayıt Olan Kullanıcılar</CardTitle>
                  <CardDescription>En son sisteme katılan oyuncular</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realUsers.length > 0 ? realUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`/user-.png?height=32&width=32&query=user+${user.id}`} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name || "İsimsiz Oyuncu"}</p>
                            <p className="text-sm text-muted-foreground">{user.email || "E-posta yok"}</p>
                            <p className="text-xs text-muted-foreground">ELO: {user.elo_rating}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default">Aktif</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(user.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Henüz kullanıcı kaydı yok</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Tournaments */}
              <Card>
                <CardHeader>
                  <CardTitle>Son Turnuvalar</CardTitle>
                  <CardDescription>Yakın zamanda oluşturulan turnuvalar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realTournaments.length > 0 ? realTournaments.map((tournament) => (
                      <div key={tournament.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tournament.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tournament.tournament_participants?.[0]?.count || 0} katılımcı • {new Date(tournament.created_at).toLocaleDateString('tr-TR')}
                          </p>
                          <p className="text-xs text-muted-foreground">Max: {tournament.max_participants} kişi</p>
                        </div>
                        <Badge
                          variant={
                            tournament.status === "active"
                              ? "default"
                              : tournament.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {tournament.status === "active"
                            ? "Aktif"
                            : tournament.status === "completed"
                              ? "Tamamlandı"
                              : tournament.status === "upcoming"
                                ? "Yaklaşan"
                                : "Beklemede"}
                        </Badge>
                      </div>
                    )) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Henüz turnuva oluşturulmamış</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Sistem Uyarıları</CardTitle>
                <CardDescription>Önemli sistem bildirimleri ve uyarılar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      {alert.type === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      {alert.type === "info" && <UserCheck className="w-5 h-5 text-blue-500" />}
                      {alert.type === "error" && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      <div className="flex-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Turnuva Yönetimi</h2>
                <p className="text-muted-foreground">Turnuvaları oluşturun, düzenleyin ve yönetin</p>
              </div>
              <Button asChild>
                <Link href="/create-tournament">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Turnuva
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Aktif Turnuvalar</CardTitle>
                <CardDescription>Şu anda devam eden turnuvalar ve masa durumları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realTournaments.length > 0 ? realTournaments.map((tournament) => (
                    <div key={tournament.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Trophy className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tournament.tournament_participants?.[0]?.count || 0} katılımcı • Max: {tournament.max_participants} kişi
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tournament.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tournament.status === "active"
                              ? "default"
                              : tournament.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {tournament.status === "active"
                            ? "Aktif"
                            : tournament.status === "completed"
                              ? "Tamamlandı"
                              : tournament.status === "upcoming"
                                ? "Yaklaşan"
                                : "Beklemede"}
                        </Badge>
                        {tournament.status === "active" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/tournaments/${tournament.id}/tables`}>
                              <Table className="w-4 h-4 mr-1" />
                              Masa Yönetimi
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tournaments/${tournament.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Görüntüle
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Henüz turnuva yok</h3>
                      <p className="text-muted-foreground">
                        Turnuvalar oluşturuldukça burada görünecek
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Masa Dinamiği Yönetimi</h2>
              <p className="text-muted-foreground">Turnuva masa sistemini yönetin ve sonuçları girin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Aktif Masalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-chess-green mb-2">24</div>
                  <p className="text-sm text-muted-foreground">Şu anda oynanıyor</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Bekleyen Sonuçlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">8</div>
                  <p className="text-sm text-muted-foreground">Sonuç girilmesi gereken</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Tamamlanan Turlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">15</div>
                  <p className="text-sm text-muted-foreground">Bu hafta tamamlanan</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Aktif Turnuva Masaları</CardTitle>
                <CardDescription>Devam eden turnuvalardaki masa durumları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentTournaments
                    .filter((t) => t.status === "active")
                    .map((tournament) => (
                      <div key={tournament.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{tournament.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Tur {tournament.currentRound}/{tournament.totalRounds} • {tournament.tables} masa
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" asChild>
                              <Link href={`/tournaments/${tournament.id}/tables`}>
                                <Table className="w-4 h-4 mr-1" />
                                Masa Detayları
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings2 className="w-4 h-4 mr-1" />
                              Sonuç Gir
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {Array.from({ length: Math.min(tournament.tables, 4) }, (_, i) => (
                            <div key={i} className="bg-muted/50 p-3 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Masa {i + 1}</span>
                                <Badge variant={i < 2 ? "default" : "secondary"} className="text-xs">
                                  {i < 2 ? "Oynanıyor" : "Bekliyor"}
                                </Badge>
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span>Beyaz:</span>
                                  <span className="font-medium">Oyuncu {i * 2 + 1}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Siyah:</span>
                                  <span className="font-medium">Oyuncu {i * 2 + 2}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {tournament.tables > 4 && (
                            <div className="bg-muted/30 p-3 rounded border border-dashed flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">+{tournament.tables - 4} masa daha</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Masa Dinamiği Kuralları</CardTitle>
                <CardDescription>Sistem tarafından uygulanan masa geçiş kuralları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-chess-green">Kazanan Oyuncu</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Bir üst masaya çıkar (Masa 5 → Masa 4)</li>
                      <li>• Masa 1 kazananı Masa 1'de kalır</li>
                      <li>• ELO puanı artırılır</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-600">Kaybeden Oyuncu</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Bir alt masaya düşer (Masa 4 → Masa 5)</li>
                      <li>• En alt masa kaybedeni aynı masada kalır</li>
                      <li>• ELO puanı azaltılır</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Kullanıcı Yönetimi</h2>
              <p className="text-muted-foreground">Kayıtlı kullanıcıları görüntüleyin ve yönetin</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı İstatistikleri</CardTitle>
                <CardDescription>Kullanıcı aktivite özeti</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">156</div>
                    <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                    <Progress value={75} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">45</div>
                    <p className="text-sm text-muted-foreground">Yeni Kayıt (Bu Ay)</p>
                    <Progress value={60} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">12</div>
                    <p className="text-sm text-muted-foreground">Bekleyen Onay</p>
                    <Progress value={20} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Son Kullanıcılar</CardTitle>
                <CardDescription>En son kayıt olan kullanıcılar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realUsers.length > 0 ? realUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={`/user-.png?height=40&width=40&query=user+${user.id}`} />
                          <AvatarFallback>
                            {user.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{user.name || "İsimsiz Oyuncu"}</h3>
                          <p className="text-sm text-muted-foreground">{user.email || "E-posta yok"}</p>
                          <p className="text-xs text-muted-foreground">ELO: {user.elo_rating}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Aktif</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Profil
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Henüz kullanıcı yok</h3>
                      <p className="text-muted-foreground">
                        Kullanıcılar sisteme kayıt oldukça burada görünecek
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Raporlar ve Analitik</h2>
              <p className="text-muted-foreground">Sistem performansı ve kullanım istatistikleri</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aylık Büyüme</CardTitle>
                  <CardDescription>Son 6 ayın kullanıcı ve turnuva büyümesi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Kullanıcı Büyümesi</span>
                      <span className="text-sm font-medium text-green-600">+15.2%</span>
                    </div>
                    <Progress value={85} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Turnuva Aktivitesi</span>
                      <span className="text-sm font-medium text-blue-600">+8.7%</span>
                    </div>
                    <Progress value={65} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Gelir Artışı</span>
                      <span className="text-sm font-medium text-purple-600">+22.1%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popüler Turnuva Formatları</CardTitle>
                  <CardDescription>En çok tercih edilen turnuva türleri</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Swiss System</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Round-Robin</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <Progress value={35} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Eleme</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <Progress value={20} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Sistem Ayarları</h2>
              <p className="text-muted-foreground">Platform konfigürasyonu ve genel ayarlar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Genel Ayarlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Yeni Kayıtlar</p>
                      <p className="text-sm text-muted-foreground">Yeni kullanıcı kayıtlarına izin ver</p>
                    </div>
                    <Badge variant="default">Açık</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Turnuva Oluşturma</p>
                      <p className="text-sm text-muted-foreground">Kullanıcıların turnuva oluşturmasına izin ver</p>
                    </div>
                    <Badge variant="default">Açık</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Bakım Modu</p>
                      <p className="text-sm text-muted-foreground">Sistem bakım modunda</p>
                    </div>
                    <Badge variant="outline">Kapalı</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Rating Sistemi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Başlangıç Rating</p>
                      <p className="text-sm text-muted-foreground">Yeni oyuncular için başlangıç puanı</p>
                    </div>
                    <span className="font-medium">1200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">K-Faktörü</p>
                      <p className="text-sm text-muted-foreground">Rating değişim katsayısı</p>
                    </div>
                    <span className="font-medium">32</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Minimum Rating</p>
                      <p className="text-sm text-muted-foreground">En düşük rating değeri</p>
                    </div>
                    <span className="font-medium">800</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sistem Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
                    <p className="text-sm text-muted-foreground">Sistem Uptime</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">1.2GB</div>
                    <p className="text-sm text-muted-foreground">Veritabanı Boyutu</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">v2.1.0</div>
                    <p className="text-sm text-muted-foreground">Platform Sürümü</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
