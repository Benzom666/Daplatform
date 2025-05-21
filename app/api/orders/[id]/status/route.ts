import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import { authenticateRequest } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin", "dispatcher", "driver"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = getServerClient()

    // Validate required fields
    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status, driver_id")
      .eq("id", params.id)
      .single()

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // If user is a driver, ensure they can only update their own orders
    if (user.type === "driver" && order.driver_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ["assigned", "cancelled"],
      assigned: ["picked_up", "cancelled"],
      picked_up: ["in_transit", "cancelled"],
      in_transit: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    }

    if (!validTransitions[order.status].includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${order.status} to ${body.status}` },
        { status: 400 },
      )
    }

    // Update order status
    const updateData: any = {
      status: body.status,
    }

    // If status is delivered, set actual delivery time
    if (body.status === "delivered") {
      updateData.actual_delivery_time = new Date().toISOString()
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Record status history
    await supabase.from("order_status_history").insert({
      order_id: params.id,
      previous_status: order.status,
      new_status: body.status,
      changed_by: user.id,
      is_driver: user.type === "driver",
      notes: body.notes || null,
    })

    // If order is delivered or cancelled, update driver status
    if ((body.status === "delivered" || body.status === "cancelled") && updatedOrder.driver_id) {
      await supabase
        .from("drivers")
        .update({
          status: "available",
          active_order_id: null,
        })
        .eq("id", updatedOrder.driver_id)
    }

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 })
  }
}
