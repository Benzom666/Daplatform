"use server"

import Pusher from "pusher"

// Server-side Pusher instance
// This file should only be imported in server components or server actions
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "",
  useTLS: true,
})

// Function to get Pusher client configuration (safe to use in client components)
// This function doesn't expose the actual environment variable, just its value
export async function getPusherClientConfig() {
  return {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
    cluster: process.env.PUSHER_CLUSTER || "",
  }
}
