"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Calendar, Clock, Users, Trophy } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function CreateTournamentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [format, setFormat] = useState<string | undefined>(undefined)
  const [maxParticipants, setMaxParticipants] = useState<number | "">(32)
  const [timeControl, setTimeControl] = useState<string | undefined>(undefined)
  const [rounds, setRounds] = useState<number | "">(7)
  const [prize, setPrize] = useState("")
  const [rated, setRated] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPreviewDate = () => {
    if (!date) return "Tarih seçilmedi"
    try {
      return new Date(date).toLocaleDateString("tr-TR")
    } catch {
      return "Tarih seçilmedi"
    }
  }

  const formatPreviewTime = () => {
    if (!time) return "Saat seçilmedi"
    return time
  }

  const onSubmit = async () => {
    setError(null)
    if (!name || !date || !time || !format || !maxParticipants) {
      setError("Lütfen zorunlu alanları doldurun.")
      return
    }

    setIsSubmitting(true)
    try {
      const startIso = new Date(`${date}T${time}:00`).toISOString()

      // Map UI -> DB schema
      const payload: any = {
        name,
        description: description || null,
        start_date: startIso,
        end_date: null,
        max_participants: typeof maxParticipants === "string" ? parseInt(maxParticipants) : maxParticipants,
        entry_fee: 0,
        prize_pool: prize ? Number(String(prize).replace(/[^0-9.]/g, "")) : 0,
        status: "upcoming",
        tournament_type: format, // must be one of: 'swiss', 'round_robin', 'elimination'
        current_round: 0,
        total_rounds: typeof rounds === "string" ? parseInt(rounds) : rounds || 5,
      }

      // Extra fields not in schema can be added later (timeControl, rated, isPublic, chatEnabled)

      const { data, error: insertError } = await supabase
        .from("tournaments")
        .insert(payload)
        .select("id")
        .single()

      if (insertError) {
        setError(insertError.message)
        setIsSubmitting(false)
        return
      }

      if (data?.id) {
        router.push(`/tournaments/${data.id}`)
      } else {
        setIsSubmitting(false)
      }
    } catch (e: any) {
      setError(e?.message || "Beklenmeyen bir hata oluştu")
      setIsSubmitting(false)
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
                  <p className="text-xs text-muted-foreground">Satranç Turnuva Sistemi</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/players">Oyuncular</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/tournaments">Turnuvalar</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">Giriş Yap</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Kayıt Ol</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Turnuvalara Dön
          </Link>
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Yeni Turnuva Oluştur</h1>
          <p className="text-muted-foreground">Turnuva detaylarını doldurun ve katılımcıları bekleyin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Temel Bilgiler
                </CardTitle>
                <CardDescription>Turnuvanızın temel bilgilerini girin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Turnuva Adı</Label>
                  <Input id="name" placeholder="Örn: Haftalık Hızlı Turnuva" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    placeholder="Turnuva hakkında kısa bir açıklama yazın..."
                    className="min-h-20"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Tarih</Label>
                    <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Saat</Label>
                    <Input id="time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Turnuva Ayarları
                </CardTitle>
                <CardDescription>Format ve katılımcı ayarlarını belirleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Turnuva formatını seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="swiss">Swiss System</SelectItem>
                        <SelectItem value="round_robin">Round-Robin</SelectItem>
                        <SelectItem value="elimination">Eleme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Maksimum Katılımcı</Label>
                    <Input id="maxParticipants" type="number" placeholder="32" min="4" max="128" required value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === "" ? "" : Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeControl">Zaman Kontrolü</Label>
                    <Select value={timeControl} onValueChange={setTimeControl}>
                      <SelectTrigger>
                        <SelectValue placeholder="Zaman kontrolünü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5+3">5+3 (Blitz)</SelectItem>
                        <SelectItem value="10+5">10+5 (Rapid)</SelectItem>
                        <SelectItem value="15+10">15+10 (Rapid)</SelectItem>
                        <SelectItem value="30+0">30+0 (Rapid)</SelectItem>
                        <SelectItem value="90+30">90+30 (Classical)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rounds">Tur Sayısı</Label>
                    <Input id="rounds" type="number" placeholder="7" min="3" max="15" value={rounds} onChange={(e) => setRounds(e.target.value === "" ? "" : Number(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize">Ödül (Opsiyonel)</Label>
                  <Input id="prize" placeholder="Örn: 500 TL" value={prize} onChange={(e) => setPrize(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Ek Ayarlar</CardTitle>
                <CardDescription>Turnuva için ek seçenekleri belirleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="rated" checked={rated} onCheckedChange={(v) => setRated(Boolean(v))} />
                  <Label htmlFor="rated">Puanlı turnuva (ELO etkiler)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="public" checked={isPublic} onCheckedChange={(v) => setIsPublic(Boolean(v))} />
                  <Label htmlFor="public">Herkese açık turnuva</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="chat" checked={chatEnabled} onCheckedChange={(v) => setChatEnabled(Boolean(v))} />
                  <Label htmlFor="chat">Turnuva sohbetini etkinleştir</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Önizleme</CardTitle>
                <CardDescription>Turnuvanız böyle görünecek</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Turnuva Adı</h3>
                  <p className="text-sm text-muted-foreground">{name || "Henüz girilmedi"}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatPreviewDate()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatPreviewTime()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>0/{maxParticipants || "--"} katılımcı</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Turnuva Kuralları</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Turnuva saatinde hazır bulunun</p>
                <p>• Fair play kurallarına uyun</p>
                <p>• Teknik sorunları hemen bildirin</p>
                <p>• Sohbette saygılı olun</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 mt-4">{error}</div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8">
          <Button variant="outline" asChild>
            <Link href="/tournaments">İptal</Link>
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Oluşturuluyor..." : "Turnuva Oluştur"}
          </Button>
        </div>
      </div>
    </div>
  )
}
