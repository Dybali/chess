"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Play, Save, Users, Trophy, RefreshCw } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function TournamentManagePage({ params }: { params: { id: string } }) {
	const supabase = useMemo(() => createClient(), [])
	const [tournament, setTournament] = useState<any | null>(null)
	const [tables, setTables] = useState<Array<{
		id: string
		tableNumber: number
		white: { id: string; name: string; elo_rating: number } | null
		black: { id: string; name: string; elo_rating: number } | null
		result: string | null
	}>>([])
	const [selectedResults, setSelectedResults] = useState<{ [rowId: string]: string }>({})
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const load = async () => {
			setError(null)
			setLoading(true)
			try {
				const { data: t } = await supabase.from("tournaments").select("*").eq("id", params.id).single()
				setTournament(t)

				const currentRound = t?.current_round || 1
				const { data: tableRows } = await supabase
					.from("tournament_tables")
					.select("id, table_number, round_number, white_player_id, black_player_id, result")
					.eq("tournament_id", params.id)
					.eq("round_number", currentRound)
					.order("table_number", { ascending: true })

				const playerIds = Array.from(
					new Set((tableRows || []).flatMap((r) => [r.white_player_id, r.black_player_id]).filter(Boolean))
				) as string[]

				let playersMap: Record<string, any> = {}
				if (playerIds.length > 0) {
					const { data: players } = await supabase
						.from("players")
						.select("id, name, elo_rating")
						.in("id", playerIds)
					players?.forEach((p) => (playersMap[p.id] = p))
				}

				const enriched = (tableRows || []).map((r) => ({
					id: r.id as string,
					tableNumber: r.table_number as number,
					white: r.white_player_id ? playersMap[r.white_player_id] || null : null,
					black: r.black_player_id ? playersMap[r.black_player_id] || null : null,
					result: (r.result as string | null) ?? null,
				}))
				setTables(enriched)
			} catch (e: any) {
				setError(e?.message || "Veriler yüklenemedi")
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [params.id, supabase])

	const handleResultChange = (rowId: string, result: string) => {
		setSelectedResults((prev) => ({
			...prev,
			[rowId]: result,
		}))
	}

	const saveResults = async () => {
		setSaving(true)
		setError(null)
		try {
			const updates = Object.entries(selectedResults)
			for (const [rowId, result] of updates) {
				await supabase.from("tournament_tables").update({ result }).eq("id", rowId)
			}
			const updated = tables.map((t) => (selectedResults[t.id] ? { ...t, result: selectedResults[t.id] } : t))
			setTables(updated)
			setSelectedResults({})
			alert("Sonuçlar kaydedildi!")
		} catch (e: any) {
			setError(e?.message || "Sonuçlar kaydedilemedi")
		} finally {
			setSaving(false)
		}
	}

	const startTournament = async () => {
		setError(null)
		setSaving(true)
		try {
			// Load participants with player data
			const { data: parts } = await supabase
				.from("tournament_participants")
				.select("player_id, players(id, name, elo_rating)")
				.eq("tournament_id", params.id)
			// sort by elo desc
			const sorted = (parts || [])
				.map((p: any) => p.players)
				.filter(Boolean)
				.sort((a: any, b: any) => (b.elo_rating || 0) - (a.elo_rating || 0))
			// pair into tables
			const pairs: Array<{ white: any; black: any; tableNumber: number }> = []
			for (let i = 0; i < sorted.length; i += 2) {
				const a = sorted[i]
				const b = sorted[i + 1]
				if (!a || !b) break
				pairs.push({ white: a, black: b, tableNumber: pairs.length + 1 })
			}
			// insert tables for round 1
			const inserts = pairs.map((p) => ({
				tournament_id: params.id,
				table_number: p.tableNumber,
				round_number: 1,
				white_player_id: p.white.id,
				black_player_id: p.black.id,
				result: "pending",
			}))
			if (inserts.length > 0) {
				await supabase.from("tournament_tables").insert(inserts)
			}
			// update tournament state
			await supabase.from("tournaments").update({ current_round: 1, status: "active" }).eq("id", params.id)
			// reload
			location.reload()
		} catch (e: any) {
			setError(e?.message || "Turnuva başlatılamadı")
		} finally {
			setSaving(false)
		}
	}

	const generateNextRound = async () => {
		setError(null)
		setSaving(true)
		try {
			const currentRound = tournament?.current_round || 1
			// load current round tables
			const { data: roundRows } = await supabase
				.from("tournament_tables")
				.select("id, table_number, white_player_id, black_player_id, result")
				.eq("tournament_id", params.id)
				.eq("round_number", currentRound)
				.order("table_number", { ascending: true })
			if (!roundRows || roundRows.length === 0) {
				throw new Error("Aktif tur masaları bulunamadı")
			}
			// determine next table for each player
			type Move = { playerId: string; nextTable: number }
			const moves: Move[] = []
			const bottomTable = roundRows[roundRows.length - 1].table_number
			for (const r of roundRows) {
				const t = r.table_number
				if (r.result === "1-0") {
					moves.push({ playerId: r.white_player_id as string, nextTable: Math.max(1, t - 1) })
					moves.push({ playerId: r.black_player_id as string, nextTable: Math.min(bottomTable, t + 1) })
				} else if (r.result === "0-1") {
					moves.push({ playerId: r.black_player_id as string, nextTable: Math.max(1, t - 1) })
					moves.push({ playerId: r.white_player_id as string, nextTable: Math.min(bottomTable, t + 1) })
				} else {
					// draw or pending -> stay
					if (r.white_player_id) moves.push({ playerId: r.white_player_id as string, nextTable: t })
					if (r.black_player_id) moves.push({ playerId: r.black_player_id as string, nextTable: t })
				}
			}
			// group by table
			const byTable = new Map<number, string[]>()
			for (const m of moves) {
				byTable.set(m.nextTable, [...(byTable.get(m.nextTable) || []), m.playerId])
			}
			// build next round rows (simple ordering as listed)
			const nextRound = currentRound + 1
			const inserts: any[] = []
			for (const [tableNumber, players] of Array.from(byTable.entries()).sort((a, b) => a[0] - b[0])) {
				if (players.length < 2) continue
				const [p1, p2] = players
				inserts.push({
					tournament_id: params.id,
					table_number: tableNumber,
					round_number: nextRound,
					white_player_id: p1,
					black_player_id: p2,
					result: "pending",
				})
			}
			if (inserts.length === 0) throw new Error("Yeni tur için yeterli eşleşme bulunamadı")
			await supabase.from("tournament_tables").insert(inserts)
			await supabase.from("tournaments").update({ current_round: nextRound }).eq("id", params.id)
			location.reload()
		} catch (e: any) {
			setError(e?.message || "Yeni tur oluşturulamadı")
		} finally {
			setSaving(false)
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
									<p className="text-xs text-muted-foreground">Turnuva Yönetimi</p>
								</div>
							</Link>
						</div>
					</div>
				</div>
			</header>

			<div className="container mx-auto px-4 py-8">
				{/* Back Button */}
				<Button variant="ghost" className="mb-6" asChild>
					<Link href={`/tournaments/${params.id}`}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Turnuvaya Dön
					</Link>
				</Button>

				{/* Tournament Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">{tournament?.name || "Turnuva"} - Yönetim</h1>
					<div className="flex items-center gap-4">
						<Badge variant="secondary">Tur {tournament?.current_round || 0}/{tournament?.total_rounds || 0}</Badge>
						<Badge variant="outline">{tournament?.status || "-"}</Badge>
						<span className="text-muted-foreground">Aktif tur masaları</span>
					</div>
				</div>

				<Tabs defaultValue="results" className="space-y-6">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="results">Sonuç Girişi</TabsTrigger>
						<TabsTrigger value="tables">Masa Durumu</TabsTrigger>
						<TabsTrigger value="pairings">Eşleşme Sistemi</TabsTrigger>
					</TabsList>

					<TabsContent value="results" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<span>Tur {tournament?.current_round || 0} - Maç Sonuçları</span>
									<div className="flex gap-2">
										<Button onClick={startTournament} variant="outline" disabled={saving || (tournament?.current_round || 0) > 0}>
											<Play className="w-4 h-4 mr-2" />
											Turnuvayı Başlat
										</Button>
										<Button onClick={saveResults} disabled={Object.keys(selectedResults).length === 0 || saving}>
											<Save className="w-4 h-4 mr-2" />
											{saving ? "Kaydediliyor..." : "Sonuçları Kaydet"}
										</Button>
										<Button onClick={generateNextRound} variant="outline" disabled={saving || !tables.every((t) => !!t.result)}>
											<RefreshCw className="w-4 h-4 mr-2" />
											Yeni Tur Oluştur
										</Button>
									</div>
								</CardTitle>
								<CardDescription>Maç sonuçlarını girin. Kazananlar üst masaya, kaybedenler alt masaya geçecek.</CardDescription>
							</CardHeader>
							<CardContent>
								{error && <div className="text-sm text-red-600 mb-3">{error}</div>}
								{loading ? (
									<div className="text-sm text-muted-foreground">Yükleniyor...</div>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Masa</TableHead>
												<TableHead>Beyaz</TableHead>
												<TableHead>Siyah</TableHead>
												<TableHead>Sonuç</TableHead>
												<TableHead>Durum</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{tables.map((row) => (
												<TableRow key={row.id}>
													<TableCell>
														<Badge variant="outline">Masa {row.tableNumber}</Badge>
													</TableCell>
													<TableCell>
														<div>
															<p className="font-medium">{row.white?.name || "-"}</p>
															<p className="text-sm text-muted-foreground">ELO: {row.white?.elo_rating ?? "-"}</p>
														</div>
													</TableCell>
													<TableCell>
														<div>
															<p className="font-medium">{row.black?.name || "-"}</p>
															<p className="text-sm text-muted-foreground">ELO: {row.black?.elo_rating ?? "-"}</p>
														</div>
													</TableCell>
													<TableCell>
														{row.result ? (
															<Badge variant="secondary">{row.result}</Badge>
														) : (
															<Select onValueChange={(value) => handleResultChange(row.id, value)}>
																<SelectTrigger className="w-32">
																	<SelectValue placeholder="Sonuç seç" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="1-0">1-0 (Beyaz Kazandı)</SelectItem>
																	<SelectItem value="0-1">0-1 (Siyah Kazandı)</SelectItem>
																	<SelectItem value="1/2-1/2">1/2-1/2 (Berabere)</SelectItem>
																	<SelectItem value="1-0 (FF)">1-0 (Forfeit)</SelectItem>
																	<SelectItem value="0-1 (FF)">0-1 (Forfeit)</SelectItem>
																</SelectContent>
															</Select>
														)}
													</TableCell>
													<TableCell>
														<Badge variant={row.result ? "default" : "secondary"}>{row.result ? "Tamamlandı" : "Devam Ediyor"}</Badge>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="tables" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Masa Dağılımı - Tur {tournament?.current_round || 0}</CardTitle>
								<CardDescription>
									Oyuncular ELO sıralamasına göre masalara dağıtılmıştır. Kazananlar üst masaya çıkar, kaybedenler alt masaya düşer.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4">
									{tables.map((table) => (
										<Card key={table.id} className="p-4">
											<div className="flex items-center justify-between mb-3">
												<h3 className="font-semibold flex items-center gap-2">
													<Trophy className="w-4 h-4" />
													Masa {table.tableNumber}
												</h3>
												<Badge variant="outline">
													{table.tableNumber === 1 ? "En Üst Masa" : "Masa"}
												</Badge>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
													<div className={`w-3 h-3 rounded-full bg-white border-2 border-gray-400`} />
													<div>
														<p className="font-medium">{table.white?.name || "-"}</p>
														<p className="text-sm text-muted-foreground">ELO: {table.white?.elo_rating ?? "-"}</p>
													</div>
												</div>
												<div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
													<div className={`w-3 h-3 rounded-full bg-gray-800`} />
													<div>
														<p className="font-medium">{table.black?.name || "-"}</p>
														<p className="text-sm text-muted-foreground">ELO: {table.black?.elo_rating ?? "-"}</p>
													</div>
												</div>
											</div>
										</Card>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="pairings" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Swiss Sistemi - Masa Dinamiği</CardTitle>
								<CardDescription>Turnuva eşleşme sistemi ve masa geçiş kuralları</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="bg-muted/50 p-4 rounded-lg">
									<h4 className="font-semibold mb-3">Sistem Kuralları:</h4>
									<div className="grid md:grid-cols-2 gap-4 text-sm">
										<div>
											<h5 className="font-medium mb-2">İlk Tur:</h5>
											<ul className="space-y-1 text-muted-foreground">
												<li>• Oyuncular ELO'ya göre sıralanır</li>
												<li>• En yüksek ELO'lu Masa 1'e</li>
												<li>• Masalara 2'şer oyuncu dağıtılır</li>
												<li>• Her masada 1 maç oynanır</li>
											</ul>
										</div>
										<div>
											<h5 className="font-medium mb-2">Sonraki Turlar:</h5>
											<ul className="space-y-1 text-muted-foreground">
												<li>• Kazanan oyuncu 1 üst masaya çıkar</li>
												<li>• Kaybeden oyuncu 1 alt masaya düşer</li>
												<li>• Masa 1 kazananı Masa 1'de kalır</li>
												<li>• En alt masa kaybedeni aynı masada kalır</li>
												<li>• Berabere durumunda oyuncular aynı masada kalır</li>
											</ul>
										</div>
									</div>
								</div>

								<div className="grid md:grid-cols-3 gap-4">
									<Card className="p-4 text-center">
										<Users className="w-8 h-8 mx-auto mb-2 text-primary" />
										<p className="font-semibold">{tables.length * 2}</p>
										<p className="text-sm text-muted-foreground">Toplam Oyuncu</p>
									</Card>
									<Card className="p-4 text-center">
										<Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
										<p className="font-semibold">{tables.length}</p>
										<p className="text-sm text-muted-foreground">Toplam Masa</p>
									</Card>
									<Card className="p-4 text-center">
										<Play className="w-8 h-8 mx-auto mb-2 text-primary" />
										<p className="font-semibold">{tournament?.current_round || 0}</p>
										<p className="text-sm text-muted-foreground">Aktif Tur</p>
									</Card>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
