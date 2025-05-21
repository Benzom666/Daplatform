"use client"

import PusherClient from "pusher-js"
import { useState, useEffect } from "react"
import { getPusherClientConfig } from "./pusher-server"

// Client-side Pusher hook
export function usePusherClient() {
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function initPusher() {
      try {
        // Get configuration from server action
        const config = await getPusherClientConfig()

        if (!isMounted) return

        // Create Pusher client with the configuration
        const client = new PusherClient(config.key, {
          cluster: config.cluster,
          forceTLS: true,
        })

        setPusherClient(client)
        setLoading(false)
      } catch (err) {
        console.error("Failed to initialize Pusher client:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    initPusher()

    return () => {
      isMounted = false
      // Cleanup Pusher connection when component unmounts
      if (pusherClient) {
        pusherClient.disconnect()
      }
    }
  }, [])

  return { pusherClient, loading, error }
}
