import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { migrateDataFromSupabaseToNeon, migrateDataFromNeonToSupabase } from "@/lib/utils/data-migration"

export async function POST(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (!body.direction || !["supabase-to-neon", "neon-to-supabase"].includes(body.direction)) {
      return NextResponse.json({ error: "Invalid migration direction" }, { status: 400 })
    }

    let result

    if (body.direction === "supabase-to-neon") {
      result = await migrateDataFromSupabaseToNeon()
    } else {
      result = await migrateDataFromNeonToSupabase()
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to migrate data" }, { status: 500 })
  }
}
