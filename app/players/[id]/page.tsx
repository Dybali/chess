import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Trophy, Calendar, Target, TrendingUp, Medal, Award, Crown } from "lucide-react"
import Link from "next/link"
import AppHeaderClient from "@/components/app-header-client"
import { createClient } from "@/lib/supabase/server"

type Player = {
  id: string
  name: string
  email: string | null
  elo_rating: number | null
  games_played: number | null
  wins: number | null
  losses: number | null
  draws: number | null
  created_at: string | null
}

type RecentGame = {
  id: string
  opponentName: string
  opponentRating: number | null
  resultText: "Kazandı" | "Kaybetti" | "Berabere"
  color: "Beyaz" | "Siyah"
  date: string
  tournamentName: string | null
}

type PlayerTournament = {
  id: string
  name: string
  startDate: string | null
  status: string
}

type RatingEntry = {
  date: string
  rating: number
}

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  let player: Player | null = null
  let error: string | null = null
  let recentGames: RecentGame[] = []
  let playerTournaments: PlayerTournament[] = []
  let ratingHistory: RatingEntry[] = []

  if (supabase) {
    const { data, error: err } = await supabase
      .from("players")
      .select("id, name, email, elo_rating, games_played, wins, losses, draws, created_at")
      .eq("id", params.id)
      .maybeSingle()

    if (err) {
      error = err.message
    } else if (data) {
      player = data as Player
      const gamesResponse = await supabase
        .from("games")
        .select(
          "id, tournament_id, white_player_id, black_player_id, result, played_at, tournaments:tournament_id (name)"
        )
        .or(`white_player_id.eq.${params.id},black_player_id.eq.${params.id}`)
        .order("played_at", { ascending: false })
        .limit(10)

      let opponentIds = new Set<string>()

      if (!gamesResponse.error && gamesResponse.data) {
        const gameRows = gamesResponse.data as any[]

        recentGames = gameRows.map((game: any) => {
          const isWhite = game.white_player_id === params.id
          const opponentId = isWhite ? game.black_player_id : game.white_player_id
          if (opponentId) opponentIds.add(opponentId)

          let resultText: "Kazandı" | "Kaybetti" | "Berabere" = "Berabere"
          if (game.result === "1-0") {
            resultText = isWhite ? "Kazandı" : "Kaybetti"
          } else if (game.result === "0-1") {
            resultText = isWhite ? "Kaybetti" : "Kazandı"
          }

          return {
            id: game.id,
            opponentId,
            opponentName: opponentId,
            opponentRating: null,
            resultText,
            color: isWhite ? "Beyaz" : "Siyah",
            date: game.played_at ? new Date(game.played_at).toLocaleDateString("tr-TR") : "-",
            tournamentName: game.tournaments?.name ?? null,
          }
        })

        if (opponentIds.size > 0) {
          const { data: opponentPlayers } = await supabase
            .from("players")
            .select("id, name, elo_rating")
            .in("id", Array.from(opponentIds))

          const opponentMap = new Map<string, { name: string | null; elo_rating: number | null }>()
          opponentPlayers?.forEach((p: any) => opponentMap.set(p.id, p))

          recentGames = recentGames.map((game: any) => {
            const info = opponentMap.get(game.opponentId || "")
            return {
              ...game,
              opponentName: info?.name || "Bilinmeyen Oyuncu",
              opponentRating: info?.elo_rating ?? null,
            }
          })
        }

        const chronological = gameRows
          .filter((g: any) => g.played_at)
          .sort((a: any, b: any) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())

        let runningRating = player?.elo_rating ?? 1200
        ratingHistory = chronological.map((g: any) => {
          const isWhite = g.white_player_id === params.id
          if (g.result === "1-0") {
            runningRating += isWhite ? 5 : -5
          } else if (g.result === "0-1") {
            runningRating += isWhite ? -5 : 5
          }
          return {
            date: new Date(g.played_at).toLocaleDateString("tr-TR"),
            rating: Math.max(0, runningRating),
          }
        })
      }

      const tournamentsResponse = await supabase
        .from("tournament_participants")
        .select("tournament_id, tournaments:tournament_id (id, name, start_date, status)")
        .eq("player_id", params.id)
        .order("registered_at", { ascending: false })

      if (!tournamentsResponse.error && tournamentsResponse.data) {
        playerTournaments = tournamentsResponse.data
          .map((row: any) => row.tournaments)
          .filter(Boolean)
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            startDate: t.start_date,
            status: t.status,
          }))
      }
    }
  } else {
    error = "Supabase yapılandırması bulunamadı"
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        {/* @ts-expect-error Async Server Component */}
        <AppHeader subtitle="Satranç Turnuva Sistemi" />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Oyuncu bulunamadı</h1>
          {error && <p className="text-sm text-muted-foreground mb-6">{error}</p>}
          <Button asChild>
            <Link href="/players">Oyunculara Dön</Link>
          </Button>
        </div>
      </div>
    )
  }

  const totalGames = player.games_played ?? 0
  const wins = player.wins ?? 0
  const draws = player.draws ?? 0
  const losses = player.losses ?? 0
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
  const tournamentsPlayed = playerTournaments.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* @ts-expect-error Async Server Component */}
      <AppHeader subtitle="Oyuncu Profili" />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/players">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Oyunculara Dön
          </Link>
        </Button>

        {/* Player Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={`/placeholder.svg?height=128&width=128&query=chess+grandmaster`} />
                <AvatarFallback className="text-2xl">
                  {player.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{player.name}</h1>
                </div>
                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Güncel Rating</p>
                    <p className="text-2xl font-bold text-primary">{player.elo_rating ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">En Yüksek Rating</p>
                    <p className="text-xl font-semibold">{player.elo_rating ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kazanma Oranı</p>
                    <p className="text-xl font-semibold">{winRate}%</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sisteme katılım tarihi: {player.created_at ? new Date(player.created_at).toLocaleDateString("tr-TR") : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">İstatistikler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{wins}</p>
                    <p className="text-muted-foreground">Galibiyet</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{draws}</p>
                    <p className="text-muted-foreground">Berabere</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{losses}</p>
                    <p className="text-muted-foreground">Mağlubiyet</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{totalGames}</p>
                    <p className="text-muted-foreground">Toplam</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kazanma Oranı</span>
                    <span className="font-medium">{winRate}%</span>
                  </div>
                  <Progress value={winRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Turnuva Başarıları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Katıldığı Turnuvalar</span>
                  <span className="font-semibold">{tournamentsPlayed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Galibiyet Oranı</span>
                  <span className="font-semibold">{winRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Detaylı turnuva sonuç bilgileri yakında eklenecek.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Player Content */}
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="games">Son Oyunlar</TabsTrigger>
            <TabsTrigger value="tournaments">Turnuvalar</TabsTrigger>
            <TabsTrigger value="rating">Rating Geçmişi</TabsTrigger>
            <TabsTrigger value="achievements">Başarılar</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Son Oyunlar</CardTitle>
                <CardDescription>En son oynanan maçlar</CardDescription>
              </CardHeader>
              <CardContent>
                {recentGames.length > 0 ? (
                  <div className="space-y-4">
                    {recentGames.map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              game.resultText === "Kazandı"
                                ? "bg-green-500"
                                : game.resultText === "Berabere"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{game.opponentName}</span>
                              {game.opponentRating && (
                                <Badge variant="outline" className="text-xs">
                                  {game.opponentRating}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {game.tournamentName || "Turnuva bilgisi yok"} • {game.date}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                game.resultText === "Kazandı"
                                  ? "text-green-600"
                                  : game.resultText === "Berabere"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {game.resultText}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {game.color}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">Rating değişimi: -</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Oyuncunun kayıtlı bir oyunu bulunmuyor.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Turnuva Geçmişi</CardTitle>
                <CardDescription>Katıldığı turnuvalar ve sonuçları</CardDescription>
              </CardHeader>
              <CardContent>
                {playerTournaments.length > 0 ? (
                  <div className="space-y-4">
                    {playerTournaments.map((tournament) => (
                      <div key={tournament.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div>
                            <h3 className="font-medium">{tournament.name}</h3>
                            <div className="text-sm text-muted-foreground">
                              {tournament.startDate
                                ? new Date(tournament.startDate).toLocaleDateString("tr-TR")
                                : "Tarih belirtilmemiş"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Durum: {tournament.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Oyuncu henüz herhangi bir turnuvaya katılmadı.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rating" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rating Geçmişi</CardTitle>
                <CardDescription>Rating değişim grafiği</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Güncel Rating</p>
                      <p className="text-2xl font-bold">{player.elo_rating ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Oyun</p>
                      <p className="text-xl font-semibold">{totalGames}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Galibiyet Oranı</p>
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">{winRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ratingHistory.length > 0 ? (
                      ratingHistory.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded">
                          <span className="text-sm">{entry.date}</span>
                          <span className="font-medium">{entry.rating}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Rating geçmişi için yeterli veri bulunamadı.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Başarılar ve Rozetler</CardTitle>
                <CardDescription>Kazanılan başarılar ve özel rozetler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <div>
                      <h3 className="font-medium">Turnuva Şampiyonu</h3>
                      <p className="text-sm text-muted-foreground">3 turnuva kazandı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <Target className="w-8 h-8 text-green-500" />
                    <div>
                      <h3 className="font-medium">100 Galibiyet</h3>
                      <p className="text-sm text-muted-foreground">100 oyun kazandı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Rating 1800+</h3>
                      <p className="text-sm text-muted-foreground">1800+ rating elde etti</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <Calendar className="w-8 h-8 text-purple-500" />
                    <div>
                      <h3 className="font-medium">Aktif Oyuncu</h3>
                      <p className="text-sm text-muted-foreground">12 turnuvaya katıldı</p>
                    </div>
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
