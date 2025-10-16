export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Crown, Medal, Award } from "lucide-react"
import Link from "next/link"
import AppHeaderClient from "@/components/app-header-client"
import { createClient } from "@/lib/supabase/server"

type DbPlayer = {
  id: string
  name: string | null
  email: string | null
  elo_rating: number | null
  games_played: number | null
  wins: number | null
  losses: number | null
  draws: number | null
  created_at: string | null
  updated_at: string | null
}

export default async function PlayersPage() {
  const supabase = await createClient()

  let playersRaw: DbPlayer[] = []
  try {
    if (supabase) {
      const { data } = await supabase
        .from("players")
        .select("id, name, email, elo_rating, games_played, wins, losses, draws, created_at, updated_at")
        .order("elo_rating", { ascending: false })
        .limit(100)
      playersRaw = (data as any) || []
    }
  } catch (e) {
    playersRaw = []
  }

  const players = playersRaw.map((p) => {
    const gamesPlayed = p.games_played ?? 0
    const wins = p.wins ?? 0
    const draws = p.draws ?? 0
    const losses = p.losses ?? 0
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0
    return {
      ...p,
      gamesPlayed,
      wins,
      draws,
      losses,
      winRate,
    }
  })

  const tournamentCounts = new Map<string, number>()
  if (supabase) {
    const { data } = await supabase.from("tournament_participants").select("player_id")
    if (data) {
      data.forEach((row: { player_id: string }) => {
        tournamentCounts.set(row.player_id, (tournamentCounts.get(row.player_id) || 0) + 1)
      })
    }
  }

  const topPlayers = players.slice(0, 3)
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeaderClient subtitle="Satranç Turnuva Sistemi" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Oyuncular</h1>
          <p className="text-muted-foreground">FILECHESS topluluğundaki oyuncuları keşfedin</p>
        </div>

        {/* Top Players Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">En İyi Oyuncular</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topPlayers.map((player: any, index: number) => (
              <Card key={player.id} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  {index === 0 && <Crown className="w-6 h-6 text-yellow-500" />}
                  {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                  {index === 2 && <Award className="w-6 h-6 text-amber-600" />}
                </div>
                <CardHeader className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage
                      src={`/chess-player-.png?height=80&width=80&query=chess+player+${player.id}`}
                    />
                    <AvatarFallback className="text-lg">
                      {(player.name || "?")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{player.name || "İsimsiz Oyuncu"}</CardTitle>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {player.elo_rating ?? "-"}
                    </Badge>
                    {Array.isArray(player.titles) && player.titles.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {player.titles[0]}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Kazanma Oranı</p>
                      <p className="font-semibold">{player.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Turnuvalar</p>
                      <p className="font-semibold">{tournamentCounts.get(player.id) ?? 0}</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                    <Link href={`/players/${player.id}`}>Profili Görüntüle</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Oyuncu ara..." className="pl-10" />
          </div>
          <Select>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Rating Aralığı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Ratingler</SelectItem>
              <SelectItem value="2000+">2000+</SelectItem>
              <SelectItem value="1800-1999">1800-1999</SelectItem>
              <SelectItem value="1600-1799">1600-1799</SelectItem>
              <SelectItem value="1400-1599">1400-1599</SelectItem>
              <SelectItem value="1200-1399">1200-1399</SelectItem>
              <SelectItem value="0-1199">1199 ve altı</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Ülke" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Ülkeler</SelectItem>
              <SelectItem value="tr">Türkiye</SelectItem>
              <SelectItem value="us">ABD</SelectItem>
              <SelectItem value="de">Almanya</SelectItem>
              <SelectItem value="fr">Fransa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Tüm Oyuncular</CardTitle>
            <CardDescription>Rating sıralamasına göre oyuncular</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {players.map((player: any, index: number) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <Avatar>
                      <AvatarImage src={`/chess-player-.png?height=40&width=40&query=chess+player+${player.id}`} />
                      <AvatarFallback>
                        {(player.name || "?")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{player.name || "İsimsiz Oyuncu"}</h3>
                        {Array.isArray(player.titles) && player.titles.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {player.titles[0]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{player.gamesPlayed} oyun</span>
                        <span>{player.winRate}% kazanma</span>
                        <span>{tournamentCounts.get(player.id) ?? 0} turnuva</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{player.elo_rating ?? "-"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Son güncelleme: {player.updated_at ? new Date(player.updated_at).toLocaleDateString("tr-TR") : "-"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/players/${player.id}`}>Profil</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
