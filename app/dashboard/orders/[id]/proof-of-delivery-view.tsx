"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, FileText, User } from "lucide-react"
import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface ProofOfDeliveryViewProps {
  pod: {
    id: number
    order_id: number
    driver_id: number
    pod_type: "signature" | "photo" | "code"
    pod_data: string
    notes: string | null
    location_lat: number | null
    location_lng: number | null
    created_at: string
  }
}

export function ProofOfDeliveryView({ pod }: ProofOfDeliveryViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  // Initialize map when component mounts and coordinates are available
  useEffect(() => {
    if (!mapRef.current || !pod.location_lat || !pod.location_lng) return

    // Fix for Leaflet marker icons in Next.js
    if (typeof window !== "undefined") {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      })
    }

    // Create map instance
    const map = L.map(mapRef.current).setView([pod.location_lat, pod.location_lng], 16)

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add marker for delivery location
    L.marker([pod.location_lat, pod.location_lng])
      .addTo(map)
      .bindPopup("<b>Delivery Location</b><br>Proof of delivery was submitted here.")
      .openPopup()

    // Cleanup on unmount
    return () => {
      map.remove()
    }
  }, [pod.location_lat, pod.location_lng])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium mb-2">Delivery Confirmation</h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">Type:</span>
              <p className="text-sm capitalize">{pod.pod_type}</p>
            </div>

            <div>
              <span className="text-sm font-medium">Date & Time:</span>
              <p className="text-sm">{new Date(pod.created_at).toLocaleString()}</p>
            </div>

            {pod.notes && (
              <div>
                <span className="text-sm font-medium flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Notes:
                </span>
                <p className="text-sm mt-1">{pod.notes}</p>
              </div>
            )}

            {pod.location_lat && pod.location_lng && (
              <div>
                <span className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Delivery Location:
                </span>
                <p className="text-sm mt-1">
                  {pod.location_lat.toFixed(6)}, {pod.location_lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          {pod.pod_type === "signature" && (
            <div className="border rounded-md p-4 bg-white">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <User className="h-4 w-4" />
                Customer Signature
              </h3>
              <div className="bg-white rounded-md overflow-hidden">
                <img
                  src={pod.pod_data || "/placeholder.svg"}
                  alt="Customer Signature"
                  className="w-full object-contain max-h-60"
                />
              </div>
            </div>
          )}

          {pod.pod_type === "photo" && (
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Photo Proof</h3>
              <div className="bg-white rounded-md overflow-hidden">
                <img
                  src={pod.pod_data || "/placeholder.svg"}
                  alt="Delivery Photo Proof"
                  className="w-full object-contain max-h-60"
                />
              </div>
            </div>
          )}

          {pod.pod_type === "code" && (
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Confirmation Code</h3>
              <div className="bg-muted p-4 rounded-md text-center font-mono text-lg">{pod.pod_data}</div>
            </div>
          )}
        </div>
      </div>

      {pod.location_lat && pod.location_lng && (
        <Card>
          <CardContent className="p-0 h-[300px]">
            <div ref={mapRef} className="w-full h-full" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
