"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Database, Loader2 } from "lucide-react"

export function DatabaseSchemaInitializer() {
  const [isLoading, setIsLoading] = useState(false)

  const initializeSchema = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/database/schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initialize database schema")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Database schema initialized successfully",
      })
    } catch (error: any) {
      console.error("Error initializing schema:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to initialize database schema",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Schema
        </CardTitle>
        <CardDescription>Initialize or update your database schema</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will create all necessary tables in your Neon database if they don't already exist. This operation is
          safe to run multiple times as it uses "CREATE TABLE IF NOT EXISTS".
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={initializeSchema} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoading ? "Initializing Schema..." : "Initialize Database Schema"}
        </Button>
      </CardFooter>
    </Card>
  )
}
