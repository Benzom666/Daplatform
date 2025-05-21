// Cache for geocoded addresses to reduce API calls
const geocodeCache = new Map<string, { lat: number; lng: number }>()

/**
 * Geocodes an address using OpenStreetMap's Nominatim service
 * Note: For production use with high volume, consider a commercial geocoding service
 * as Nominatim has usage limits (1 request per second)
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address) || null
  }

  try {
    // Add a small delay to respect Nominatim's usage policy (max 1 request per second)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "User-Agent": "DeliveryManagementSystem/1.0", // It's good practice to identify your application
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data && data.length > 0) {
      const result = {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      }

      // Cache the result
      geocodeCache.set(address, result)

      return result
    }

    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

/**
 * Reverse geocodes coordinates to an address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    // Add a small delay to respect Nominatim's usage policy
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: {
        "User-Agent": "DeliveryManagementSystem/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data && data.display_name) {
      return data.display_name
    }

    return null
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return null
  }
}
