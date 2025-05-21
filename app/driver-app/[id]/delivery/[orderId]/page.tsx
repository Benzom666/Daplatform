import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MapPin, Navigation, Phone, Package, CheckCircle } from "lucide-react"
import { DeliveryMap } from "@/components/driver/delivery-map"
import { geocodeAddress } from "@/lib/services/geocoding-service"

export default async function DeliveryDetailPage({
  params,
}: {
  params: { id: string; orderId: string }
}) {
  const supabase = getServerClient()

  // Get driver
  const { data: driver, error: driverError } = await supabase.from("drivers").select("*").eq("id", params.id).single()

  if (driverError || !driver) {
    notFound()
  }

  // Get order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*),
      items:order_items(*)
    `)
    .eq("id", params.orderId)
    .single()

  if (orderError || !order || order.driver_id !== driver.id) {
    notFound()
  }

  // Try to geocode the address for the map
  let coordinates = null
  if (order.delivery_address) {
    coordinates = await geocodeAddress(order.delivery_address)
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container flex h-16 items-center gap-4 py-4">
          <Link href={`/driver-app/${driver.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Delivery Details</h1>
          <div className="ml-auto">
            <div className="px-2 py-1 rounded-full bg-muted text-xs font-medium capitalize">
              {order.status.replace("_", " ")}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 space-y-6 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>{order.customer.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm">{order.customer.phone}</div>
              <Button variant="outline" size="sm" className="gap-1">
                <Phone className="h-4 w-4" />
                Call
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium">Delivery Address</p>
              <p className="text-sm flex items-start gap-1 mt-1">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{order.delivery_address}</span>
              </p>
            </div>

            <DeliveryMap
              deliveryAddress={order.delivery_address}
              latitude={coordinates?.lat}
              longitude={coordinates?.lng}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Order #{order.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Items</p>
              <ul className="text-sm mt-1 space-y-1">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between border-b pb-2 last:border-0">
                    <span>
                      {item.item_name} x{item.quantity}
                    </span>
                    <span>${item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {order.delivery_instructions && (
              <div>
                <p className="text-sm font-medium">Delivery Notes</p>
                <p className="text-sm mt-1 p-2 bg-muted rounded-md">{order.delivery_instructions}</p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-sm font-medium">Total</p>
              <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Status</CardTitle>
            <CardDescription>Update the current status of this delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <span className="text-sm capitalize">{order.status.replace("_", " ")}</span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width:
                        order.status === "assigned"
                          ? "25%"
                          : order.status === "picked_up"
                            ? "50%"
                            : order.status === "in_transit"
                              ? "75%"
                              : order.status === "delivered"
                                ? "100%"
                                : "0%",
                    }}
                  />
                </div>
              </div>

              {order.status === "assigned" && (
                <form action={`/api/orders/${order.id}/status`} method="POST">
                  <input type="hidden" name="status" value="picked_up" />
                  <Button className="w-full gap-2" type="submit">
                    <Package className="h-4 w-4" />
                    Mark as Picked Up
                  </Button>
                </form>
              )}

              {order.status === "picked_up" && (
                <form action={`/api/orders/${order.id}/status`} method="POST">
                  <input type="hidden" name="status" value="in_transit" />
                  <Button className="w-full gap-2" type="submit">
                    <Navigation className="h-4 w-4" />
                    Start Delivery
                  </Button>
                </form>
              )}

              {order.status === "in_transit" && (
                <Link href={`/driver-app/${driver.id}/delivery/${order.id}/pod`}>
                  <Button className="w-full gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Complete Delivery
                  </Button>
                </Link>
              )}

              {order.status === "delivered" && (
                <Button className="w-full" disabled>
                  Delivery Completed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
