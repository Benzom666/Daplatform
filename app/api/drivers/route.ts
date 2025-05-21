import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import { authenticateRequest, hashPassword } from "@/lib/auth"

export async function GET(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin", "dispatcher"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServerClient()
  const searchParams = req.nextUrl.searchParams

  // Filter parameters
  const status = searchParams.get("status")
  const limit = Number.parseInt(searchParams.get("limit") || "50")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  // Build query
  let query = supabase
    .from("drivers")
    .select("*, active_order:orders(*)")
    .order("name")
    .limit(limit)
    .range(offset, offset + limit - 1)

  // Apply filters
  if (status) {
    query = query.eq("status", status)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Remove sensitive information
  const sanitizedData = data.map((driver) => {
    const { password_hash, ...rest } = driver
    return rest
  })

  return NextResponse.json({
    data: sanitizedData,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
  })
}

export async function POST(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req, ["admin"])

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = getServerClient()

    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingDriver } = await supabase.from("drivers").select("id").eq("email", body.email).maybeSingle()

    if (existingDriver) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(body.password)

    // Create driver
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        password_hash: passwordHash,
        vehicle: body.vehicle || null,
        license_plate: body.license_plate || null,
        status: "offline",
      })
      .select()
      .single()

    if (driverError) {
      return NextResponse.json({ error: driverError.message }, { status: 500 })
    }

    // Remove sensitive information
    const { password_hash, ...sanitizedDriver } = driver

    return NextResponse.json(sanitizedDriver, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create driver" }, { status: 500 })
  }
}
