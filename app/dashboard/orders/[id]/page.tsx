import Link from "next/link"
import { notFound } from "next/navigation"
import { getServerClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Phone, User, Package, Clock, Truck } from "lucide-react"
import { ProofOfDeliveryView } from "./proof-of-delivery-view"

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = getServerClient()

  // Get order with related data
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*),
      driver:drivers(*),
      items:order_items(*)
    `)
    .eq("id", params.id)
    .single()

  if (error || !order) {
    notFound()
  }

  // Get proof of delivery if order is delivered
  let pod = null
  if (order.status === "delivered") {
    const { data: podData } = await supabase.from("proof_of_delivery").select("*").eq("order_id", params.id).single()

    pod = podData
  }

  // Get available drivers for assignment
  const { data: availableDrivers } = await supabase.from("drivers").select("*").eq("status", "available").order("name")

  // Get order status history
  const { data: statusHistory } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", params.id)
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Order Details</h2>
        <div className="ml-auto">
          <div className="px-3 py-1 rounded-full text-xs font-medium capitalize bg-muted">
            {order.status.replace("_", " ")}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
            <CardDescription>Order #{order.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Created:</span>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            {order.estimated_delivery_time && (
              <div className="flex justify-between">
                <span className="font-medium">Estimated Delivery:</span>
                <span>{new Date(order.estimated_delivery_time).toLocaleString()}</span>
              </div>
            )}
            {order.actual_delivery_time && (
              <div className="flex justify-between">
                <span className="font-medium">Delivered At:</span>
                <span>{new Date(order.actual_delivery_time).toLocaleString()}</span>
              </div>
            )}
            {order.delivery_instructions && (
              <div>
                <span className="font-medium">Delivery Instructions:</span>
                <p className="mt-1 text-sm">{order.delivery_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
            <CardDescription>{order.customer.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Email:</span>
              <p className="mt-1 text-sm">{order.customer.email || "Not provided"}</p>
            </div>
            <div>
              <span className="font-medium">Phone:</span>
              <p className="mt-1 text-sm flex items-center gap-2">
                {order.customer.phone}
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Phone className="h-3 w-3" />
                </Button>
              </p>
            </div>
            <div>
              <span className="font-medium">Delivery Address:</span>
              <p className="mt-1 text-sm flex items-start gap-1">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{order.delivery_address}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="py-2 flex justify-between">
                  <div>
                    <span className="font-medium">{item.item_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <span>${item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t flex justify-between font-medium">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Management
            </CardTitle>
            <CardDescription>
              {order.driver ? `Assigned to ${order.driver.name}` : "No driver assigned yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.status === "pending" && (
              <div>
                <h4 className="text-sm font-medium mb-2">Assign Driver</h4>
                <div className="grid gap-2">
                  {availableDrivers && availableDrivers.length > 0 ? (
                    availableDrivers.map((driver) => (
                      <form key={driver.id} action={`/api/orders/${order.id}/assign`} method="POST">
                        <input type="hidden" name="driverId" value={driver.id} />
                        <Button variant="outline" className="w-full justify-start h-auto py-2" type="submit">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{driver.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {driver.vehicle} • {driver.license_plate}
                            </span>
                          </div>
                        </Button>
                      </form>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No available drivers at the moment</div>
                  )}
                </div>
              </div>
            )}

            {order.driver && (
              <div>
                <h4 className="text-sm font-medium mb-2">Driver Information</h4>
                <div className="text-sm space-y-1">
                  <p>Name: {order.driver.name}</p>
                  <p>Phone: {order.driver.phone || "Not provided"}</p>
                  <p>
                    Vehicle: {order.driver.vehicle} ({order.driver.license_plate})
                  </p>
                  <p>
                    Status: <span className="capitalize">{order.driver.status}</span>
                  </p>
                </div>
              </div>
            )}

            {statusHistory && statusHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Order Timeline</h4>
                <ol className="relative border-l border-muted-foreground/20 ml-3 space-y-4">
                  {statusHistory.map((event) => (
                    <li key={event.id} className="ml-6">
                      <span className="absolute flex items-center justify-center w-6 h-6 bg-muted rounded-full -left-3">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                      </span>
                      <h3 className="flex items-center text-sm font-semibold capitalize">
                        {event.new_status.replace("_", " ")}
                      </h3>
                      <time className="block text-xs font-normal text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </time>
                      {event.notes && <p className="text-xs mt-1">{event.notes}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {pod && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Proof of Delivery</h3>
          <ProofOfDeliveryView pod={pod} />
        </div>
      )}
    </div>
  )
}
