import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Users, Trophy, Filter } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

// Function to fetch tournaments for calendar
async function getCalendarTournaments() {
  try {
    const supabase = createClient()
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        tournament_participants(count)
      `)
      .gte("start_date", new Date().toISOString().split("T")[0])
      .order("start_date", { ascending: true })

    if (error) throw error
    return tournaments || []
  } catch (error) {
    console.error("Error fetching calendar tournaments:", error)
    return []
  }
}

// Function to get current month tournaments
function getCurrentMonthTournaments(tournaments: any[], currentDate: Date) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  return tournaments.filter((tournament) => {
    const tournamentDate = new Date(tournament.start_date)
    return tournamentDate.getFullYear() === year && tournamentDate.getMonth() === month
  })
}

// Function to generate calendar days
function generateCalendarDays(currentDate: Date) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days = []
  const current = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

export default async function CalendarPage() {
  const tournaments = await getCalendarTournaments()
  const currentDate = new Date()
  const currentMonthTournaments = getCurrentMonthTournaments(tournaments, currentDate)
  const calendarDays = generateCalendarDays(currentDate)

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ]

  const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"]

  // Get tournaments for a specific day
  const getTournamentsForDay = (day: Date) => {
    return currentMonthTournaments.filter((tournament) => {
      const tournamentDate = new Date(tournament.start_date)
      return (
        tournamentDate.getDate() === day.getDate() &&
        tournamentDate.getMonth() === day.getMonth() &&
        tournamentDate.getFullYear() === day.getFullYear()
      )
    })
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
                  <p className="text-xs text-muted-foreground">Turnuva Takvimi</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance mb-2">Turnuva Takvimi</h1>
            <p className="text-muted-foreground">Yaklaşan turnuvaları görüntüleyin ve planlayın</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrele
            </Button>
            <Button asChild>
              <Link href="/create-tournament">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Turnuva
              </Link>
            </Button>
          </div>
        </div>

        {/* Calendar Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMonthTournaments.length}</div>
              <p className="text-xs text-muted-foreground">Turnuva planlandı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yaklaşan</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  tournaments.filter((t) => new Date(t.start_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Bu hafta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Katılımcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMonthTournaments.reduce((sum, t) => sum + (t.tournament_participants?.[0]?.count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Bu ay kayıtlı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Turnuva</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tournaments.filter((t) => t.status === "active").length}</div>
              <p className="text-xs text-muted-foreground">Şu anda devam eden</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Views */}
        <Tabs defaultValue="month" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="month">Aylık Görünüm</TabsTrigger>
              <TabsTrigger value="week">Haftalık Görünüm</TabsTrigger>
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-48 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Monthly Calendar View */}
          <TabsContent value="month">
            <Card>
              <CardHeader>
                <CardTitle>Aylık Takvim</CardTitle>
                <CardDescription>Turnuvaları aylık takvim görünümünde inceleyin</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Day Headers */}
                  {dayNames.map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground border-b">
                      {day.slice(0, 3)}
                    </div>
                  ))}

                  {/* Calendar Days */}
                  {calendarDays.map((day, index) => {
                    const dayTournaments = getTournamentsForDay(day)
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                    const isToday =
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear()

                    return (
                      <div
                        key={index}
                        className={`min-h-24 p-1 border border-border/50 ${
                          !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
                        } ${isToday ? "bg-primary/10 border-primary" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>{day.getDate()}</span>
                        </div>
                        <div className="space-y-1">
                          {dayTournaments.slice(0, 2).map((tournament) => (
                            <Dialog key={tournament.id}>
                              <DialogTrigger asChild>
                                <div className="text-xs p-1 bg-primary/20 text-primary rounded cursor-pointer hover:bg-primary/30 transition-colors">
                                  <div className="font-medium truncate">{tournament.name}</div>
                                  <div className="text-xs opacity-75">
                                    {tournament.tournament_participants?.[0]?.count || 0} katılımcı
                                  </div>
                                </div>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{tournament.name}</DialogTitle>
                                  <DialogDescription>Turnuva detayları ve bilgileri</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium">Başlangıç Tarihi</p>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(tournament.start_date).toLocaleDateString("tr-TR")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Bitiş Tarihi</p>
                                      <p className="text-sm text-muted-foreground">
                                        {tournament.end_date
                                          ? new Date(tournament.end_date).toLocaleDateString("tr-TR")
                                          : "Belirsiz"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium">Katılımcı Sayısı</p>
                                      <p className="text-sm text-muted-foreground">
                                        {tournament.tournament_participants?.[0]?.count || 0} /{" "}
                                        {tournament.max_participants}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Durum</p>
                                      <Badge variant={tournament.status === "active" ? "default" : "secondary"}>
                                        {tournament.status === "active"
                                          ? "Aktif"
                                          : tournament.status === "pending"
                                            ? "Beklemede"
                                            : "Tamamlandı"}
                                      </Badge>
                                    </div>
                                  </div>
                                  {tournament.description && (
                                    <div>
                                      <p className="text-sm font-medium">Açıklama</p>
                                      <p className="text-sm text-muted-foreground">{tournament.description}</p>
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <Button asChild>
                                      <Link href={`/tournaments/${tournament.id}`}>Turnuvayı Görüntüle</Link>
                                    </Button>
                                    {tournament.status === "pending" && (
                                      <Button variant="outline" asChild>
                                        <Link href={`/tournaments/${tournament.id}/register`}>Katıl</Link>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ))}
                          {dayTournaments.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayTournaments.length - 2} daha
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly View */}
          <TabsContent value="week">
            <Card>
              <CardHeader>
                <CardTitle>Haftalık Görünüm</CardTitle>
                <CardDescription>Bu haftanın turnuva programı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = new Date()
                    day.setDate(day.getDate() - day.getDay() + i)
                    const dayTournaments = getTournamentsForDay(day)

                    return (
                      <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="text-center min-w-16">
                          <div className="text-sm font-medium">{dayNames[i].slice(0, 3)}</div>
                          <div className="text-2xl font-bold">{day.getDate()}</div>
                          <div className="text-xs text-muted-foreground">{monthNames[day.getMonth()].slice(0, 3)}</div>
                        </div>
                        <div className="flex-1">
                          {dayTournaments.length > 0 ? (
                            <div className="space-y-2">
                              {dayTournaments.map((tournament) => (
                                <div
                                  key={tournament.id}
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded"
                                >
                                  <div>
                                    <h4 className="font-medium">{tournament.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {tournament.tournament_participants?.[0]?.count || 0} katılımcı •{" "}
                                      {tournament.tournament_type}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={tournament.status === "active" ? "default" : "secondary"}>
                                      {tournament.status === "active"
                                        ? "Aktif"
                                        : tournament.status === "pending"
                                          ? "Beklemede"
                                          : "Tamamlandı"}
                                    </Badge>
                                    <Button size="sm" variant="outline" asChild>
                                      <Link href={`/tournaments/${tournament.id}`}>Görüntüle</Link>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Bu gün için turnuva planlanmamış</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Yaklaşan Turnuvalar</CardTitle>
                <CardDescription>Tüm yaklaşan turnuvaların listesi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournaments.length > 0 ? (
                    tournaments.map((tournament) => (
                      <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-16">
                            <div className="text-sm font-medium text-muted-foreground">
                              {new Date(tournament.start_date).toLocaleDateString("tr-TR", { month: "short" })}
                            </div>
                            <div className="text-2xl font-bold">{new Date(tournament.start_date).getDate()}</div>
                          </div>
                          <div>
                            <h3 className="font-semibold">{tournament.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {tournament.tournament_participants?.[0]?.count || 0} / {tournament.max_participants}{" "}
                              katılımcı • {tournament.tournament_type}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(tournament.start_date).toLocaleDateString("tr-TR", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              tournament.status === "active"
                                ? "default"
                                : tournament.status === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {tournament.status === "active"
                              ? "Aktif"
                              : tournament.status === "pending"
                                ? "Beklemede"
                                : "Tamamlandı"}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/tournaments/${tournament.id}`}>Görüntüle</Link>
                          </Button>
                          {tournament.status === "pending" && (
                            <Button size="sm" asChild>
                              <Link href={`/tournaments/${tournament.id}/register`}>Katıl</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Yaklaşan turnuva yok</h3>
                      <p className="text-muted-foreground mb-4">
                        Henüz planlanmış turnuva bulunmuyor. Yeni bir turnuva oluşturun.
                      </p>
                      <Button asChild>
                        <Link href="/create-tournament">
                          <Plus className="w-4 h-4 mr-2" />
                          İlk Turnuvayı Oluştur
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
