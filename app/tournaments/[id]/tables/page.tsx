"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Users, Clock, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"

export default function TournamentTablesPage() {
	const params = useParams<{ id: string }>()
	const supabase = useMemo(() => createClient(), [])
	const [tournament, setTournament] = useState<any | null>(null)
	const [tables, setTables] = useState<Array<{
		id: string
		tableNumber: number
		white: { id: string; name: string; elo_rating: number } | null
		black: { id: string; name: string; elo_rating: number } | null
		result: string | null
	}>>([])
	const [selectedResults, setSelectedResults] = useState<{ [tableNumber: number]: string }>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const load = async () => {
			if (!params?.id) return
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
	}, [params?.id, supabase])

	const handleResultChange = (tableNumber: number, result: string) => {
		setSelectedResults((prev) => ({
			...prev,
			[tableNumber]: result,
		}))
	}

	const submitResults = () => {
		const updatedTables = tables.map((table) => {
			const result = selectedResults[table.tableNumber]
			if (result) {
				return { ...table, result }
			}
			return table
		})
		setTables(updatedTables)
		setSelectedResults({})
		alert("Sonuçlar kaydedildi! (Yerel önizleme)")
	}

	const generateNextRound = () => {
		alert("Yeni tur eşleşmeleri oluşturuluyor... (Yerel önizleme)")
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Tournament Header */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-3xl font-bold text-chess-dark">{tournament?.name || "Turnuva"}</h1>
					<Badge variant="secondary" className="text-lg px-4 py-2">
						Tur {tournament?.current_round || 0}/{tournament?.total_rounds || 0}
					</Badge>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<Card>
						<CardContent className="flex items-center p-4">
							<Clock className="h-8 w-8 text-chess-green mr-3" />
							<div>
								<p className="text-sm text-muted-foreground">Aktif Tur</p>
								<p className="text-2xl font-bold">{tournament?.current_round || 0}</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex items-center p-4">
							<Users className="h-8 w-8 text-chess-green mr-3" />
							<div>
								<p className="text-sm text-muted-foreground">Toplam Masa</p>
								<p className="text-2xl font-bold">{tables.length}</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex items-center p-4">
							<Target className="h-8 w-8 text-chess-green mr-3" />
							<div>
								<p className="text-sm text-muted-foreground">Aktif Oyuncu</p>
								<p className="text-2xl font-bold">{tables.length * 2}</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex items-center p-4">
							<Trophy className="h-8 w-8 text-chess-green mr-3" />
							<div>
								<p className="text-sm text-muted-foreground">Kalan Tur</p>
								<p className="text-2xl font-bold">{(tournament?.total_rounds || 0) - (tournament?.current_round || 0)}</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Tables Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				{tables.map((table) => (
					<Card key={table.id} className="border-2 hover:border-chess-green/50 transition-colors">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center justify-between">
								<span className="text-xl">Masa {table.tableNumber}</span>
								<Badge variant={table.tableNumber === 1 ? "default" : "secondary"}>
									{table.tableNumber === 1 ? "Üst Masa" : `Masa ${table.tableNumber}`}
								</Badge>
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4">
							{/* Player 1 */}
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div>
									<p className="font-semibold">{table.white?.name || "-"}</p>
									<p className="text-sm text-muted-foreground">ELO: {table.white?.elo_rating ?? "-"}</p>
								</div>
								<Badge variant="outline">Beyaz</Badge>
							</div>

							{/* VS */}
							<div className="text-center text-muted-foreground font-semibold">VS</div>

							{/* Player 2 */}
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div>
									<p className="font-semibold">{table.black?.name || "-"}</p>
									<p className="text-sm text-muted-foreground">ELO: {table.black?.elo_rating ?? "-"}</p>
								</div>
								<Badge variant="outline">Siyah</Badge>
							</div>

							{/* Result Selection */}
							<div className="pt-4 border-t">
								<label className="text-sm font-medium mb-2 block">Maç Sonucu:</label>
								<Select value={selectedResults[table.tableNumber] || ""} onValueChange={(value) => handleResultChange(table.tableNumber, value)}>
									<SelectTrigger>
										<SelectValue placeholder="Sonuç seçin..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1-0">{table.white?.name || "Beyaz"} Kazandı (1-0)</SelectItem>
										<SelectItem value="0-1">{table.black?.name || "Siyah"} Kazandı (0-1)</SelectItem>
										<SelectItem value="1/2-1/2">Berabere (1/2-1/2)</SelectItem>
									</SelectContent>
								</Select>

								{table.result && (
									<div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
										<strong>Sonuç:</strong> {table.result}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Action Buttons */}
			<div className="flex gap-4 justify-center">
				<Button onClick={submitResults} className="bg-chess-green hover:bg-chess-green/90" disabled={Object.keys(selectedResults).length === 0}>
					Sonuçları Kaydet
				</Button>

				<Button onClick={generateNextRound} variant="outline" disabled={tables.some((table) => !table.result)}>
					Yeni Tur Oluştur
				</Button>
			</div>

			{/* Table Movement Rules */}
			<Card className="mt-8">
				<CardHeader>
					<CardTitle>Masa Dinamiği Kuralları</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<p>• <strong>Kazanan oyuncu:</strong> Bir üst masaya çıkar (Masa 5 → Masa 4)</p>
					<p>• <strong>Kaybeden oyuncu:</strong> Bir alt masaya düşer (Masa 5 → Masa 6)</p>
					<p>• <strong>Masa 1 kazananı:</strong> Masa 1'de kalır</p>
					<p>• <strong>En alt masa kaybedeni:</strong> En alt masada kalır</p>
					<p>• <strong>Berabere durumunda:</strong> Her iki oyuncu da aynı masada kalır</p>
				</CardContent>
			</Card>
		</div>
	)
}
