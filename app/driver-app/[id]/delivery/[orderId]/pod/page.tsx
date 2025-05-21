import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ProofOfDelivery } from "@/components/driver/proof-of-delivery"

export default async function ProofOfDeliveryPage({
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
      customer:customers(*)
    `)
    .eq("id", params.orderId)
    .single()

  if (orderError || !order || order.driver_id !== driver.id) {
    notFound()
  }

  // Check if order is in a valid state for POD
  if (order.status !== "in_transit" && order.status !== "picked_up") {
    // Redirect to order details
    return (
      <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container flex h-16 items-center gap-4 py-4">
            <Link href={`/driver-app/${driver.id}/delivery/${order.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Not Available</h1>
          </div>
        </header>

        <main className="flex-1 container py-6 space-y-6 max-w-md mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
            <h2 className="font-medium mb-2">Order Not Ready for Delivery Confirmation</h2>
            <p>
              This order is not in the correct state for proof of delivery. The order must be in transit or picked up
              before it can be delivered.
            </p>
            <div className="mt-4">
              <Link href={`/driver-app/${driver.id}/delivery/${order.id}`}>
                <Button variant="outline" size="sm">
                  Return to Order
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container flex h-16 items-center gap-4 py-4">
          <Link href={`/driver-app/${driver.id}/delivery/${order.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Complete Delivery</h1>
        </div>
      </header>

      <main className="flex-1 container py-6 space-y-6 max-w-md mx-auto">
        <ProofOfDelivery orderId={Number.parseInt(params.orderId)} driverId={Number.parseInt(params.id)} />
      </main>
    </div>
  )
}
