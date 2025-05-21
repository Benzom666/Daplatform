import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, BarChart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Delivery Management System</h1>
          <p className="mt-2">Efficiently manage your delivery operations</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>Order Management</span>
              </CardTitle>
              <CardDescription>View and manage all delivery orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Track order status, assign drivers, and manage customer information all in one place.</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard" className="w-full">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <span>Driver Portal</span>
              </CardTitle>
              <CardDescription>Driver mobile application</CardDescription>
            </CardHeader>
            <CardContent>
              <p>View assigned deliveries, update order status, and get navigation assistance.</p>
            </CardContent>
            <CardFooter>
              <Link href="/driver-app" className="w-full">
                <Button className="w-full" variant="outline">
                  Driver App
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                <span>Analytics</span>
              </CardTitle>
              <CardDescription>Delivery performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Get insights into delivery times, driver performance, and customer satisfaction.</p>
            </CardContent>
            <CardFooter>
              <Link href="/dashboard/analytics" className="w-full">
                <Button className="w-full" variant="outline">
                  View Analytics
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Delivery Management System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
