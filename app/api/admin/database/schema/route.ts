import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth"
import { executeSQL } from "@/lib/neon-db"

export async function POST(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Use unpooled connection for schema changes
    const useUnpooled = true

    // Create tables
    await executeSQL(
      `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      );

      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50) NOT NULL,
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Drivers table
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        password_hash VARCHAR(255),
        vehicle VARCHAR(100),
        license_plate VARCHAR(50),
        rating DECIMAL(3,2),
        status VARCHAR(20) NOT NULL DEFAULT 'offline',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_location_lat DECIMAL(10,7),
        last_location_lng DECIMAL(10,7),
        last_location_updated_at TIMESTAMP WITH TIME ZONE,
        fcm_token TEXT,
        active_order_id INTEGER
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        driver_id INTEGER REFERENCES drivers(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        total DECIMAL(10,2) NOT NULL,
        delivery_address TEXT NOT NULL,
        delivery_instructions TEXT,
        estimated_delivery_time TIMESTAMP WITH TIME ZONE,
        actual_delivery_time TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Order items table
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Order status history table
      CREATE TABLE IF NOT EXISTS order_status_history (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        previous_status VARCHAR(20),
        new_status VARCHAR(20) NOT NULL,
        changed_by INTEGER NOT NULL,
        is_driver BOOLEAN NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Driver locations table
      CREATE TABLE IF NOT EXISTS driver_locations (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL REFERENCES drivers(id),
        latitude DECIMAL(10,7) NOT NULL,
        longitude DECIMAL(10,7) NOT NULL,
        accuracy DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Proof of delivery table
      CREATE TABLE IF NOT EXISTS proof_of_delivery (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        driver_id INTEGER NOT NULL REFERENCES drivers(id),
        pod_type VARCHAR(20) NOT NULL,
        pod_data TEXT NOT NULL,
        notes TEXT,
        location_lat DECIMAL(10,7),
        location_lng DECIMAL(10,7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Refresh tokens table
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        driver_id INTEGER REFERENCES drivers(id),
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Update drivers table to add foreign key constraint
      ALTER TABLE drivers 
      DROP CONSTRAINT IF EXISTS drivers_active_order_id_fkey,
      ADD CONSTRAINT drivers_active_order_id_fkey 
      FOREIGN KEY (active_order_id) REFERENCES orders(id);
    `,
      [],
      useUnpooled,
    )

    return NextResponse.json({
      success: true,
      message: "Database schema created successfully",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create database schema" }, { status: 500 })
  }
}
