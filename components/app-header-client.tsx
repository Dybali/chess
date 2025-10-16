"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export default function AppHeaderClient({ subtitle }: { subtitle?: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

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
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                    <Button variant="outline" onClick={handleSignOut}>
                      Çıkış
                    </Button>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

