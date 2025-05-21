import { getServerClient } from "../supabase"
import { executeSQL } from "../neon-db"

export async function migrateDataFromSupabaseToNeon() {
  const supabase = getServerClient()

  // Migrate users
  const { data: users } = await supabase.from("users").select("*")
  if (users && users.length > 0) {
    for (const user of users) {
      await executeSQL(
        `
        INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at, last_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          updated_at = EXCLUDED.updated_at,
          last_login = EXCLUDED.last_login
      `,
        [
          user.id,
          user.email,
          user.password_hash,
          user.name,
          user.role,
          user.created_at,
          user.updated_at,
          user.last_login,
        ],
      )
    }
  }

  // Migrate customers
  const { data: customers } = await supabase.from("customers").select("*")
  if (customers && customers.length > 0) {
    for (const customer of customers) {
      await executeSQL(
        `
        INSERT INTO customers (id, name, email, phone, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          updated_at = EXCLUDED.updated_at
      `,
        [
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.address,
          customer.created_at,
          customer.updated_at,
        ],
      )
    }
  }

  // Migrate drivers
  const { data: drivers } = await supabase.from("drivers").select("*")
  if (drivers && drivers.length > 0) {
    for (const driver of drivers) {
      await executeSQL(
        `
        INSERT INTO drivers (
          id, name, email, phone, password_hash, vehicle, license_plate, 
          rating, status, created_at, updated_at, last_location_lat, 
          last_location_lng, last_location_updated_at, fcm_token, active_order_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          password_hash = EXCLUDED.password_hash,
          vehicle = EXCLUDED.vehicle,
          license_plate = EXCLUDED.license_plate,
          rating = EXCLUDED.rating,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at,
          last_location_lat = EXCLUDED.last_location_lat,
          last_location_lng = EXCLUDED.last_location_lng,
          last_location_updated_at = EXCLUDED.last_location_updated_at,
          fcm_token = EXCLUDED.fcm_token,
          active_order_id = EXCLUDED.active_order_id
      `,
        [
          driver.id,
          driver.name,
          driver.email,
          driver.phone,
          driver.password_hash,
          driver.vehicle,
          driver.license_plate,
          driver.rating,
          driver.status,
          driver.created_at,
          driver.updated_at,
          driver.last_location_lat,
          driver.last_location_lng,
          driver.last_location_updated_at,
          driver.fcm_token,
          driver.active_order_id,
        ],
      )
    }
  }

  // Migrate orders and related data
  const { data: orders } = await supabase.from("orders").select("*")
  if (orders && orders.length > 0) {
    for (const order of orders) {
      await executeSQL(
        `
        INSERT INTO orders (
          id, customer_id, driver_id, status, total, delivery_address,
          delivery_instructions, estimated_delivery_time, actual_delivery_time,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          customer_id = EXCLUDED.customer_id,
          driver_id = EXCLUDED.driver_id,
          status = EXCLUDED.status,
          total = EXCLUDED.total,
          delivery_address = EXCLUDED.delivery_address,
          delivery_instructions = EXCLUDED.delivery_instructions,
          estimated_delivery_time = EXCLUDED.estimated_delivery_time,
          actual_delivery_time = EXCLUDED.actual_delivery_time,
          updated_at = EXCLUDED.updated_at
      `,
        [
          order.id,
          order.customer_id,
          order.driver_id,
          order.status,
          order.total,
          order.delivery_address,
          order.delivery_instructions,
          order.estimated_delivery_time,
          order.actual_delivery_time,
          order.created_at,
          order.updated_at,
        ],
      )

      // Migrate order items
      const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id)
      if (items && items.length > 0) {
        for (const item of items) {
          await executeSQL(
            `
            INSERT INTO order_items (id, order_id, item_name, quantity, price, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              order_id = EXCLUDED.order_id,
              item_name = EXCLUDED.item_name,
              quantity = EXCLUDED.quantity,
              price = EXCLUDED.price
          `,
            [item.id, item.order_id, item.item_name, item.quantity, item.price, item.created_at],
          )
        }
      }

      // Migrate order status history
      const { data: history } = await supabase.from("order_status_history").select("*").eq("order_id", order.id)
      if (history && history.length > 0) {
        for (const entry of history) {
          await executeSQL(
            `
            INSERT INTO order_status_history (
              id, order_id, previous_status, new_status, 
              changed_by, is_driver, notes, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              order_id = EXCLUDED.order_id,
              previous_status = EXCLUDED.previous_status,
              new_status = EXCLUDED.new_status,
              changed_by = EXCLUDED.changed_by,
              is_driver = EXCLUDED.is_driver,
              notes = EXCLUDED.notes
          `,
            [
              entry.id,
              entry.order_id,
              entry.previous_status,
              entry.new_status,
              entry.changed_by,
              entry.is_driver,
              entry.notes,
              entry.created_at,
            ],
          )
        }
      }
    }
  }

  return { success: true, message: "Data migration completed successfully" }
}

export async function migrateDataFromNeonToSupabase() {
  const supabase = getServerClient()

  // Migrate users
  const users = await executeSQL("SELECT * FROM users")
  if (users && users.length > 0) {
    for (const user of users) {
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
      })
    }
  }

  // Migrate customers
  const customers = await executeSQL("SELECT * FROM customers")
  if (customers && customers.length > 0) {
    for (const customer of customers) {
      await supabase.from("customers").upsert({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      })
    }
  }

  // Migrate drivers
  const drivers = await executeSQL("SELECT * FROM drivers")
  if (drivers && drivers.length > 0) {
    for (const driver of drivers) {
      await supabase.from("drivers").upsert({
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        password_hash: driver.password_hash,
        vehicle: driver.vehicle,
        license_plate: driver.license_plate,
        rating: driver.rating,
        status: driver.status,
        created_at: driver.created_at,
        updated_at: driver.updated_at,
        last_location_lat: driver.last_location_lat,
        last_location_lng: driver.last_location_lng,
        last_location_updated_at: driver.last_location_updated_at,
        fcm_token: driver.fcm_token,
        active_order_id: driver.active_order_id,
      })
    }
  }

  // Migrate orders and related data
  const orders = await executeSQL("SELECT * FROM orders")
  if (orders && orders.length > 0) {
    for (const order of orders) {
      await supabase.from("orders").upsert({
        id: order.id,
        customer_id: order.customer_id,
        driver_id: order.driver_id,
        status: order.status,
        total: order.total,
        delivery_address: order.delivery_address,
        delivery_instructions: order.delivery_instructions,
        estimated_delivery_time: order.estimated_delivery_time,
        actual_delivery_time: order.actual_delivery_time,
        created_at: order.created_at,
        updated_at: order.updated_at,
      })

      // Migrate order items
      const items = await executeSQL("SELECT * FROM order_items WHERE order_id = $1", [order.id])
      if (items && items.length > 0) {
        for (const item of items) {
          await supabase.from("order_items").upsert({
            id: item.id,
            order_id: item.order_id,
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            created_at: item.created_at,
          })
        }
      }

      // Migrate order status history
      const history = await executeSQL("SELECT * FROM order_status_history WHERE order_id = $1", [order.id])
      if (history && history.length > 0) {
        for (const entry of history) {
          await supabase.from("order_status_history").upsert({
            id: entry.id,
            order_id: entry.order_id,
            previous_status: entry.previous_status,
            new_status: entry.new_status,
            changed_by: entry.changed_by,
            is_driver: entry.is_driver,
            notes: entry.notes,
            created_at: entry.created_at,
          })
        }
      }
    }
  }

  return { success: true, message: "Data migration completed successfully" }
}
