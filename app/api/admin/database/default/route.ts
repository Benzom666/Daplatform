import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { DatabaseService } from "@/lib/services/database-service"

export async function POST(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (!body.database || !["supabase", "neon", "both"].includes(body.database)) {
      return NextResponse.json({ error: "Invalid database selection" }, { status: 400 })
    }

    // Set the default database
    DatabaseService.setDefaultDb(body.database)

    return NextResponse.json({
      success: true,
      database: body.database,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to set default database" }, { status: 500 })
  }
}
