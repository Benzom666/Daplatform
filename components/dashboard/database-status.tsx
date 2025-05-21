"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, CheckCircle, XCircle, RefreshCw, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface DatabaseConnectionDetails {
  url?: string
  host?: string
  database?: string
}

interface DatabaseStatus {
  name: string
  connected: boolean
  latency?: number
  error?: string
  version?: string
  connectionDetails?: DatabaseConnectionDetails
}

interface DatabaseConfig {
  defaultDatabase: string
}

export function DatabaseStatus() {
  const [statuses, setStatuses] = useState<DatabaseStatus[]>([])
  const [config, setConfig] = useState<DatabaseConfig>({ defaultDatabase: "unknown" })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const checkDatabaseStatus = async () => {
    setRefreshing(true)
    try {
      const response = await fetch("/api/admin/database/status")

      if (response.ok) {
        const data = await response.json()
        setStatuses(data.statuses)
        setConfig(data.config)
      }
    } catch (error) {
      console.error("Failed to check database status:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()

    // Check status every 60 seconds
    const interval = setInterval(checkDatabaseStatus, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <Button variant="outline" size="sm" onClick={checkDatabaseStatus} disabled={refreshing}>
            {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
        <CardDescription>Current status of connected databases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium">Default Database:</span>
                <Badge variant="outline" className="capitalize">
                  {config.defaultDatabase}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is the database used by default for all operations</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {statuses.map((status, index) => (
                  <AccordionItem key={status.name} value={`item-${index}`}>
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span className="font-medium">{status.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {status.connected ? (
                            <>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Connected
                              </Badge>
                              {status.latency && (
                                <span className="text-xs text-muted-foreground">{status.latency}ms</span>
                              )}
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Disconnected
                              </Badge>
                              <XCircle className="h-4 w-4 text-red-500" />
                            </>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-6 pt-2 space-y-2 text-sm">
                        {status.version && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">Version:</span>
                            <span className="text-muted-foreground">{status.version}</span>
                          </div>
                        )}

                        {status.error && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">Error:</span>
                            <span className="text-red-600">{status.error}</span>
                          </div>
                        )}

                        {status.connectionDetails && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">Connection:</span>
                            <div className="text-muted-foreground">
                              {status.connectionDetails.url && <div>URL: {status.connectionDetails.url}</div>}
                              {status.connectionDetails.host && <div>Host: {status.connectionDetails.host}</div>}
                              {status.connectionDetails.database && (
                                <div>Database: {status.connectionDetails.database}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">Last checked: {new Date().toLocaleString()}</span>
      </CardFooter>
    </Card>
  )
}
