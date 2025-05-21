"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { usePusherClient } from "@/lib/pusher-client"

// Create context for Pusher client
const PusherContext = createContext<{
  pusherClient: any
  loading: boolean
  error: Error | null
}>({
  pusherClient: null,
  loading: true,
  error: null,
})

export function usePusher() {
  return useContext(PusherContext)
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const pusherState = usePusherClient()

  return (
    <PusherContext.Provider value={pusherState}>
      {pusherState.loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
          <span className="text-sm text-muted-foreground">Loading realtime service...</span>
        </div>
      ) : pusherState.error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>Failed to initialize realtime service. Some features may not work properly.</p>
          <p className="text-sm">{pusherState.error.message}</p>
        </div>
      ) : (
        children
      )}
    </PusherContext.Provider>
  )
}
