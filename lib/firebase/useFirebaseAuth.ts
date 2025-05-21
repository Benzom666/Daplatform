"use client"

import { useState, useEffect } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "./firebase-config"

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      await createUserWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
  }
}
