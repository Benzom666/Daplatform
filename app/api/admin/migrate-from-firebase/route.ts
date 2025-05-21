import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { migrateFromFirebaseToNeon } from "@/lib/utils/firebase-to-neon-migration"

export async function POST(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await migrateFromFirebaseToNeon()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to migrate data" }, { status: 500 })
  }
}
