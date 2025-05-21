import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Choose the appropriate connection string based on the use case
const connectionString = process.env.NEON_DATABASE_URL || process.env.NEON_DATABASE_URL

// For operations that need a direct connection (not through pgbouncer)
const unpooledConnectionString = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING

// Create a SQL client for Neon with the pooled connection (default)
const sql = neon(connectionString as string)

// Create a SQL client for unpooled connections when needed
const unpooledSql = neon(unpooledConnectionString as string)

// Create a Drizzle client for Neon
export const db = drizzle(sql)

// Direct SQL execution function
export async function executeSQL(query: string, params: any[] = [], useUnpooled = false): Promise<any> {
  try {
    const sqlClient = useUnpooled ? unpooledSql : sql
    return await sqlClient(query, params)
  } catch (error) {
    console.error("Error executing SQL query:", error)
    throw error
  }
}

// Transaction helper
export async function withTransaction<T>(callback: (tx: any) => Promise<T>, useUnpooled = false): Promise<T> {
  try {
    const sqlClient = useUnpooled ? unpooledSql : sql
    const result = await sqlClient.transaction(async (tx: any) => {
      return await callback(tx)
    })
    return result
  } catch (error) {
    console.error("Transaction error:", error)
    throw error
  }
}
