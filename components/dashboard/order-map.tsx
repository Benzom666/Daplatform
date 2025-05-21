"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
  // Only run on client side
  if (typeof window !== "undefined") {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    })
  }
}

interface Driver {
  id: number
  name: string
  last_location_lat: number | null
  last_location_lng: number | null
  last_location_updated_at: string | null
  status: "available" | "busy" | "offline"
  active_order_id: number | null
}

interface Order {
  id: number
  delivery_address: string
  status: "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"
  driver_id: number | null
}

interface OrderMapProps {
  drivers: Driver[]
  orders: Order[]
  onDriverSelect?: (driverId: number) => void
  onOrderSelect?: (orderId: number) => void
}

export function OrderMap({ drivers, orders, onDriverSelect, onOrderSelect }: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [markers, setMarkers] = useState<L.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    try {
      // Fix Leaflet icon paths
      fixLeafletIcons()

      // Create map instance
      const mapInstance = L.map(mapRef.current).setView([37.7749, -122.4194], 12)

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance)

      setMap(mapInstance)
      setIsLoading(false)

      // Cleanup on unmount
      return () => {
        mapInstance.remove()
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      toast({
        title: "Map Error",
        description: "Failed to initialize the map. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [])

  // Update markers when drivers or orders change
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach((marker) => marker.remove())
    setMarkers([])

    const newMarkers: L.Marker[] = []
    const bounds = L.latLngBounds([])
    let hasValidLocations = false

    // Add driver markers
    drivers.forEach((driver) => {
      if (driver.last_location_lat && driver.last_location_lng) {
        const position = L.latLng(
          Number.parseFloat(driver.last_location_lat.toString()),
          Number.parseFloat(driver.last_location_lng.toString()),
        )

        // Create custom icon based on driver status
        const driverIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div class="marker-pin ${
            driver.status === "available" ? "bg-green-500" : driver.status === "busy" ? "bg-orange-500" : "bg-gray-500"
          } flex items-center justify-center rounded-full w-8 h-8 text-white shadow-md border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        const marker = L.marker(position, {
          icon: driverIcon,
          title: driver.name,
        }).addTo(map)

        // Add click handler
        if (onDriverSelect) {
          marker.on("click", () => {
            onDriverSelect(driver.id)
          })
        }

        // Add popup
        marker.bindPopup(`
          <div class="p-2">
            <div class="font-bold">${driver.name}</div>
            <div>Status: ${driver.status}</div>
            ${driver.active_order_id ? `<div>Active Order: #${driver.active_order_id}</div>` : ""}
          </div>
        `)

        newMarkers.push(marker)
        bounds.extend(position)
        hasValidLocations = true
      }
    })

    // Add order markers (geocode addresses)
    const activeOrders = orders.filter((order) =>
      ["pending", "assigned", "picked_up", "in_transit"].includes(order.status),
    )

    activeOrders.forEach((order) => {
      // Use Nominatim for geocoding (OpenStreetMap's geocoding service)
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(order.delivery_address)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data && data.length > 0) {
            const position = L.latLng(Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon))

            // Create custom icon for orders
            const orderIcon = L.divIcon({
              className: "custom-div-icon",
              html: `<div class="marker-pin bg-red-500 flex items-center justify-center rounded-full w-8 h-8 text-white shadow-md border-2 border-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })

            const marker = L.marker(position, {
              icon: orderIcon,
              title: `Order #${order.id}`,
            }).addTo(map)

            // Add click handler
            if (onOrderSelect) {
              marker.on("click", () => {
                onOrderSelect(order.id)
              })
            }

            // Add popup
            marker.bindPopup(`
              <div class="p-2">
                <div class="font-bold">Order #${order.id}</div>
                <div>Status: ${order.status.replace("_", " ")}</div>
                <div>Address: ${order.delivery_address}</div>
              </div>
            `)

            newMarkers.push(marker)
            bounds.extend(position)
            hasValidLocations = true

            // Fit bounds after all geocoding is complete
            if (hasValidLocations) {
              map.fitBounds(bounds, { padding: [50, 50] })

              // If only one location, zoom out a bit
              if (map.getZoom() > 15) {
                map.setZoom(15)
              }
            }
          }
        })
        .catch((error) => {
          console.error("Geocoding error:", error)
        })
    })

    setMarkers(newMarkers)

    // Fit bounds if we have valid locations
    if (hasValidLocations) {
      map.fitBounds(bounds, { padding: [50, 50] })

      // If only one location, zoom out a bit
      if (map.getZoom() > 15) {
        map.setZoom(15)
      }
    }
  }, [map, drivers, orders, onDriverSelect, onOrderSelect])

  return (
    <Card className="w-full h-[500px]">
      <CardHeader className="pb-2">
        <CardTitle>Live Tracking Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-60px)]">
        {isLoading ? <Skeleton className="w-full h-full" /> : <div ref={mapRef} className="w-full h-full" />}
      </CardContent>
    </Card>
  )
}
