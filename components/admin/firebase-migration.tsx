"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ArrowRightLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function FirebaseMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const handleMigration = async () => {
    if (!confirm("Are you sure you want to migrate data from Firebase to Neon? This process may take some time.")) {
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/migrate-from-firebase", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to migrate data")
      }

      setResult(data)

      toast({
        title: "Migration completed",
        description: data.message || "Data successfully migrated from Firebase to Neon",
      })
    } catch (error: any) {
      console.error(error)
      setResult({ success: false, error: error.message })
      toast({
        title: "Migration failed",
        description: error.message,
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
          <ArrowRightLeft className="h-5 w-5" />
          Firebase to Neon Migration
        </CardTitle>
        <CardDescription>Migrate your data from Firebase to Neon PostgreSQL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will migrate all your data from Firebase Firestore to Neon PostgreSQL. This process may take some time
            depending on the amount of data.
          </p>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertTitle>{result.success ? "Migration Successful" : "Migration Failed"}</AlertTitle>
              <AlertDescription>
                {result.message || result.error || "The migration process has completed."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleMigration} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoading ? "Migrating Data..." : "Migrate from Firebase to Neon"}
        </Button>
      </CardFooter>
    </Card>
  )
}
