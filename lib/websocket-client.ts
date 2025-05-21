"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { toast } from "@/components/ui/use-toast"

// WebSocket event types
export type WebSocketEvent =
  | "order_created"
  | "order_updated"
  | "order_assigned"
  | "driver_location_updated"
  | "pod_submitted"

// WebSocket client hook
export function useWebSocket(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true)
      console.log("WebSocket connected")
    })

    socketInstance.on("disconnect", () => {
      setIsConnected(false)
      console.log("WebSocket disconnected")
    })

    socketInstance.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to real-time updates. Retrying...",
        variant: "destructive",
      })
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [token])

  // Subscribe to events
  const subscribe = (event: WebSocketEvent, callback: (data: any) => void) => {
    if (!socket) return () => {}

    socket.on(event, callback)
    return () => {
      socket.off(event, callback)
    }
  }

  // Emit events
  const emit = (event: string, data: any) => {
    if (!socket) return false

    socket.emit(event, data)
    return true
  }

  return {
    socket,
    isConnected,
    subscribe,
    emit,
  }
}
