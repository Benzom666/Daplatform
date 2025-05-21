import { getServerClient } from "../supabase"
import { executeSQL, withTransaction } from "../neon-db"

// Type for database operations
type DbOperation = "supabase" | "neon" | "both"

export class DatabaseService {
  // Default database to use
  private static defaultDb: DbOperation = "supabase"

  // Set default database
  static setDefaultDb(db: DbOperation): void {
    this.defaultDb = db
  }

  // Get orders with flexible database choice
  static async getOrders(options: {
    status?: string
    driverId?: number
    customerId?: number
    limit?: number
    offset?: number
    db?: DbOperation
  }): Promise<any> {
    const db = options.db || this.defaultDb

    if (db === "supabase" || db === "both") {
      const supabase = getServerClient()
      let query = supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          driver:drivers(*),
          items:order_items(*)
        `)
        .order("created_at", { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1)

      if (options.status) {
        query = query.eq("status", options.status)
      }

      if (options.driverId) {
        query = query.eq("driver_id", options.driverId)
      }

      if (options.customerId) {
        query = query.eq("customer_id", options.customerId)
      }

      const { data, error } = await query

      if (error) throw error
      if (db === "supabase") return data
    }

    if (db === "neon" || db === "both") {
      // Build the SQL query for Neon
      let sql = `
        SELECT 
          o.*,
          json_build_object(
            'id', c.id,
            'name', c.name,
            'email', c.email,
            'phone', c.phone,
            'address', c.address
          ) as customer,
          json_build_object(
            'id', d.id,
            'name', d.name,
            'email', d.email,
            'phone', d.phone,
            'vehicle', d.vehicle,
            'license_plate', d.license_plate,
            'status', d.status
          ) as driver
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN drivers d ON o.driver_id = d.id
      `

      const whereConditions = []
      const params: any[] = []

      if (options.status) {
        whereConditions.push(`o.status = $${params.length + 1}`)
        params.push(options.status)
      }

      if (options.driverId) {
        whereConditions.push(`o.driver_id = $${params.length + 1}`)
        params.push(options.driverId)
      }

      if (options.customerId) {
        whereConditions.push(`o.customer_id = $${params.length + 1}`)
        params.push(options.customerId)
      }

      if (whereConditions.length > 0) {
        sql += " WHERE " + whereConditions.join(" AND ")
      }

      sql += " ORDER BY o.created_at DESC"
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(options.limit || 50, options.offset || 0)

      const result = await executeSQL(sql, params)

      // Get order items for each order
      for (const order of result) {
        const itemsSql = `
          SELECT * FROM order_items 
          WHERE order_id = $1
          ORDER BY id
        `
        order.items = await executeSQL(itemsSql, [order.id])
      }

      return result
    }
  }

  // Create order with transaction support
  static async createOrder(
    orderData: {
      customer_id: number
      driver_id?: number | null
      status?: string
      total: number
      delivery_address: string
      delivery_instructions?: string | null
      estimated_delivery_time?: string | null
      items: Array<{ name: string; quantity: number; price: number }>
      changed_by: number
      is_driver: boolean
    },
    db: DbOperation = this.defaultDb,
  ): Promise<any> {
    if (db === "supabase" || db === "both") {
      const supabase = getServerClient()

      // Start a transaction
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: orderData.customer_id,
          driver_id: orderData.driver_id || null,
          status: orderData.status || "pending",
          total: orderData.total,
          delivery_address: orderData.delivery_address,
          delivery_instructions: orderData.delivery_instructions || null,
          estimated_delivery_time: orderData.estimated_delivery_time || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
      if (itemsError) throw itemsError

      // Record status history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        previous_status: null,
        new_status: order.status,
        changed_by: orderData.changed_by,
        is_driver: orderData.is_driver,
      })

      // If driver is assigned, update driver status
      if (order.driver_id) {
        await supabase
          .from("drivers")
          .update({
            status: "busy",
            active_order_id: order.id,
          })
          .eq("id", order.driver_id)
      }

      if (db === "supabase") return order
    }

    if (db === "neon" || db === "both") {
      return await withTransaction(async (tx) => {
        // Insert order
        const orderResult = await tx(
          `
          INSERT INTO orders (
            customer_id, driver_id, status, total, 
            delivery_address, delivery_instructions, estimated_delivery_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
          [
            orderData.customer_id,
            orderData.driver_id || null,
            orderData.status || "pending",
            orderData.total,
            orderData.delivery_address,
            orderData.delivery_instructions || null,
            orderData.estimated_delivery_time || null,
          ],
        )

        const order = orderResult[0]

        // Insert order items
        for (const item of orderData.items) {
          await tx(
            `
            INSERT INTO order_items (order_id, item_name, quantity, price)
            VALUES ($1, $2, $3, $4)
          `,
            [order.id, item.name, item.quantity, item.price],
          )
        }

        // Record status history
        await tx(
          `
          INSERT INTO order_status_history (
            order_id, previous_status, new_status, changed_by, is_driver
          ) VALUES ($1, $2, $3, $4, $5)
        `,
          [order.id, null, order.status, orderData.changed_by, orderData.is_driver],
        )

        // If driver is assigned, update driver status
        if (order.driver_id) {
          await tx(
            `
            UPDATE drivers
            SET status = 'busy', active_order_id = $1
            WHERE id = $2
          `,
            [order.id, order.driver_id],
          )
        }

        return order
      })
    }
  }
}
