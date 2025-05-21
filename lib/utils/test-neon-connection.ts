import { executeSQL } from "../neon-db"

export async function testNeonConnection(useUnpooled = false): Promise<{
  connected: boolean
  latency?: number
  error?: string
  version?: string
}> {
  try {
    const startTime = Date.now()

    // Simple query to test connection and get PostgreSQL version
    const result = await executeSQL("SELECT version()", [], useUnpooled)

    const latency = Date.now() - startTime

    return {
      connected: true,
      latency,
      version: result[0].version,
    }
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || "Unknown error",
    }
  }
}
