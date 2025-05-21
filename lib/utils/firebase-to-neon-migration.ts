import { executeSQL } from "../neon-db"
import { db as firebaseDb } from "../firebase/firebase-config"
import { collection, getDocs } from "firebase/firestore"

/**
 * Migrates data from Firebase Firestore to Neon PostgreSQL
 */
export async function migrateFromFirebaseToNeon() {
  try {
    console.log("Starting migration from Firebase to Neon...")

    // Migrate users
    await migrateUsers()

    // Migrate customers
    await migrateCustomers()

    // Migrate drivers
    await migrateDrivers()

    // Migrate orders and related data
    await migrateOrders()

    console.log("Migration completed successfully!")
    return { success: true, message: "Migration completed successfully" }
  } catch (error: any) {
    console.error("Migration failed:", error)
    return { success: false, error: error.message }
  }
}

async function migrateUsers() {
  console.log("Migrating users...")
  const usersSnapshot = await getDocs(collection(firebaseDb, "users"))

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data()

    await executeSQL(
      `
      INSERT INTO users (
        email, password_hash, name, role, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at
      `,
      [
        userData.email,
        userData.passwordHash || "MIGRATED_FROM_FIREBASE", // You might need to reset passwords
        userData.name,
        userData.role || "user",
        userData.createdAt?.toDate() || new Date(),
        userData.updatedAt?.toDate() || new Date(),
      ],
      true, // Use unpooled connection
    )
  }

  console.log(`Migrated ${usersSnapshot.docs.length} users`)
}

async function migrateCustomers() {
  console.log("Migrating customers...")
  const customersSnapshot = await getDocs(collection(firebaseDb, "customers"))

  for (const doc of customersSnapshot.docs) {
    const customerData = doc.data()

    await executeSQL(
      `
      INSERT INTO customers (
        name, email, phone, address, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        updated_at = EXCLUDED.updated_at
      `,
      [
        customerData.name,
        customerData.email,
        customerData.phone,
        customerData.address,
        customerData.createdAt?.toDate() || new Date(),
        customerData.updatedAt?.toDate() || new Date(),
      ],
      true,
    )
  }

  console.log(`Migrated ${customersSnapshot.docs.length} customers`)
}

async function migrateDrivers() {
  console.log("Migrating drivers...")
  const driversSnapshot = await getDocs(collection(firebaseDb, "drivers"))

  for (const doc of driversSnapshot.docs) {
    const driverData = doc.data()

    await executeSQL(
      `
      INSERT INTO drivers (
        name, email, phone, password_hash, vehicle, license_plate, 
        rating, status, created_at, updated_at, last_location_lat, 
        last_location_lng, last_location_updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        vehicle = EXCLUDED.vehicle,
        license_plate = EXCLUDED.license_plate,
        rating = EXCLUDED.rating,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at,
        last_location_lat = EXCLUDED.last_location_lat,
        last_location_lng = EXCLUDED.last_location_lng,
        last_location_updated_at = EXCLUDED.last_location_updated_at
      `,
      [
        driverData.name,
        driverData.email,
        driverData.phone,
        driverData.passwordHash || "MIGRATED_FROM_FIREBASE",
        driverData.vehicle,
        driverData.licensePlate,
        driverData.rating || 5.0,
        driverData.status || "offline",
        driverData.createdAt?.toDate() || new Date(),
        driverData.updatedAt?.toDate() || new Date(),
        driverData.lastLocation?.latitude,
        driverData.lastLocation?.longitude,
        driverData.lastLocationUpdatedAt?.toDate(),
      ],
      true,
    )
  }

  console.log(`Migrated ${driversSnapshot.docs.length} drivers`)
}

async function migrateOrders() {
  console.log("Migrating orders...")
  const ordersSnapshot = await getDocs(collection(firebaseDb, "orders"))

  for (const doc of ordersSnapshot.docs) {
    const orderData = doc.data()

    // First, get customer and driver IDs from Neon
    let customerId = null
    let driverId = null

    if (orderData.customerEmail) {
      const customerResult = await executeSQL(
        `SELECT id FROM customers WHERE email = $1`,
        [orderData.customerEmail],
        true,
      )
      if (customerResult.length > 0) {
        customerId = customerResult[0].id
      }
    }

    if (orderData.driverEmail) {
      const driverResult = await executeSQL(`SELECT id FROM drivers WHERE email = $1`, [orderData.driverEmail], true)
      if (driverResult.length > 0) {
        driverId = driverResult[0].id
      }
    }

    // Skip if we can't find the customer
    if (!customerId) {
      console.log(`Skipping order ${doc.id} - customer not found`)
      continue
    }

    // Insert the order
    const orderResult = await executeSQL(
      `
      INSERT INTO orders (
        customer_id, driver_id, status, total, delivery_address,
        delivery_instructions, estimated_delivery_time, actual_delivery_time,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
      `,
      [
        customerId,
        driverId,
        orderData.status || "pending",
        orderData.total || 0,
        orderData.deliveryAddress,
        orderData.deliveryInstructions,
        orderData.estimatedDeliveryTime?.toDate(),
        orderData.actualDeliveryTime?.toDate(),
        orderData.createdAt?.toDate() || new Date(),
        orderData.updatedAt?.toDate() || new Date(),
      ],
      true,
    )

    const orderId = orderResult[0].id

    // Migrate order items
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        await executeSQL(
          `
          INSERT INTO order_items (
            order_id, item_name, quantity, price, created_at
          ) VALUES ($1, $2, $3, $4, $5)
          `,
          [orderId, item.name, item.quantity || 1, item.price || 0, orderData.createdAt?.toDate() || new Date()],
          true,
        )
      }
    }

    // Migrate order status history if available
    if (orderData.statusHistory && Array.isArray(orderData.statusHistory)) {
      for (const history of orderData.statusHistory) {
        await executeSQL(
          `
          INSERT INTO order_status_history (
            order_id, previous_status, new_status, 
            changed_by, is_driver, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            orderId,
            history.previousStatus,
            history.newStatus,
            history.changedById || 1, // Default to admin user
            history.isDriver || false,
            history.notes,
            history.timestamp?.toDate() || new Date(),
          ],
          true,
        )
      }
    }
  }

  console.log(`Migrated ${ordersSnapshot.docs.length} orders`)
}
