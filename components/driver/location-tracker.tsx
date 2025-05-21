"use client"

import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface LocationTrackerProps {
  driverId: number
  isActive: boolean
}

export function LocationTracker({ driverId, isActive }: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  // Start or stop tracking based on isActive prop
  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking()
    } else if (!isActive && isTracking) {
      stopTracking()
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [isActive, isTracking])

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      })
      return
    }

    try {
      const id = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30 seconds
        timeout: 27000, // 27 seconds
      })

      setWatchId(id)
      setIsTracking(true)

      toast({
        title: "Location tracking started",
        description: "Your location is now being shared with dispatchers.",
      })
    } catch (error) {
      console.error("Error starting location tracking:", error)
      toast({
        title: "Location tracking failed",
        description: "Could not start location tracking.",
        variant: "destructive",
      })
    }
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsTracking(false)

      toast({
        title: "Location tracking stopped",
        description: "Your location is no longer being shared.",
      })
    }
  }

  const handlePositionUpdate = async (position: GeolocationPosition) => {
    try {
      const { latitude, longitude, accuracy } = position.coords

      // Update location in database
      const response = await fetch(`/api/drivers/${driverId}/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy,
        }),
      })

      if (!response.ok) {
        console.error("Failed to update location:", await response.json())
      }

      // Also update via WebSocket if available
      // This would be implemented with the WebSocket client
    } catch (error) {
      console.error("Error updating location:", error)
    }
  }

  const handlePositionError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error)

    let message = "Unknown error occurred while tracking location."

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Location permission denied. Please enable location services."
        break
      case error.POSITION_UNAVAILABLE:
        message = "Location information is unavailable."
        break
      case error.TIMEOUT:
        message = "Location request timed out."
        break
    }

    toast({
      title: "Location tracking error",
      description: message,
      variant: "destructive",
    })

    setIsTracking(false)
    setWatchId(null)
  }

  // This component doesn't render anything visible
  return null
}
