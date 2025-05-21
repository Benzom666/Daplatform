import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import { authenticateRequest } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["driver"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Ensure driver can only update their own location
  if (user.type !== "driver" || user.id !== Number.parseInt(params.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = getServerClient()

    // Validate required fields
    if (body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update driver's last location
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .update({
        last_location_lat: body.latitude,
        last_location_lng: body.longitude,
        last_location_updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (driverError) {
      return NextResponse.json({ error: driverError.message }, { status: 500 })
    }

    // Record location history
    const { error: locationError } = await supabase.from("driver_locations").insert({
      driver_id: params.id,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy || null,
    })

    if (locationError) {
      console.error("Failed to record location history:", locationError)
    }

    return NextResponse.json({
      success: true,
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
        updated_at: driver.last_location_updated_at,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update location" }, { status: 500 })
  }
}
