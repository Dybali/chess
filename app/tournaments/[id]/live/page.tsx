"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Send, Users, Clock, Trophy, Play, Pause, RotateCcw } from "lucide-react"
import Link from "next/link"

// Mock live tournament data
const liveTournament = {
  id: 1,
  name: "Haftalık Hızlı Turnuva",
  currentRound: 3,
  totalRounds: 7,
  status: "Devam Ediyor",
  timeControl: "10+5",
  participants: 24,
}

// Mock live standings
const liveStandings = [
  { id: 1, name: "Ahmet Yılmaz", points: 2.5, rating: 1850, performance: "+45" },
  { id: 2, name: "Mehmet Kaya", points: 2.0, rating: 1720, performance: "+12" },
  { id: 3, name: "Ayşe Demir", points: 2.0, rating: 1680, performance: "+8" },
  { id: 4, name: "Fatma Özkan", points: 1.5, rating: 1590, performance: "-5" },
  { id: 5, name: "Ali Çelik", points: 1.0, rating: 1540, performance: "-15" },
]

// Mock live games
const liveGames = [
  {
    id: 1,
    white: "Ahmet Yılmaz",
    black: "Mehmet Kaya",
    whiteTime: "8:45",
    blackTime: "7:23",
    status: "Devam Ediyor",
    moves: 24,
  },
  {
    id: 2,
    white: "Ayşe Demir",
    black: "Fatma Özkan",
    whiteTime: "6:12",
    blackTime: "9:08",
    status: "Devam Ediyor",
    moves: 18,
  },
  {
    id: 3,
    white: "Ali Çelik",
    black: "Zeynep Ak",
    whiteTime: "0:00",
    blackTime: "4:32",
    status: "Tamamlandı",
    moves: 42,
    result: "0-1",
  },
]

// Mock chat messages
const initialMessages = [
  { id: 1, user: "Ahmet", message: "Herkese başarılar!", time: "19:05", type: "user" },
  { id: 2, user: "Sistem", message: "3. tur başladı!", time: "19:06", type: "system" },
  { id: 3, user: "Mehmet", message: "Güzel oyunlar herkese", time: "19:07", type: "user" },
  { id: 4, user: "Ayşe", message: "Heyecan verici turnuva!", time: "19:08", type: "user" },
]

export default function LiveTournamentPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Simulate real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Simulate new messages
    const messageTimer = setInterval(() => {
      const randomMessages = [
        "Harika hamle!",
        "Bu pozisyon çok kritik",
        "Zaman baskısı artıyor",
        "Güzel kombinasyon",
        "Endgame yaklaşıyor",
      ]

      const randomUsers = ["Mehmet", "Ayşe", "Ali", "Fatma", "Zeynep"]

      if (Math.random() > 0.7) {
        const newMsg = {
          id: Date.now(),
          user: randomUsers[Math.floor(Math.random() * randomUsers.length)],
          message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
          time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
          type: "user" as const,
        }
        setMessages((prev) => [...prev, newMsg])
      }
    }, 8000)

    return () => {
      clearInterval(timer)
      clearInterval(messageTimer)
    }
  }, [])

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        user: "Sen",
        message: newMessage,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        type: "user" as const,
      }
      setMessages((prev) => [...prev, message])
      setNewMessage("")
    }
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
                  <p className="text-xs text-muted-foreground">Canlı Turnuva</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                CANLI
              </Badge>
              <span className="text-sm text-muted-foreground">{currentTime.toLocaleTimeString("tr-TR")}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href={`/tournaments/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Turnuva Detayına Dön
          </Link>
        </Button>

        {/* Tournament Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-balance">{liveTournament.name}</h1>
              <p className="text-muted-foreground">
                Tur {liveTournament.currentRound}/{liveTournament.totalRounds} • {liveTournament.participants} katılımcı
              </p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              {liveTournament.status}
            </Badge>
          </div>
          <Progress value={(liveTournament.currentRound / liveTournament.totalRounds) * 100} className="h-3" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Games */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Canlı Oyunlar
                </CardTitle>
                <CardDescription>Şu anda devam eden maçlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveGames.map((game) => (
                    <div key={game.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-400"></div>
                          <span className="font-medium">{game.white}</span>
                          <span className="text-sm text-muted-foreground">vs</span>
                          <div className="w-3 h-3 rounded-full bg-gray-800"></div>
                          <span className="font-medium">{game.black}</span>
                        </div>
                        <Badge variant={game.status === "Devam Ediyor" ? "default" : "secondary"}>{game.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{game.whiteTime}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{game.blackTime}</span>
                          </div>
                          <span className="text-muted-foreground">{game.moves} hamle</span>
                        </div>
                        {game.result && <span className="font-medium">{game.result}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Standings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Canlı Sıralama
                </CardTitle>
                <CardDescription>Güncel puan durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveStandings.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <Avatar>
                          <AvatarImage src={`/user-.png?height=32&width=32&query=player+${player.id}`} />
                          <AvatarFallback>
                            {player.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">Rating: {player.rating}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{player.points}</div>
                        <div
                          className={`text-sm ${
                            player.performance.startsWith("+") ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {player.performance}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Sidebar */}
          <div className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Turnuva Sohbeti
                </CardTitle>
                <CardDescription>Katılımcılarla canlı sohbet</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        {message.type === "system" ? (
                          <div className="w-full text-center">
                            <Badge variant="outline" className="text-xs">
                              {message.message}
                            </Badge>
                          </div>
                        ) : (
                          <>
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">{message.user[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{message.user}</span>
                                <span className="text-xs text-muted-foreground">{message.time}</span>
                              </div>
                              <p className="text-sm">{message.message}</p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button size="icon" onClick={sendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Turnuva Kontrolleri</CardTitle>
                <CardDescription>Hızlı erişim menüsü</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-transparent" variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Turnuvayı Duraklat
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Son Turu Yenile
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <Trophy className="w-4 h-4 mr-2" />
                  Sonuçları Dışa Aktar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
