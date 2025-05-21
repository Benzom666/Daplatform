"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OpenStreetMap } from "@/components/dashboard/open-street-map"
import { DeliveryMap } from "@/components/driver/delivery-map"

// Sample data for preview
const sampleDrivers = [
  {
    id: 1,
    name: "John Driver",
    last_location_lat: 37.7749,
    last_location_lng: -122.4194,
    last_location_updated_at: new Date().toISOString(),
    status: "available" as const,
    active_order_id: null,
  },
  {
    id: 2,
    name: "Jane Driver",
    last_location_lat: 37.7833,
    last_location_lng: -122.4167,
    last_location_updated_at: new Date().toISOString(),
    status: "busy" as const,
    active_order_id: 101,
  },
  {
    id: 3,
    name: "Sam Driver",
    last_location_lat: 37.7694,
    last_location_lng: -122.4862,
    last_location_updated_at: new Date().toISOString(),
    status: "offline" as const,
    active_order_id: null,
  },
]

const sampleOrders = [
  {
    id: 101,
    delivery_address: "123 Market St, San Francisco, CA",
    status: "in_transit" as const,
    driver_id: 2,
    latitude: 37.7935,
    longitude: -122.3964,
  },
  {
    id: 102,
    delivery_address: "456 Mission St, San Francisco, CA",
    status: "pending" as const,
    driver_id: null,
    latitude: 37.7877,
    longitude: -122.4005,
  },
]

export default function MapPreviewPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const handleDriverSelect = (driverId: number) => {
    setSelectedDriverId(driverId)
    console.log(`Selected driver: ${driverId}`)
  }

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId(orderId)
    console.log(`Selected order: ${orderId}`)
  }

  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-3xl font-bold">Delivery Management System Map Preview</h1>
      <p className="text-muted-foreground">
        This page demonstrates the OpenStreetMap integration for both the dashboard and driver views.
      </p>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard Map</TabsTrigger>
          <TabsTrigger value="driver">Driver Delivery Map</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Map View</CardTitle>
              <CardDescription>Shows all active drivers and orders. Click on markers to select them.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <OpenStreetMap
                  drivers={sampleDrivers}
                  orders={sampleOrders}
                  onDriverSelect={handleDriverSelect}
                  onOrderSelect={handleOrderSelect}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Selected Driver</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDriverId ? (
                  <div>{sampleDrivers.find((d) => d.id === selectedDriverId)?.name || "Driver not found"}</div>
                ) : (
                  <div className="text-muted-foreground">Click on a driver marker to select</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Order</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrderId ? (
                  <div>
                    Order #{selectedOrderId} -{" "}
                    {sampleOrders.find((o) => o.id === selectedOrderId)?.delivery_address || "Order not found"}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Click on an order marker to select</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="driver" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Delivery Map</CardTitle>
              <CardDescription>Shows the delivery location and route from current location.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <DeliveryMap
                  deliveryAddress="123 Market St, San Francisco, CA"
                  latitude={37.7935}
                  longitude={-122.3964}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
