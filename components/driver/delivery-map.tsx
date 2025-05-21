"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine"

interface DeliveryMapProps {
  deliveryAddress: string
  latitude?: number
  longitude?: number
}

export function DeliveryMap({ deliveryAddress, latitude, longitude }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const routingControlRef = useRef<any>(null)

  // Fix for Leaflet marker icons in Next.js
  const fixLeafletIcons = () => {
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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    try {
      // Fix Leaflet icon paths
      fixLeafletIcons()

      // Create map instance
      const mapInstance = L.map(mapRef.current).setView([37.7749, -122.4194], 13)

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance)

      setMap(mapInstance)

      // Cleanup on unmount
      return () => {
        if (routingControlRef.current) {
          mapInstance.removeControl(routingControlRef.current)
        }
        mapInstance.remove()
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [])

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error("Error getting user location:", error)
        },
      )
    }
  }, [])

  // Geocode delivery address if coordinates not provided
  useEffect(() => {
    if (latitude && longitude) {
      setDestinationCoords([latitude, longitude])
      return
    }

    if (!deliveryAddress) return

    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddress)}&limit=1`,
          {
            headers: {
              "User-Agent": "DeliveryManagementSystem/1.0",
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.statusText}`)
        }

        const data = await response.json()

        if (data && data.length > 0) {
          setDestinationCoords([Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon)])
        }
      } catch (error) {
        console.error("Geocoding error:", error)
      }
    }

    geocodeAddress()
  }, [deliveryAddress, latitude, longitude])

  // Update map when coordinates are available
  useEffect(() => {
    if (!map || !destinationCoords) return

    // Add destination marker
    const destinationMarker = L.marker(destinationCoords)
      .addTo(map)
      .bindPopup(`<b>Delivery Address</b><br>${deliveryAddress}`)

    // Fit map to show destination
    map.setView(destinationCoords, 15)

    // If we have user location, add marker and create route
    if (userLocation) {
      // Add user location marker
      const userMarker = L.marker(userLocation).addTo(map).bindPopup("<b>Your Location</b>")

      // Create bounds to fit both markers
      const bounds = L.latLngBounds([destinationCoords, userLocation])
      map.fitBounds(bounds, { padding: [50, 50] })

      // Add routing if Leaflet Routing Machine is available
      if (typeof L.Routing !== "undefined") {
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current)
        }

        routingControlRef.current = L.Routing.control({
          waypoints: [L.latLng(userLocation), L.latLng(destinationCoords)],
          routeWhileDragging: false,
          showAlternatives: true,
          fitSelectedRoutes: true,
          lineOptions: {
            styles: [{ color: "#6366f1", weight: 6 }],
          },
        }).addTo(map)
      }
    }

    return () => {
      map.removeLayer(destinationMarker)
      if (userLocation) {
        // Clean up routing control
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current)
        }
      }
    }
  }, [map, destinationCoords, userLocation, deliveryAddress])

  const openInMapsApp = () => {
    if (!destinationCoords) return

    // Create a maps URL that works on both iOS and Android
    const mapsUrl = `https://www.openstreetmap.org/directions?from=${userLocation?.[0]},${userLocation?.[1]}&to=${destinationCoords[0]},${destinationCoords[1]}`

    // Open in a new tab/window
    window.open(mapsUrl, "_blank")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0 h-[300px]">
          <div ref={mapRef} className="w-full h-full" />
        </CardContent>
      </Card>

      <Button onClick={openInMapsApp} className="w-full gap-2" disabled={!destinationCoords}>
        <Navigation className="h-4 w-4" />
        Open in Maps App
      </Button>
    </div>
  )
}
