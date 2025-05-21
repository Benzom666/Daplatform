import type { Server as HTTPServer } from "http"
import { Server as WebSocketServer } from "socket.io"
import { verifyToken, type UserJwtPayload } from "./auth"

// Define event types
export type WebSocketEvent =
  | "order_created"
  | "order_updated"
  | "order_assigned"
  | "driver_location_updated"
  | "pod_submitted"

// Initialize WebSocket server
export const initWebSocketServer = (httpServer: HTTPServer) => {
  const io = new WebSocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error"))
    }

    const user = verifyToken(token)

    if (!user) {
      return next(new Error("Authentication error"))
    }

    // Attach user to socket
    socket.data.user = user
    next()
  })

  // Connection handler
  io.on("connection", (socket) => {
    const user = socket.data.user as UserJwtPayload

    console.log(`User connected: ${user.name} (${user.role})`)

    // Join appropriate rooms based on user role
    if (user.role === "admin" || user.role === "dispatcher") {
      socket.join("dispatchers")
    } else if (user.role === "driver") {
      socket.join(`driver:${user.id}`)
    }

    // Handle driver location updates
    socket.on("update_location", async (data: { lat: number; lng: number; accuracy?: number }) => {
      if (user.role !== "driver") {
        return
      }

      // Broadcast to dispatchers
      io.to("dispatchers").emit("driver_location_updated", {
        driverId: user.id,
        location: data,
      })
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.name} (${user.role})`)
    })
  })

  return io
}

// Emit event to specific rooms or users
export const emitEvent = (
  io: WebSocketServer,
  event: WebSocketEvent,
  data: any,
  target?: { type: "user" | "driver" | "dispatchers"; id?: number },
) => {
  if (!target) {
    // Broadcast to all connected clients
    io.emit(event, data)
    return
  }

  if (target.type === "dispatchers") {
    // Broadcast to all dispatchers
    io.to("dispatchers").emit(event, data)
  } else if (target.type === "driver" && target.id) {
    // Send to specific driver
    io.to(`driver:${target.id}`).emit(event, data)
  }
}
