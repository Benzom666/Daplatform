"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useFirebaseAuth } from "./useFirebaseAuth"
import { driverLocationService, orderService, podService } from "./firestore-service"

// Create context
interface FirebaseContextType {
  auth: ReturnType<typeof useFirebaseAuth>
  driverLocationService: typeof driverLocationService
  orderService: typeof orderService
  podService: typeof podService
}

const FirebaseContext = createContext<FirebaseContextType | null>(null)

// Provider component
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth()

  const value = {
    auth,
    driverLocationService,
    orderService,
    podService,
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

// Hook to use the Firebase context
export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}
