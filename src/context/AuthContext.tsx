import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { getFirebaseInitError, getFirebaseServices } from '../lib/firebase'
import type { UserProfile, UserRole } from '../types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'letterheadUrl'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initError = getFirebaseInitError()
    if (initError) {
      setLoading(false)
      return
    }

    const { auth, db } = getFirebaseServices()
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile)
        } else {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { auth } = getFirebaseServices()
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => {
    const { auth, db } = getFirebaseServices()
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    const profileData: UserProfile = {
      uid: newUser.uid,
      email: newUser.email!,
      displayName,
      role,
    }
    await setDoc(doc(db, 'users', newUser.uid), profileData)
    setProfile(profileData)
  }

  const signOut = async () => {
    const { auth } = getFirebaseServices()
    await firebaseSignOut(auth)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'displayName' | 'letterheadUrl'>>) => {
    if (!user) return
    const { db } = getFirebaseServices()
    const ref = doc(db, 'users', user.uid)
    await updateDoc(ref, updates as Record<string, unknown>)
    const snap = await getDoc(ref)
    if (snap.exists()) setProfile(snap.data() as UserProfile)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
