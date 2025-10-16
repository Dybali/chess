"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

const STORAGE_KEY = "filechess_player_id"

export default function JoinTournament({ tournamentId }: { tournamentId: string }) {
	const supabase = createClient()
	const [isJoining, setIsJoining] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [playerId, setPlayerId] = useState<string | null>(null)
	const [isAlreadyJoined, setIsAlreadyJoined] = useState(false)
	const [capacityText, setCapacityText] = useState<string>("")
	const [showNameForm, setShowNameForm] = useState(false)
	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [user, setUser] = useState<any>(null)

	useEffect(() => {
		const loadData = async () => {
			// Check if user is logged in
			const { data: { user: authUser } } = await supabase.auth.getUser()
			setUser(authUser)
			
			const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
			if (stored) setPlayerId(stored)
			
			// fetch capacity and joined state
			const { data: t } = await supabase.from("tournaments").select("id, max_participants, tournament_participants(count)").eq("id", tournamentId).single()
			const current = t?.tournament_participants?.[0]?.count || 0
			setCapacityText(`${current}/${t?.max_participants || 0}`)
			
			if (stored) {
				const { data: exists } = await supabase
					.from("tournament_participants")
					.select("id")
					.eq("tournament_id", tournamentId)
					.eq("player_id", stored)
					.single()
				setIsAlreadyJoined(Boolean(exists))
			}
		}
		loadData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tournamentId])

	const handleJoin = async () => {
		setError(null)
		setSuccess(null)
		
		// Eğer kullanıcı giriş yapmışsa, otomatik oyuncu oluştur
		if (user && !playerId) {
			await createPlayerFromAuth()
			return
		}
		
		// Eğer playerId yoksa, isim formunu göster
		if (!playerId) {
			setShowNameForm(true)
			return
		}
		
		setIsJoining(true)
		try {
			// capacity check
			const { data: t } = await supabase.from("tournaments").select("id, max_participants, tournament_participants(count)").eq("id", tournamentId).single()
			const current = t?.tournament_participants?.[0]?.count || 0
			if (t?.max_participants && current >= t.max_participants) {
				throw new Error("Kapasite dolu")
			}

			// prevent duplicate
			const { data: exists } = await supabase
				.from("tournament_participants")
				.select("id")
				.eq("tournament_id", tournamentId)
				.eq("player_id", playerId)
				.maybeSingle?.()

			if (exists) {
				setIsAlreadyJoined(true)
				setSuccess("Zaten kayıtlısınız")
				setIsJoining(false)
				return
			}

			const { error: regErr } = await supabase.from("tournament_participants").insert({ tournament_id: tournamentId, player_id: playerId })
			if (regErr) throw regErr

			setSuccess("Turnuvaya katılım tamamlandı!")
			setIsAlreadyJoined(true)
		} catch (e: any) {
			setError(e?.message || "Katılım sırasında bir hata oluştu")
		} finally {
			setIsJoining(false)
		}
	}

	const createPlayerFromAuth = async () => {
		setIsJoining(true)
		setError(null)
		
		try {
			// Google profil bilgilerini kullan
			const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Oyuncu"
			
			const { data: player, error: playerErr } = await supabase
				.from("players")
				.insert({ 
					name: displayName,
					email: user.email 
				})
				.select("id")
				.single()
			
			if (playerErr) throw playerErr
			
			localStorage.setItem(STORAGE_KEY, player.id)
			setPlayerId(player.id)
			
			// Şimdi turnuvaya katıl
			await handleJoin()
		} catch (e: any) {
			setError(e?.message || "Oyuncu oluşturulurken hata oluştu")
		} finally {
			setIsJoining(false)
		}
	}

	const handleCreatePlayer = async () => {
		if (!firstName.trim() || !lastName.trim()) {
			setError("Lütfen ad ve soyadınızı girin")
			return
		}

		setIsJoining(true)
		setError(null)
		
		try {
			const fullName = `${firstName.trim()} ${lastName.trim()}`
			const { data: player, error: playerErr } = await supabase
				.from("players")
				.insert({ name: fullName })
				.select("id")
				.single()
			
			if (playerErr) throw playerErr
			
			localStorage.setItem(STORAGE_KEY, player.id)
			setPlayerId(player.id)
			setShowNameForm(false)
			
			// Şimdi turnuvaya katıl
			await handleJoin()
		} catch (e: any) {
			setError(e?.message || "Oyuncu oluşturulurken hata oluştu")
		} finally {
			setIsJoining(false)
		}
	}

	if (showNameForm) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Oyuncu Bilgileri</CardTitle>
					<CardDescription>Turnuvaya katılmak için ad ve soyadınızı girin</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="firstName">Ad</Label>
							<Input
								id="firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="Adınız"
							/>
						</div>
						<div>
							<Label htmlFor="lastName">Soyad</Label>
							<Input
								id="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Soyadınız"
							/>
						</div>
					</div>
					<div className="flex gap-2">
						<Button 
							onClick={handleCreatePlayer} 
							disabled={isJoining || !firstName.trim() || !lastName.trim()}
							className="flex-1"
						>
							{isJoining ? "Kaydediliyor..." : "Katıl"}
						</Button>
						<Button 
							variant="outline" 
							onClick={() => setShowNameForm(false)}
							disabled={isJoining}
						>
							İptal
						</Button>
					</div>
					{error && <div className="text-sm text-red-600">{error}</div>}
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-2">
			<Button className="w-full" onClick={handleJoin} disabled={isJoining || isAlreadyJoined}>
				{isAlreadyJoined ? "Kayıtlısınız" : isJoining ? "Kaydediliyor..." : user ? "Turnuvaya Katıl" : "Turnuvaya Katıl"}
			</Button>
			{capacityText && <div className="text-xs text-muted-foreground">Kapasite: {capacityText}</div>}
			{error && <div className="text-xs text-red-600">{error}</div>}
			{success && <div className="text-xs text-green-600">{success}</div>}
		</div>
	)
}


