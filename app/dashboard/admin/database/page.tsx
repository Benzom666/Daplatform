"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Database, ArrowRightLeft } from "lucide-react"
import { DatabaseSchemaInitializer } from "@/components/admin/database-schema-initializer"
import { DatabaseStatus } from "@/components/dashboard/database-status"
import { FirebaseMigration } from "@/components/admin/firebase-migration"

export default function DatabaseManagementPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [defaultDb, setDefaultDb] = useState<string>("supabase")

  const handleSetDefaultDb = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/database/default", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ database: defaultDb }),
      })

      if (!response.ok) {
        throw new Error("Failed to set default database")
      }

      toast({
        title: "Default database updated",
        description: `Default database set to ${defaultDb}`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to set default database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMigrateData = async (direction: "supabase-to-neon" | "neon-to-supabase") => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/database/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ direction }),
      })

      if (!response.ok) {
        throw new Error("Failed to migrate data")
      }

      toast({
        title: "Data migration completed",
        description: `Data successfully migrated from ${direction === "supabase-to-neon" ? "Supabase to Neon" : "Neon to Supabase"}`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to migrate data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Database Management</h2>

      <DatabaseStatus />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Default Database
            </CardTitle>
            <CardDescription>Set the default database for the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Default Database</label>
                <Select value={defaultDb} onValueChange={setDefaultDb} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select database" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supabase">Supabase</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="both">Both (Dual Write)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSetDefaultDb} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Default Database
            </Button>
          </CardFooter>
        </Card>

        <DatabaseSchemaInitializer />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Data Migration
            </CardTitle>
            <CardDescription>Migrate data between databases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use these options to migrate data between Supabase and Neon databases. This is useful when switching
                between databases or ensuring both databases are in sync.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button onClick={() => handleMigrateData("supabase-to-neon")} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Migrate Supabase → Neon
            </Button>
            <Button
              onClick={() => handleMigrateData("neon-to-supabase")}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Migrate Neon → Supabase
            </Button>
          </CardFooter>
        </Card>

        <FirebaseMigration />
      </div>
    </div>
  )
}
