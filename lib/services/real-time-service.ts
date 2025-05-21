import Pusher from "pusher"
import { config } from "../config"
import type { OrderStatus, DriverStatus } from "../types"
import { supabaseAdmin } from "../supabase/admin"

// Initialize Pusher
const pusher = new Pusher({
  appId: config.pusher.appId,
  key: config.pusher.key,
  secret: config.pusher.secret,
  cluster: config.pusher.cluster,
  useTLS: true,
})

export class RealTimeService {
  // Notify about new order
  static async notifyNewOrder(orderId: number): Promise<void> {
    await pusher.trigger("orders", "new-order", {
      orderId,
      timestamp: new Date().toISOString(),
    })
  }

  // Notify about order status change
  static async notifyOrderStatusChange(orderId: number, status: OrderStatus): Promise<void> {
    await pusher.trigger("orders", "status-change", {
      orderId,
      status,
      timestamp: new Date().toISOString(),
    })

    // Also trigger on the specific order channel
    await pusher.trigger(`order-${orderId}`, "status-change", {
      status,
      timestamp: new Date().toISOString(),
    })
  }

  // Notify about driver assignment
  static async notifyDriverAssigned(orderId: number, driverId: number): Promise<void> {
    await pusher.trigger("orders", "driver-assigned", {
      orderId,
      driverId,
      timestamp: new Date().toISOString(),
    })

    // Also trigger on the specific order and driver channels
    await pusher.trigger(`order-${orderId}`, "driver-assigned", {
      driverId,
      timestamp: new Date().toISOString(),
    })

    await pusher.trigger(`driver-${driverId}`, "order-assigned", {
      orderId,
      timestamp: new Date().toISOString(),
    })
  }

  // Notify about driver status change
  static async notifyDriverStatusChange(driverId: number, status: DriverStatus): Promise<void> {
    await pusher.trigger("drivers", "status-change", {
      driverId,
      status,
      timestamp: new Date().toISOString(),
    })
  }

  // Notify about driver location change
  static async notifyDriverLocationChange(
    driverId: number,
    location: { latitude: number; longitude: number; timestamp: string },
  ): Promise<void> {
    await pusher.trigger(`driver-${driverId}`, "location-change", {
      ...location,
    })

    // If the driver has an active order, also notify on the order channel
    const { data: driver } = await supabaseAdmin.from("drivers").select("active_order_id").eq("id", driverId).single()

    if (driver && driver.active_order_id) {
      await pusher.trigger(`order-${driver.active_order_id}`, "driver-location", {
        driverId,
        ...location,
      })
    }
  }

  // Notify about proof of delivery
  static async notifyProofOfDelivery(orderId: number): Promise<void> {
    await pusher.trigger(`order-${orderId}`, "proof-of-delivery", {
      orderId,
      timestamp: new Date().toISOString(),
    })

    await pusher.trigger("orders", "proof-of-delivery", {
      orderId,
      timestamp: new Date().toISOString(),
    })
  }
}
