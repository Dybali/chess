import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Send, Users, FileText, Plus, Eye, Edit, Trash2, CheckCircle, Filter } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

// Function to fetch email campaigns
async function getEmailCampaigns() {
  try {
    const supabase = createClient()
    const { data: campaigns, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return campaigns || []
  } catch (error) {
    console.error("Error fetching email campaigns:", error)
    return []
  }
}

// Function to fetch email templates
async function getEmailTemplates() {
  try {
    const supabase = createClient()
    const { data: templates, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return templates || []
  } catch (error) {
    console.error("Error fetching email templates:", error)
    return []
  }
}

// Function to get email statistics
async function getEmailStats() {
  try {
    const supabase = createClient()

    const { data: totalCampaigns } = await supabase.from("email_campaigns").select("id", { count: "exact" })

    const { data: sentCampaigns } = await supabase
      .from("email_campaigns")
      .select("id", { count: "exact" })
      .eq("status", "sent")

    const { data: totalRecipients } = await supabase.from("email_recipients").select("id", { count: "exact" })

    const { data: deliveredEmails } = await supabase
      .from("email_recipients")
      .select("id", { count: "exact" })
      .eq("status", "delivered")

    return {
      totalCampaigns: totalCampaigns?.length || 0,
      sentCampaigns: sentCampaigns?.length || 0,
      totalRecipients: totalRecipients?.length || 0,
      deliveredEmails: deliveredEmails?.length || 0,
    }
  } catch (error) {
    console.error("Error fetching email stats:", error)
    return { totalCampaigns: 0, sentCampaigns: 0, totalRecipients: 0, deliveredEmails: 0 }
  }
}

export default async function EmailManagementPage() {
  const campaigns = await getEmailCampaigns()
  const templates = await getEmailTemplates()
  const emailStats = await getEmailStats()

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
                  <p className="text-xs text-muted-foreground">E-posta Yönetimi</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance mb-2">E-posta Yönetimi</h1>
            <p className="text-muted-foreground">Üyelere toplu e-posta gönderimi ve şablon yönetimi</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni E-posta Kampanyası
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Yeni E-posta Kampanyası</DialogTitle>
                <DialogDescription>Üyelere toplu e-posta göndermek için kampanya oluşturun</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="campaign-title">Kampanya Başlığı</Label>
                    <Input id="campaign-title" placeholder="Örn: Haftalık Turnuva Duyurusu" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email-subject">E-posta Konusu</Label>
                    <Input id="email-subject" placeholder="Örn: Yeni Turnuva Başlıyor!" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="template-select">Şablon Seç (İsteğe Bağlı)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Hazır şablon seçin veya özel mesaj yazın" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email-content">E-posta İçeriği</Label>
                  <Textarea id="email-content" placeholder="E-posta mesajınızı buraya yazın..." className="min-h-32" />
                  <p className="text-xs text-muted-foreground">
                    Değişkenler: {"{"}
                    {"{"}name{"}"}, {"{"}
                    {"{"}email{"}"}, {"{"}
                    {"{"}tournament_name{"}"}, {"{"}
                    {"{"}start_date{"}"}
                  </p>
                </div>

                <div className="grid gap-4">
                  <Label>Alıcı Seçimi</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="all-users" />
                        <Label htmlFor="all-users">Tüm Kullanıcılar ({emailStats.totalRecipients})</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="active-users" />
                        <Label htmlFor="active-users">Aktif Kullanıcılar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="tournament-participants" />
                        <Label htmlFor="tournament-participants">Turnuva Katılımcıları</Label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="new-users" />
                        <Label htmlFor="new-users">Yeni Üyeler (Son 30 gün)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="high-elo" />
                        <Label htmlFor="high-elo">Yüksek ELO (1800+)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="custom-filter" />
                        <Label htmlFor="custom-filter">Özel Filtre</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="send-option">Gönderim Seçeneği</Label>
                    <Select defaultValue="now">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Hemen Gönder</SelectItem>
                        <SelectItem value="schedule">Zamanla</SelectItem>
                        <SelectItem value="draft">Taslak Olarak Kaydet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Öncelik</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Düşük</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">İptal</Button>
                <Button variant="outline">Önizleme</Button>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Kampanyayı Başlat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Email Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kampanya</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailStats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">Oluşturulan kampanya</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gönderilen</CardTitle>
              <Send className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{emailStats.sentCampaigns}</div>
              <p className="text-xs text-muted-foreground">Başarılı kampanya</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Alıcı</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{emailStats.totalRecipients}</div>
              <p className="text-xs text-muted-foreground">E-posta gönderildi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teslim Oranı</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {emailStats.totalRecipients > 0
                  ? Math.round((emailStats.deliveredEmails / emailStats.totalRecipients) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Başarı oranı</p>
            </CardContent>
          </Card>
        </div>

        {/* Email Management Tabs */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Kampanyalar</TabsTrigger>
            <TabsTrigger value="templates">Şablonlar</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>E-posta Kampanyaları</CardTitle>
                    <CardDescription>Gönderilen ve planlanmış e-posta kampanyaları</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrele
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{campaign.title}</h3>
                            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">Alıcı: {campaign.total_recipients}</span>
                              <span className="text-xs text-muted-foreground">Gönderilen: {campaign.sent_count}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(campaign.created_at).toLocaleDateString("tr-TR")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              campaign.status === "sent"
                                ? "default"
                                : campaign.status === "sending"
                                  ? "secondary"
                                  : campaign.status === "failed"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {campaign.status === "sent"
                              ? "Gönderildi"
                              : campaign.status === "sending"
                                ? "Gönderiliyor"
                                : campaign.status === "failed"
                                  ? "Başarısız"
                                  : "Taslak"}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {campaign.status === "draft" && (
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Henüz kampanya yok</h3>
                      <p className="text-muted-foreground mb-4">İlk e-posta kampanyanızı oluşturun</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            İlk Kampanyayı Oluştur
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Yeni Kampanya</DialogTitle>
                            <DialogDescription>İlk e-posta kampanyanızı oluşturun</DialogDescription>
                          </DialogHeader>
                          {/* Same form content as above */}
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>E-posta Şablonları</CardTitle>
                    <CardDescription>Hazır e-posta şablonları ve özel şablonlar</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Şablon
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yeni E-posta Şablonu</DialogTitle>
                        <DialogDescription>Yeniden kullanılabilir e-posta şablonu oluşturun</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="template-name">Şablon Adı</Label>
                          <Input id="template-name" placeholder="Örn: Turnuva Hatırlatması" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="template-category">Kategori</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategori seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">Genel</SelectItem>
                              <SelectItem value="tournament">Turnuva</SelectItem>
                              <SelectItem value="welcome">Hoş Geldin</SelectItem>
                              <SelectItem value="notification">Bildirim</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="template-subject">Konu</Label>
                          <Input id="template-subject" placeholder="E-posta konusu" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="template-content">İçerik</Label>
                          <Textarea id="template-content" placeholder="Şablon içeriği..." className="min-h-32" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">İptal</Button>
                        <Button>Şablonu Kaydet</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <CardDescription>{template.subject}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{template.content}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Önizle
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Düzenle
                          </Button>
                          <Button size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            Kullan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gönderim İstatistikleri</CardTitle>
                  <CardDescription>Son 30 günün e-posta performansı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Toplam Gönderim</span>
                      <span className="font-medium">{emailStats.totalRecipients}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Başarılı Teslimat</span>
                      <span className="font-medium text-green-600">{emailStats.deliveredEmails}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Başarısız</span>
                      <span className="font-medium text-red-600">
                        {emailStats.totalRecipients - emailStats.deliveredEmails}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Teslim Oranı</span>
                      <span className="font-medium">
                        {emailStats.totalRecipients > 0
                          ? Math.round((emailStats.deliveredEmails / emailStats.totalRecipients) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kampanya Performansı</CardTitle>
                  <CardDescription>En başarılı kampanyalar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{campaign.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.sent_count} / {campaign.total_recipients} gönderildi
                          </p>
                        </div>
                        <Badge variant="outline">
                          {campaign.total_recipients > 0
                            ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
                            : 0}
                          %
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
