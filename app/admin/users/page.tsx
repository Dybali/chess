import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Search,
  Filter,
  Ban,
  Shield,
  Key,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

// Function to fetch users with their status and ban information
async function getUsers() {
  try {
    const supabase = createClient()
    const { data: users, error } = await supabase
      .from("players")
      .select(`
        *,
        user_bans!left (
          id,
          reason,
          banned_at,
          expires_at,
          is_active
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return users || []
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

// Function to get user management statistics
async function getUserStats() {
  try {
    const supabase = createClient()

    const { data: totalUsers } = await supabase.from("players").select("id", { count: "exact" })

    const { data: activeUsers } = await supabase.from("players").select("id", { count: "exact" }).eq("status", "active")

    const { data: bannedUsers } = await supabase
      .from("user_bans")
      .select("id", { count: "exact" })
      .eq("is_active", true)

    const { data: newUsersThisMonth } = await supabase
      .from("players")
      .select("id", { count: "exact" })
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    return {
      total: totalUsers?.length || 0,
      active: activeUsers?.length || 0,
      banned: bannedUsers?.length || 0,
      newThisMonth: newUsersThisMonth?.length || 0,
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return { total: 0, active: 0, banned: 0, newThisMonth: 0 }
  }
}

export default async function UserManagementPage() {
  const users = await getUsers()
  const userStats = await getUserStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">F</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">FILECHESS</h1>
                  <p className="text-xs text-muted-foreground">Kullanıcı Yönetimi</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/admin">Admin Panel</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Ana Sayfa</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">Kullanıcı hesaplarını yönetin, yasaklayın ve düzenleyin</p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.total}</div>
              <p className="text-xs text-muted-foreground">Kayıtlı kullanıcı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
              <p className="text-xs text-muted-foreground">Aktif hesap</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yasaklı Kullanıcı</CardTitle>
              <Ban className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{userStats.banned}</div>
              <p className="text-xs text-muted-foreground">Yasaklı hesap</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Yeni</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{userStats.newThisMonth}</div>
              <p className="text-xs text-muted-foreground">Yeni kayıt</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Kullanıcı Arama ve Filtreleme</CardTitle>
            <CardDescription>Kullanıcıları arayın ve filtreleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Kullanıcı adı, e-posta veya isim ara..." className="pl-10" />
                </div>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Durum filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="banned">Yasaklı</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Search className="w-4 h-4 mr-2" />
                Ara
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Listesi</CardTitle>
            <CardDescription>Tüm kayıtlı kullanıcılar ve yönetim seçenekleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length > 0 ? (
                users.map((user) => {
                  const isUserBanned = user.user_bans?.some((ban: any) => ban.is_active)
                  const activeBan = user.user_bans?.find((ban: any) => ban.is_active)

                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`/user-.png?height=48&width=48&query=${user.username}`} />
                          <AvatarFallback>
                            {user.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              @{user.username}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">ELO: {user.elo_rating}</span>
                            <span className="text-xs text-muted-foreground">Oyun: {user.games_played}</span>
                            <span className="text-xs text-muted-foreground">
                              Kayıt: {new Date(user.created_at).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        <Badge
                          variant={isUserBanned ? "destructive" : user.status === "active" ? "default" : "secondary"}
                        >
                          {isUserBanned ? "Yasaklı" : user.status === "active" ? "Aktif" : "Beklemede"}
                        </Badge>

                        {/* Action Buttons */}
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/players/${user.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>

                          {/* Edit User Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Kullanıcı Düzenle</DialogTitle>
                                <DialogDescription>{user.name} kullanıcısının bilgilerini düzenleyin</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="name" className="text-right">
                                    İsim
                                  </Label>
                                  <Input id="name" defaultValue={user.name} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="email" className="text-right">
                                    E-posta
                                  </Label>
                                  <Input id="email" defaultValue={user.email} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="elo" className="text-right">
                                    ELO
                                  </Label>
                                  <Input id="elo" type="number" defaultValue={user.elo_rating} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="status" className="text-right">
                                    Durum
                                  </Label>
                                  <Select defaultValue={user.status}>
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Aktif</SelectItem>
                                      <SelectItem value="pending">Beklemede</SelectItem>
                                      <SelectItem value="suspended">Askıya Alındı</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit">Kaydet</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Password Reset */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Key className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Şifre Sıfırla</DialogTitle>
                                <DialogDescription>
                                  {user.name} kullanıcısına şifre sıfırlama e-postası gönderilsin mi?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                  <Mail className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-blue-900">E-posta Gönderilecek</p>
                                    <p className="text-sm text-blue-700">{user.email}</p>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline">İptal</Button>
                                <Button>Şifre Sıfırlama Gönder</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Ban/Unban User */}
                          {!isUserBanned ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 bg-transparent"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Kullanıcıyı Yasakla</DialogTitle>
                                  <DialogDescription>
                                    {user.name} kullanıcısını yasaklamak istediğinizden emin misiniz?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="reason">Yasaklama Nedeni</Label>
                                    <Textarea
                                      id="reason"
                                      placeholder="Yasaklama nedenini açıklayın..."
                                      className="min-h-20"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="duration">Yasaklama Süresi</Label>
                                    <Select defaultValue="permanent">
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1day">1 Gün</SelectItem>
                                        <SelectItem value="1week">1 Hafta</SelectItem>
                                        <SelectItem value="1month">1 Ay</SelectItem>
                                        <SelectItem value="3months">3 Ay</SelectItem>
                                        <SelectItem value="permanent">Kalıcı</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline">İptal</Button>
                                  <Button variant="destructive">
                                    <Ban className="w-4 h-4 mr-2" />
                                    Kullanıcıyı Yasakla
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 bg-transparent"
                                >
                                  <Shield className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Yasağı Kaldır</DialogTitle>
                                  <DialogDescription>
                                    {user.name} kullanıcısının yasağını kaldırmak istediğinizden emin misiniz?
                                  </DialogDescription>
                                </DialogHeader>
                                {activeBan && (
                                  <div className="py-4">
                                    <div className="p-3 bg-red-50 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-red-900">Mevcut Yasak</span>
                                      </div>
                                      <p className="text-sm text-red-700 mb-1">
                                        <strong>Neden:</strong> {activeBan.reason}
                                      </p>
                                      <p className="text-sm text-red-700">
                                        <strong>Tarih:</strong>{" "}
                                        {new Date(activeBan.banned_at).toLocaleDateString("tr-TR")}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline">İptal</Button>
                                  <Button variant="default">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Yasağı Kaldır
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Kullanıcı bulunamadı</h3>
                  <p className="text-muted-foreground">
                    Henüz kayıtlı kullanıcı yok veya arama kriterlerinize uygun kullanıcı bulunamadı
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
