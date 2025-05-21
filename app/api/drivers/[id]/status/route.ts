import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import { authenticateRequest } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["driver"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Ensure driver can only update their own status
  if (user.type !== "driver" || user.id !== Number.parseInt(params.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = getServerClient()

    // Validate status
    if (!body.status || !["available", "offline"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Check if driver is busy with an active order
    const { data: driver } = await supabase
      .from("drivers")
      .select("status, active_order_id")
      .eq("id", params.id)
      .single()

    if (driver?.status === "busy" && driver?.active_order_id) {
      return NextResponse.json({ error: "Cannot change status while on an active delivery" }, { status: 400 })
    }

    // Update driver status
    const { data: updatedDriver, error } = await supabase
      .from("drivers")
      .update({ status: body.status })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      driver: {
        id: updatedDriver.id,
        status: updatedDriver.status,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 })
  }
}
