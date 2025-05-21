import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { getServerClient } from "@/lib/supabase"
import { testNeonConnection } from "@/lib/utils/test-neon-connection"
import { serverConfig } from "@/lib/config"

export async function GET(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin", "dispatcher", "manager"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const statuses = []
    const configInfo = {
      defaultDatabase: serverConfig.database.default,
    }

    // Check Supabase status
    try {
      const startTime = Date.now()
      const supabase = getServerClient()
      const { data, error } = await supabase.from("users").select("id").limit(1)

      if (error) {
        statuses.push({
          name: "Supabase",
          connected: false,
          error: error.message,
          connectionDetails: {
            url: serverConfig.database.supabase.url ? "Configured" : "Not configured",
          },
        })
      } else {
        const latency = Date.now() - startTime
        statuses.push({
          name: "Supabase",
          connected: true,
          latency,
          connectionDetails: {
            url: serverConfig.database.supabase.url ? "Configured" : "Not configured",
          },
        })
      }
    } catch (error: any) {
      statuses.push({
        name: "Supabase",
        connected: false,
        error: error.message,
        connectionDetails: {
          url: serverConfig.database.supabase.url ? "Configured" : "Not configured",
        },
      })
    }

    // Check Neon status (pooled connection)
    try {
      const neonStatus = await testNeonConnection(false)

      statuses.push({
        name: "Neon (Pooled)",
        connected: neonStatus.connected,
        latency: neonStatus.latency,
        error: neonStatus.error,
        version: neonStatus.version,
        connectionDetails: {
          url: serverConfig.database.neon.url ? "Configured" : "Not configured",
          host: serverConfig.database.neon.host,
          database: serverConfig.database.neon.database,
        },
      })
    } catch (error: any) {
      statuses.push({
        name: "Neon (Pooled)",
        connected: false,
        error: error.message,
        connectionDetails: {
          url: serverConfig.database.neon.url ? "Configured" : "Not configured",
          host: serverConfig.database.neon.host,
          database: serverConfig.database.neon.database,
        },
      })
    }

    // Check Neon status (unpooled connection)
    try {
      const neonUnpooledStatus = await testNeonConnection(true)

      statuses.push({
        name: "Neon (Unpooled)",
        connected: neonUnpooledStatus.connected,
        latency: neonUnpooledStatus.latency,
        error: neonUnpooledStatus.error,
        version: neonUnpooledStatus.version,
        connectionDetails: {
          url: serverConfig.database.neon.urlUnpooled ? "Configured" : "Not configured",
          host: serverConfig.database.neon.hostUnpooled,
          database: serverConfig.database.neon.database,
        },
      })
    } catch (error: any) {
      statuses.push({
        name: "Neon (Unpooled)",
        connected: false,
        error: error.message,
        connectionDetails: {
          url: serverConfig.database.neon.urlUnpooled ? "Configured" : "Not configured",
          host: serverConfig.database.neon.hostUnpooled,
          database: serverConfig.database.neon.database,
        },
      })
    }

    return NextResponse.json({
      statuses,
      config: configInfo,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check database status" }, { status: 500 })
  }
}
