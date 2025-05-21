import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import { authenticateRequest } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin", "dispatcher"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = getServerClient()

    // Validate required fields
    if (!body.driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    // Check if order exists and is pending
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", params.id)
      .single()

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not in pending status" }, { status: 400 })
    }

    // Check if driver is available
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("status")
      .eq("id", body.driverId)
      .single()

    if (driverError) {
      if (driverError.code === "PGRST116") {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 })
      }
      return NextResponse.json({ error: driverError.message }, { status: 500 })
    }

    if (driver.status !== "available") {
      return NextResponse.json({ error: "Driver is not available" }, { status: 400 })
    }

    // Update order
    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from("orders")
      .update({
        driver_id: body.driverId,
        status: "assigned",
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateOrderError) {
      return NextResponse.json({ error: updateOrderError.message }, { status: 500 })
    }

    // Update driver status
    const { error: updateDriverError } = await supabase
      .from("drivers")
      .update({
        status: "busy",
        active_order_id: params.id,
      })
      .eq("id", body.driverId)

    if (updateDriverError) {
      return NextResponse.json({ error: updateDriverError.message }, { status: 500 })
    }

    // Record status history
    await supabase.from("order_status_history").insert({
      order_id: params.id,
      previous_status: "pending",
      new_status: "assigned",
      changed_by: user.id,
      is_driver: false,
      notes: `Assigned to driver ${body.driverId}`,
    })

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to assign driver" }, { status: 500 })
  }
}
