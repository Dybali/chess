import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function AppHeader({ subtitle }: { subtitle?: string }) {
  const supabase = await createClient()
  let userEmail: string | null = null

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userEmail = user?.email ?? null
  }

  const ADMIN_EMAILS = ["cecccibrahim@gmail.com"];

  return (
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
                {!!subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
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
            {userEmail ? (
              <div className="flex items-center gap-2">
                {ADMIN_EMAILS.includes(userEmail) && (
                  <div>
                     <Button variant="ghost" asChild>
                       <Link href="/admin/dashboard">Admin Dashboard</Link>
                     </Button>
                  </div>
                )}
                <form action="/auth/signout" method="post">
                  <Button variant="outline" type="submit">Çıkış</Button>
                </form>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Giriş Yap</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Kayıt Ol</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}


