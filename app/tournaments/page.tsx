import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Users, Trophy, Search, Plus } from "lucide-react"
import Link from "next/link"
import AppHeaderClient from "@/components/app-header-client"
import { createClient } from "@/lib/supabase/server"

export default async function TournamentsPage() {
  let tournaments: any[] = []

  try {
    const supabase = await createClient()

    if (supabase) {
      const { data: supabaseTournaments, error } = await supabase
        .from("tournaments")
        .select(`
          *,
          tournament_participants(count)
        `)
        .order("created_at", { ascending: false })

      if (!error && supabaseTournaments) {
        tournaments = supabaseTournaments
      } else {
        console.error("Error fetching tournaments:", error)
      }
    }
  } catch (error) {
    console.error("Supabase connection error:", error)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return { variant: "default" as const, text: "Kayıt Açık" }
      case "active":
        return { variant: "secondary" as const, text: "Devam Ediyor" }
      case "completed":
        return { variant: "outline" as const, text: "Tamamlandı" }
      case "cancelled":
        return { variant: "destructive" as const, text: "İptal Edildi" }
      default:
        return { variant: "outline" as const, text: "Bilinmiyor" }
    }
  }

  return (
    <div className="min-h-screen bg-background">
              {/* Header */}
              <AppHeaderClient subtitle="Satranç Turnuva Sistemi" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance">Turnuvalar</h1>
            <p className="text-muted-foreground">Aktif turnuvalara katılın veya yeni turnuva oluşturun</p>
          </div>
          <Button asChild>
            <Link href="/create-tournament">
              <Plus className="w-4 h-4 mr-2" />
              Turnuva Oluştur
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Turnuva ara..." className="pl-10" />
          </div>
          <Select>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Formatlar</SelectItem>
              <SelectItem value="swiss">Swiss</SelectItem>
              <SelectItem value="round_robin">Round-Robin</SelectItem>
              <SelectItem value="elimination">Eleme</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="upcoming">Kayıt Açık</SelectItem>
              <SelectItem value="active">Devam Ediyor</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tournament Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments?.map((tournament) => {
            const statusBadge = getStatusBadge(tournament.status)
            const participantCount = tournament.tournament_participants?.[0]?.count || 0

            return (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      {tournament.start_date ? formatDate(tournament.start_date) : "Tarih belirtilmemiş"}
                      <Clock className="w-4 h-4 ml-2" />
                      {tournament.start_date ? formatTime(tournament.start_date) : "--:--"}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {participantCount}/{tournament.max_participants}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <span>{tournament.prize_pool ? `${tournament.prize_pool} TL` : "Ödül yok"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Format: {tournament.tournament_type}</span>
                    <span>
                      Tur: {tournament.current_round}/{tournament.total_rounds}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <Link href={`/tournaments/${tournament.id}`}>Detaylar</Link>
                    </Button>
                    {tournament.status === "upcoming" && (
                      <Button variant="outline" className="flex-1 bg-transparent">
                        Katıl
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {(!tournaments || tournaments.length === 0) && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Henüz turnuva yok</h3>
            <p className="text-muted-foreground mb-6">İlk turnuvayı siz oluşturun!</p>
            <Button asChild>
              <Link href="/create-tournament">
                <Plus className="w-4 h-4 mr-2" />
                Turnuva Oluştur
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
