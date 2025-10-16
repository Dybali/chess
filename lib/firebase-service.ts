import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { db } from "./firebase"

// Tournament Types
export interface Tournament {
  id?: string
  name: string
  description: string
  format: "swiss" | "round-robin" | "elimination"
  maxParticipants: number
  currentParticipants: number
  status: "upcoming" | "ongoing" | "completed"
  startDate: Date
  endDate?: Date
  entryFee: number
  prizePool: number
  createdBy: string
  createdAt: Date
  participants: string[]
  rounds: Round[]
}

export interface Round {
  roundNumber: number
  matches: Match[]
  status: "pending" | "ongoing" | "completed"
}

export interface Match {
  id: string
  player1Id: string
  player2Id: string
  result?: "player1" | "player2" | "draw"
  status: "pending" | "ongoing" | "completed"
}

export interface Player {
  id?: string
  uid: string
  displayName: string
  email: string
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  tournaments: string[]
  achievements: string[]
  createdAt: Date
  lastActive: Date
}

export interface Game {
  id?: string
  tournamentId: string
  player1Id: string
  player2Id: string
  result: "player1" | "player2" | "draw"
  moves: string[]
  duration: number
  createdAt: Date
}

// Tournament Services
export const tournamentService = {
  // Create tournament
  async create(tournament: Omit<Tournament, "id" | "createdAt">): Promise<string> {
    const docRef = await addDoc(collection(db, "tournaments"), {
      ...tournament,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  },

  // Get all tournaments
  async getAll(): Promise<Tournament[]> {
    const querySnapshot = await getDocs(query(collection(db, "tournaments"), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
    })) as Tournament[]
  },

  // Get tournament by ID
  async getById(id: string): Promise<Tournament | null> {
    const docSnap = await getDoc(doc(db, "tournaments", id))
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
      } as Tournament
    }
    return null
  },

  // Update tournament
  async update(id: string, updates: Partial<Tournament>): Promise<void> {
    await updateDoc(doc(db, "tournaments", id), updates)
  },

  // Join tournament
  async joinTournament(tournamentId: string, playerId: string): Promise<void> {
    const tournamentRef = doc(db, "tournaments", tournamentId)
    await updateDoc(tournamentRef, {
      participants: [...((await this.getById(tournamentId))?.participants || []), playerId],
      currentParticipants: increment(1),
    })
  },

  // Listen to tournament updates
  onTournamentUpdate(tournamentId: string, callback: (tournament: Tournament) => void) {
    return onSnapshot(doc(db, "tournaments", tournamentId), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
        } as Tournament)
      }
    })
  },
}

// Player Services
export const playerService = {
  // Create player profile
  async create(player: Omit<Player, "id" | "createdAt">): Promise<string> {
    const docRef = await addDoc(collection(db, "players"), {
      ...player,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  },

  // Get all players
  async getAll(): Promise<Player[]> {
    const querySnapshot = await getDocs(query(collection(db, "players"), orderBy("rating", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastActive: doc.data().lastActive?.toDate(),
    })) as Player[]
  },

  // Get player by ID
  async getById(id: string): Promise<Player | null> {
    const docSnap = await getDoc(doc(db, "players", id))
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        lastActive: data.lastActive?.toDate(),
      } as Player
    }
    return null
  },

  // Get player by UID
  async getByUid(uid: string): Promise<Player | null> {
    const q = query(collection(db, "players"), where("uid", "==", uid))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        lastActive: data.lastActive?.toDate(),
      } as Player
    }
    return null
  },

  // Update player
  async update(id: string, updates: Partial<Player>): Promise<void> {
    await updateDoc(doc(db, "players", id), {
      ...updates,
      lastActive: serverTimestamp(),
    })
  },

  // Update player rating
  async updateRating(playerId: string, newRating: number): Promise<void> {
    await updateDoc(doc(db, "players", playerId), {
      rating: newRating,
      lastActive: serverTimestamp(),
    })
  },

  // Get top players
  async getTopPlayers(limitCount = 10): Promise<Player[]> {
    const q = query(collection(db, "players"), orderBy("rating", "desc"), limit(limitCount))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastActive: doc.data().lastActive?.toDate(),
    })) as Player[]
  },
}

// Game Services
export const gameService = {
  // Create game
  async create(game: Omit<Game, "id" | "createdAt">): Promise<string> {
    const docRef = await addDoc(collection(db, "games"), {
      ...game,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  },

  // Get games by tournament
  async getByTournament(tournamentId: string): Promise<Game[]> {
    const q = query(collection(db, "games"), where("tournamentId", "==", tournamentId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Game[]
  },

  // Get games by player
  async getByPlayer(playerId: string): Promise<Game[]> {
    const q1 = query(collection(db, "games"), where("player1Id", "==", playerId))
    const q2 = query(collection(db, "games"), where("player2Id", "==", playerId))

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)])

    const games = [
      ...snapshot1.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })),
      ...snapshot2.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })),
    ] as Game[]

    return games.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },
}

// Statistics Services
export const statsService = {
  // Get overall statistics
  async getOverallStats() {
    const [tournaments, players, games] = await Promise.all([
      getDocs(collection(db, "tournaments")),
      getDocs(collection(db, "players")),
      getDocs(collection(db, "games")),
    ])

    return {
      totalTournaments: tournaments.size,
      totalPlayers: players.size,
      totalGames: games.size,
      activeTournaments: tournaments.docs.filter((doc) => doc.data().status === "ongoing").length,
    }
  },
}
