"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Camera } from "lucide-react"
import SignatureCanvas from "react-signature-canvas"

const formSchema = z.object({
  pod_type: z.enum(["signature", "photo", "code"]),
  pod_data: z.string().min(1, { message: "Proof of delivery is required" }),
  notes: z.string().optional(),
})

interface ProofOfDeliveryProps {
  orderId: number
  driverId: number
}

export function ProofOfDelivery({ orderId, driverId }: ProofOfDeliveryProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [podType, setPodType] = useState<"signature" | "photo" | "code">("signature")
  const [signatureData, setSignatureData] = useState("")
  const [photoData, setPhotoData] = useState("")
  const signatureRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pod_type: "signature",
      pod_data: "",
      notes: "",
    },
  })

  // Handle signature pad
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear()
      setSignatureData("")
      form.setValue("pod_data", "")
    }
  }

  const saveSignature = () => {
    if (signatureRef.current) {
      const data = signatureRef.current.toDataURL("image/png")
      setSignatureData(data)
      form.setValue("pod_data", data)
    }
  }

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPhotoData(base64String)
      form.setValue("pod_data", base64String)
    }
    reader.readAsDataURL(file)
  }

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Get current location
    let location = null

    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          })
        })

        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
      }
    } catch (error) {
      console.error("Failed to get location:", error)
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/pod`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          location_lat: location?.latitude,
          location_lng: location?.longitude,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit proof of delivery")
      }

      toast({
        title: "Delivery completed",
        description: "Proof of delivery has been submitted successfully.",
      })

      // Redirect to driver home
      router.push(`/driver-app/${driverId}`)
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Proof of Delivery</CardTitle>
        <CardDescription>Collect proof of delivery to complete this order</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="pod_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proof Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setPodType(value as "signature" | "photo" | "code")
                    }}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proof type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="signature">Customer Signature</SelectItem>
                      <SelectItem value="photo">Photo Proof</SelectItem>
                      <SelectItem value="code">Confirmation Code</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {podType === "signature" && (
              <div className="space-y-4">
                <div className="border rounded-md p-2 bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-40",
                    }}
                    onEnd={saveSignature}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                    Clear
                  </Button>
                </div>
                {signatureData && (
                  <FormField
                    control={form.control}
                    name="pod_data"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {podType === "photo" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 flex flex-col gap-2 justify-center items-center border-dashed"
                  >
                    {photoData ? (
                      <img
                        src={photoData || "/placeholder.svg"}
                        alt="Delivery proof"
                        className="max-h-36 object-contain"
                      />
                    ) : (
                      <>
                        <Camera className="h-8 w-8" />
                        <span>Take a photo or upload an image</span>
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="pod_data"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {podType === "code" && (
              <FormField
                control={form.control}
                name="pod_data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmation Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the code provided by the customer" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes about the delivery" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Complete Delivery"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
