// Configuration for the application

// Server-side only configuration (not accessible in client components)
// This file should only be imported in server components or server actions
export const serverConfig = {
  // Database configuration
  database: {
    default: process.env.DEFAULT_DATABASE || "neon",
    neon: {
      url: process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL || "",
      urlUnpooled: process.env.DATABASE_URL_UNPOOLED || "",
      host: process.env.PGHOST || "",
      hostUnpooled: process.env.PGHOST_UNPOOLED || "",
      database: process.env.PGDATABASE || "",
    },
    supabase: {
      url: process.env.SUPABASE_URL || "",
      anonKey: process.env.SUPABASE_ANON_KEY || "",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    },
  },

  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || "your-secret-key",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },

  // Pusher configuration for realtime updates (server-side only)
  pusher: {
    appId: process.env.PUSHER_APP_ID || "",
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || "", // We'll handle this safely in pusher-server.ts
    secret: process.env.PUSHER_SECRET || "",
    cluster: process.env.PUSHER_CLUSTER || "",
  },
}

// Client-side safe configuration (can be accessed in client components)
export const clientConfig = {
  // Application URLs
  urls: {
    frontend: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    websocket: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001",
  },
}

// Export a combined config for backward compatibility
export const config = {
  ...serverConfig,
  ...clientConfig,
  database: {
    ...serverConfig.database,
  },
  urls: {
    ...clientConfig.urls,
  },
  pusher: {
    ...serverConfig.pusher,
  },
  auth: {
    ...serverConfig.auth,
  },
}
