"use client"

import { useState, useEffect } from "react"
import { usePusher } from "./realtime-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Message {
  id: string
  text: string
  timestamp: number
}

export function RealtimeExample() {
  const { pusherClient, loading, error } = usePusher()
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!pusherClient) return

    // Set up connection status listeners
    pusherClient.connection.bind("connected", () => {
      setConnected(true)
    })

    pusherClient.connection.bind("disconnected", () => {
      setConnected(false)
    })

    // Subscribe to a channel
    const channel = pusherClient.subscribe("updates")

    // Listen for events on the channel
    channel.bind("new-message", (data: Message) => {
      setMessages((prev) => [...prev, data])
    })

    return () => {
      // Clean up
      channel.unbind_all()
      pusherClient.unsubscribe("updates")
      pusherClient.connection.unbind_all()
    }
  }, [pusherClient])

  if (loading) {
    return <div>Loading realtime functionality...</div>
  }

  if (error) {
    return <div>Error loading realtime functionality: {error.message}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realtime Updates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span>{connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <div className="border rounded-md p-4 mb-4 h-40 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-muted-foreground">No messages yet</p>
          ) : (
            <ul className="space-y-2">
              {messages.map((msg) => (
                <li key={msg.id} className="border-b pb-2">
                  <p>{msg.text}</p>
                  <p className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button
          onClick={() => {
            // This would typically be handled by a server action
            // For demo purposes only
            const newMessage: Message = {
              id: Math.random().toString(36).substring(2, 9),
              text: "This is a test message",
              timestamp: Date.now(),
            }
            setMessages((prev) => [...prev, newMessage])
          }}
        >
          Simulate Message
        </Button>
      </CardContent>
    </Card>
  )
}
