"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { playerService, type Player } from "@/lib/firebase-service"

interface AuthContextType {
  user: User | null
  player: Player | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          // Get or create player profile
          let playerProfile = await playerService.getByUid(user.uid)

          if (!playerProfile) {
            // Create new player profile
            const playerId = await playerService.create({
              uid: user.uid,
              displayName: user.displayName || user.email?.split("@")[0] || "Oyuncu",
              email: user.email || "",
              rating: 1200, // Starting ELO rating
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              tournaments: [],
              achievements: [],
              lastActive: new Date(),
            })

            playerProfile = await playerService.getById(playerId)
          }

          setPlayer(playerProfile)
        } catch (error) {
          console.error("Error loading player profile:", error)
        }
      } else {
        setPlayer(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured")
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error("Firebase not configured")
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
  }

  const logout = async () => {
    if (!auth) throw new Error("Firebase not configured")
    await signOut(auth)
  }

  const value = {
    user,
    player,
    loading,
    signIn,
    signUp,
    logout,
    isConfigured: isFirebaseConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
