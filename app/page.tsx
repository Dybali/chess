import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Calendar, Star, ChevronRight, Play, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  let stats = {
    totalTournaments: 0,
    totalPlayers: 0,
    totalGames: 0,
    activeTournaments: 0,
  }

  // Supabase env var kontrolü: Banner'ı sadece eksikse göster
  const supabaseEnvConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  let supabaseConfigured = supabaseEnvConfigured
  let user = null

  try {
    // Env yoksa Supabase'e bağlanmayı denemeyelim
    if (supabaseEnvConfigured) {
      const supabase = await createClient()
      if (supabase) {
        supabaseConfigured = true

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        user = authUser

        const [tournamentsResult, playersResult, gamesResult, activeTournamentsResult] = await Promise.all([
          supabase.from("tournaments").select("*", { count: "exact", head: true }),
          supabase.from("players").select("*", { count: "exact", head: true }),
          supabase.from("games").select("*", { count: "exact", head: true }),
          supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "active"),
        ])

        stats = {
          totalTournaments: tournamentsResult.count || 0,
          totalPlayers: playersResult.count || 0,
          totalGames: gamesResult.count || 0,
          activeTournaments: activeTournamentsResult.count || 0,
        }
      }
    } else {
      stats = {
        totalTournaments: 3,
        totalPlayers: 16,
        totalGames: 24,
        activeTournaments: 1,
      }
    }
  } catch (error) {
    console.error("Supabase connection error:", error)
    stats = {
      totalTournaments: 3,
      totalPlayers: 16,
      totalGames: 24,
      activeTournaments: 1,
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">F</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FILECHESS</h1>
                <p className="text-xs text-muted-foreground">Satranç Turnuva Sistemi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/players">Oyuncular</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/tournaments">Turnuvalar</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
              {user ? (
                <div className="flex items-center gap-2">
                  <form action="/auth/signout" method="post">
                    <Button variant="outline" type="submit">
                      Çıkış
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Giriş
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Kayıt Ol
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            Profesyonel Turnuva Yönetimi
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Satranç, Sohbet, <span className="text-primary">Eğlence</span>
          </h2>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Modern ve kullanıcı dostu turnuva yönetim sistemi ile satranç topluluğunuzu organize edin. ELO puanları,
            otomatik eşleşmeler ve canlı sohbet özellikleri.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link href="/tournaments">
                    <Play className="w-5 h-5 mr-2" />
                    Turnuvalara Katıl
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
                  <Link href="/create-tournament">
                    Turnuva Oluştur
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link href="/register">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Hemen Başla
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
                  <Link href="/tournaments">
                    Turnuvaları Keşfet
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalTournaments}</div>
              <div className="text-muted-foreground">Toplam Turnuva</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalPlayers}</div>
              <div className="text-muted-foreground">Kayıtlı Oyuncu</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.totalGames}</div>
              <div className="text-muted-foreground">Oynanan Maç</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">{stats.activeTournaments}</div>
              <div className="text-muted-foreground">Aktif Turnuva</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-balance mb-4">Neden FILECHESS?</h3>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Hem fiziksel hem de online turnuvalar için tasarlanmış kapsamlı yönetim sistemi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>ELO Rating Sistemi</CardTitle>
                <CardDescription>
                  Otomatik ELO hesaplama ve güncelleme sistemi ile oyuncu seviyelerini takip edin
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Otomatik Eşleşme</CardTitle>
                <CardDescription>Swiss ve Round-Robin formatlarında otomatik tur eşleşmeleri</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Canlı Takip</CardTitle>
                <CardDescription>
                  Turnuva ilerlemesini canlı olarak takip edin ve sonuçları anında görün
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-3xl font-bold text-balance mb-6">Satranç Topluluğunuza Katılın</h3>
          <p className="text-xl text-foreground/80 text-balance mb-8">
            {user
              ? "Turnuvaları keşfedin ve satranç topluluğumuzun aktif bir üyesi olun."
              : "Hesap oluşturun ve satranç topluluğumuzun bir parçası olun."}
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            {user ? (
              <Link href="/tournaments">
                Turnuvaları Keşfet
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <Link href="/register">
                Ücretsiz Kayıt Ol
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">F</span>
              </div>
              <span className="font-semibold">FILECHESS</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">
                Hakkımızda
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                İletişim
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Gizlilik
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
