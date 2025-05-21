import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import { comparePassword, generateToken, generateRefreshToken, setAuthCookies, type UserJwtPayload } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getServerClient()

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Determine if this is a user or driver login
    const isDriverLogin = body.role === "driver"

    let user: any = null
    let passwordHash = ""

    if (isDriverLogin) {
      // Try to find driver
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("email", body.email)
        .single()

      if (driverError || !driver || !driver.password_hash) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      user = driver
      passwordHash = driver.password_hash
    } else {
      // Try to find user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", body.email)
        .single()

      if (userError || !userData) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      user = userData
      passwordHash = userData.password_hash
    }

    // Verify password
    const isPasswordValid = await comparePassword(body.password, passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT payload
    const payload: UserJwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: isDriverLogin ? "driver" : user.role,
      type: isDriverLogin ? "driver" : "user",
    }

    // Generate tokens
    const accessToken = generateToken(payload)
    const refreshToken = await generateRefreshToken(
      isDriverLogin ? undefined : user.id,
      isDriverLogin ? user.id : undefined,
    )

    // Update last login time
    if (!isDriverLogin) {
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id)
    }

    // Create response
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: isDriverLogin ? "driver" : user.role,
      },
      token: accessToken,
    })

    // Set cookies
    setAuthCookies(response, accessToken, refreshToken)

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 })
  }
}
