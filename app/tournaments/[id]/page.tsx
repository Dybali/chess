import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Users, Trophy, ArrowLeft, MessageCircle, Settings, Medal, Radio, Table } from "lucide-react"
import Link from "next/link"
import AppHeaderClient from "@/components/app-header-client"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import JoinTournament from "./join-client"

function formatStatusBadge(status?: string) {
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

function formatDateTR(dateString?: string | null) {
  if (!dateString) return "-"
  try {
    return new Date(dateString).toLocaleDateString("tr-TR")
  } catch {
    return "-"
  }
}

function formatTimeTR(dateString?: string | null) {
  if (!dateString) return "--:--"
  try {
    return new Date(dateString).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return "--:--"
  }
}

export default async function TournamentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  let tournament: any = null
  let participants: any[] = []

  if (supabase) {
    const { data: tData } = await supabase
      .from("tournaments")
      .select(`*, tournament_participants(count)`).eq("id", params.id).single()

    tournament = tData

    const { data: pData } = await supabase
      .from("tournament_participants")
      .select(`id, player:players(id, name, elo_rating)`).eq("tournament_id", params.id)
      .order("registered_at", { ascending: true })

    participants = pData || []
  }

  const statusBadge = formatStatusBadge(tournament?.status)
  const participantCount = tournament?.tournament_participants?.[0]?.count || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeaderClient subtitle="Satranç Turnuva Sistemi" />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Turnuvalara Dön
          </Link>
        </Button>

        {/* Tournament Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-balance mb-2">{tournament?.name}</h1>
                <p className="text-muted-foreground">{tournament?.description}</p>
              </div>
              <Badge variant={statusBadge.variant} className="text-sm px-3 py-1">
                {statusBadge.text}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tarih</p>
                  <p className="font-medium">{formatDateTR(tournament?.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Saat</p>
                  <p className="font-medium">{formatTimeTR(tournament?.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Katılımcı</p>
                  <p className="font-medium">
                    {participantCount}/{tournament?.max_participants}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ödül</p>
                  <p className="font-medium">{tournament?.prize_pool ? `${tournament.prize_pool} TL` : "Ödül yok"}</p>
                </div>
              </div>
            </div>

            <Progress value={(participantCount / (tournament?.max_participants || 1)) * 100} className="mb-4" />
            <p className="text-sm text-muted-foreground mb-6">
              {(tournament?.max_participants || 0) - participantCount} kişi daha katılabilir
            </p>
          </div>

          {/* Action Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Turnuvaya Katıl</CardTitle>
                <CardDescription>Hemen kayıt olun ve turnuvaya katılın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tournament?.status !== "upcoming" ? (
                  <Button disabled className="w-full">
                    Kayıt Kapalı
                  </Button>
                ) : (
                  <Suspense>
                    <JoinTournament tournamentId={params.id} />
                  </Suspense>
                )}
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium">{tournament?.tournament_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zaman:</span>
                    <span className="font-medium">—</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tur Sayısı:</span>
                    <span className="font-medium">{tournament?.total_rounds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Puanlı:</span>
                    <span className="font-medium">—</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent">
                <MessageCircle className="w-4 h-4 mr-2" />
                Sohbet
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {tournament.status === "Devam Ediyor" && (
              <Button className="w-full" variant="secondary" asChild>
                <Link href={`/tournaments/${params.id}/live`}>
                  <Radio className="w-4 h-4 mr-2" />
                  Canlı Takip Et
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Tournament Content */}
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="participants">Katılımcılar</TabsTrigger>
            <TabsTrigger value="tables">Masa Sistemi</TabsTrigger>
            <TabsTrigger value="pairings">Eşleşmeler</TabsTrigger>
            <TabsTrigger value="standings">Sıralama</TabsTrigger>
            <TabsTrigger value="info">Bilgiler</TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Katılımcılar ({participants.length})</CardTitle>
                <CardDescription>Turnuvaya kayıtlı oyuncular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <Avatar>
                          <AvatarImage src={`/generic-placeholder-graphic.png?height=40&width=40`} />
                          <AvatarFallback>
                            {participant.player?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.player?.name}</p>
                          <p className="text-sm text-muted-foreground">Rating: {participant.player?.elo_rating ?? "—"}</p>
                        </div>
                      </div>
                      <Badge variant="outline">TR</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  Masa Dinamiği Sistemi
                </CardTitle>
                <CardDescription>Kazananlar üst masaya, kaybedenler alt masaya geçer</CardDescription>
              </CardHeader>
              <CardContent>
                {tournament?.status === "upcoming" ? (
                  <div className="text-center py-8">
                    <Table className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Turnuva başladığında masa dağılımı burada görünecek</p>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                      <h4 className="font-semibold">Masa Sistemi Kuralları:</h4>
                      <ul className="text-left space-y-1 text-muted-foreground">
                        <li>• Oyuncular ELO'ya göre masalara dağıtılır</li>
                        <li>• Kazanan oyuncu bir üst masaya çıkar</li>
                        <li>• Kaybeden oyuncu bir alt masaya düşer</li>
                        <li>• Masa 1 kazananı Masa 1'de kalır</li>
                        <li>• En alt masa kaybedeni aynı masada kalır</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Aktif Tur: {tournament?.current_round}/{tournament?.total_rounds}
                      </p>
                      <Button asChild>
                        <Link href={`/tournaments/${params.id}/tables`}>
                          <Table className="w-4 h-4 mr-2" />
                          Masa Yönetimi
                        </Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-chess-green">
                            {Math.ceil((participantCount || 0) / 2)}
                          </p>
                          <p className="text-sm text-muted-foreground">Toplam Masa</p>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-chess-green">{tournament.currentRound}</p>
                          <p className="text-2xl font-bold text-chess-green">{tournament?.current_round}</p>
                          <p className="text-sm text-muted-foreground">Tamamlanan Tur</p>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-chess-green">
                            {(tournament?.total_rounds || 0) - (tournament?.current_round || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Kalan Tur</p>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pairings" className="space-y-4">
            <Card>
                  <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Eşleşmeler - Tur {tournament?.current_round || 0}</span>
                  <Button variant="outline" asChild>
                    <Link href={`/tournaments/${params.id}/manage`}>
                      <Settings className="w-4 h-4 mr-2" />
                      Yönetim Paneli
                    </Link>
                  </Button>
                </CardTitle>
                <CardDescription>
                  {tournament?.status === "upcoming" ? "Turnuva henüz başlamadı" : "Aktif tur eşleşmeleri"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tournament?.status === "upcoming" ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Turnuva başladığında eşleşmeler burada görünecek</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Aktif tur eşleşmeleri */}
                    {await (async () => {
                      const supabase = await createClient()
                      const round = tournament?.current_round || 0
                      const { data: rows } = await supabase
                        .from("tournament_tables")
                        .select("table_number, white:players!tournament_tables_white_player_id_fkey(id, name), black:players!tournament_tables_black_player_id_fkey(id, name), result")
                        .eq("tournament_id", params.id)
                        .eq("round_number", round)
                        .order("table_number", { ascending: true })
                      if (!rows || rows.length === 0) {
                        return (
                          <div className="text-sm text-muted-foreground">Bu tur için eşleşme bulunamadı.</div>
                        )
                      }
                      return rows.map((pairing: any, index: number) => (
                        <div key={`${pairing.table_number}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">Masa {pairing.table_number}</Badge>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full" />
                              <span className="font-medium">{pairing.white?.name || "-"}</span>
                            </div>
                            <span className="text-muted-foreground">vs</span>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gray-800 rounded-full" />
                              <span className="font-medium">{pairing.black?.name || "-"}</span>
                            </div>
                          </div>
                          <Badge variant={pairing.result && pairing.result !== "pending" ? "default" : "secondary"}>
                            {pairing.result && pairing.result !== "pending" ? pairing.result : "Devam Ediyor"}
                          </Badge>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sıralama Tablosu</CardTitle>
                <CardDescription>Güncel puan durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Medal className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Turnuva başladığında sıralama burada görünecek</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Turnuva Bilgileri</CardTitle>
                <CardDescription>Detaylı turnuva bilgileri ve kurallar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Turnuva Kuralları</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Turnuva saatinde hazır bulunun</li>
                    <li>• Fair play kurallarına uyun</li>
                    <li>• Teknik sorunları hemen bildirin</li>
                    <li>• Sohbette saygılı olun</li>
                    <li>• Geç kalma toleransı 15 dakikadır</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Ödül Dağılımı</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>🥇 1. Yer:</span>
                      <span className="font-medium">250 TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥈 2. Yer:</span>
                      <span className="font-medium">150 TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🥉 3. Yer:</span>
                      <span className="font-medium">100 TL</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Organizatör</h4>
                  <p className="text-sm text-muted-foreground">{tournament.organizer}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
