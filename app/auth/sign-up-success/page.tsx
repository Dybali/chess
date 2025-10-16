import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold">FILECHESS</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Kayıt Başarılı!</CardTitle>
            <CardDescription>E-postanızı kontrol edin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Başarıyla kayıt oldunuz! Hesabınızı onaylamak için e-postanızı kontrol edin. Onayladıktan sonra giriş
              yapabilirsiniz.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Giriş Sayfasına Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
