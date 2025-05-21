"use server"

import Pusher from "pusher"
import PusherClient from "pusher-js"
import { serverConfig } from "./config"

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: serverConfig.pusher.appId,
  key: serverConfig.pusher.key,
  secret: serverConfig.pusher.secret,
  cluster: serverConfig.pusher.cluster,
  useTLS: true,
})

// Function to get Pusher client configuration (safe to use in client components)
export async function getPusherClientConfig() {
  return {
    key: serverConfig.pusher.key,
    cluster: serverConfig.pusher.cluster,
  }
}

// Helper function to initialize Pusher client (to be called from client components)
export async function initPusherClient() {
  const config = await getPusherClientConfig()
  return new PusherClient(config.key, {
    cluster: config.cluster,
    forceTLS: true,
  })
}
