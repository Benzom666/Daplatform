import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Package, User, Clock } from "lucide-react"
import { LocationTracker } from "@/components/driver/location-tracker"

export default async function DriverHomePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = getServerClient()

  // Get driver
  const { data: driver, error: driverError } = await supabase.from("drivers").select("*").eq("id", params.id).single()

  if (driverError || !driver) {
    notFound()
  }

  // Get active order if any
  const { data: activeOrder } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*)
    `)
    .eq("driver_id", driver.id)
    .in("status", ["assigned", "picked_up", "in_transit"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Get recent completed orders
  const { data: completedOrders } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(name)
    `)
    .eq("driver_id", driver.id)
    .eq("status", "delivered")
    .order("created_at", { ascending: false })
    .limit(5)

  // Determine if location tracking should be active
  const isLocationTrackingActive = driver.status === "busy" && !!activeOrder

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-bold">Driver Portal</h1>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                driver.status === "available"
                  ? "bg-green-100 text-green-800"
                  : driver.status === "busy"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 space-y-6 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Driver Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-lg">{driver.name}</h3>
                  <p className="text-sm text-muted-foreground">{driver.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={driver.status === "busy"}
                  formAction={`/api/drivers/${driver.id}/status?status=${driver.status === "available" ? "offline" : "available"}`}
                >
                  {driver.status === "available" ? "Go Offline" : "Go Online"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm font-medium">Vehicle</p>
                  <p className="text-sm">{driver.vehicle || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">License Plate</p>
                  <p className="text-sm">{driver.license_plate || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm">{driver.phone || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Rating</p>
                  <p className="text-sm">{driver.rating?.toFixed(1) || "5.0"} / 5.0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeOrder ? (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Delivery
              </CardTitle>
              <CardDescription>Order #{activeOrder.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{activeOrder.customer?.name}</p>
                    <p className="text-sm text-muted-foreground">{activeOrder.customer?.phone}</p>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-muted text-xs font-medium capitalize">
                    {activeOrder.status.replace("_", " ")}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Delivery Address</p>
                  <p className="text-sm flex items-start gap-1 mt-1">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{activeOrder.delivery_address}</span>
                  </p>
                </div>

                {activeOrder.estimated_delivery_time && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Estimated Delivery
                    </p>
                    <p className="text-sm mt-1">{new Date(activeOrder.estimated_delivery_time).toLocaleString()}</p>
                  </div>
                )}

                <Link href={`/driver-app/${driver.id}/delivery/${activeOrder.id}`}>
                  <Button className="w-full">Manage Delivery</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Deliveries</CardTitle>
              <CardDescription>You don't have any active deliveries at the moment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">When you're assigned a delivery, it will appear here.</p>
            </CardContent>
          </Card>
        )}

        {completedOrders && completedOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completed Deliveries</CardTitle>
              <CardDescription>Your recent delivery history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{order.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.updated_at).toLocaleString()}</p>
                    </div>
                    <div className="text-sm font-medium">${order.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Location tracker component */}
      <LocationTracker driverId={Number.parseInt(params.id)} isActive={isLocationTrackingActive} />
    </div>
  )
}
