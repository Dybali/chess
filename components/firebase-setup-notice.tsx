"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ExternalLink } from "lucide-react"

export function FirebaseSetupNotice() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>Firebase Kurulumu Gerekli</CardTitle>
              <CardDescription>FILECHESS'i kullanmak için Firebase yapılandırması tamamlanmalıdır</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Kurulum Adımları:</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <strong>Firebase Console'a gidin:</strong>
                  <br />
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    console.firebase.google.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <strong>Yeni proje oluşturun</strong> veya mevcut projeyi seçin
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <strong>Authentication</strong> bölümünden "Email/Password" yöntemini etkinleştirin
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <div>
                  <strong>Firestore Database</strong> oluşturun (test modunda başlayabilirsiniz)
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <div>
                  <strong>Web app ekleyin</strong> ve config bilgilerini alın
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  6
                </span>
                <div>
                  <strong>Project Settings'e</strong> aşağıdaki environment variables'ları ekleyin
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Gerekli Environment Variables:</h4>
            <div className="space-y-2 text-sm font-mono">
              <div>NEXT_PUBLIC_FIREBASE_API_KEY</div>
              <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</div>
              <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID</div>
              <div>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</div>
              <div>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</div>
              <div>NEXT_PUBLIC_FIREBASE_APP_ID</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild>
              <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">
                Firebase Console'a Git
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Sayfayı Yenile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
