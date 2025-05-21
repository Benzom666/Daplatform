import type { NextRequest } from "next/server"
import { verifyToken } from "./auth"

// Verify authentication and authorization
export async function verifyAuth(
  request: NextRequest,
  allowedRoles?: string[],
): Promise<{
  authorized: boolean
  userId?: number
  driverId?: number
  userRole?: string
}> {
  // Get token from Authorization header
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

  // If no token, check cookies
  const cookieToken = request.cookies.get("access_token")?.value

  const finalToken = token || cookieToken

  if (!finalToken) {
    return { authorized: false }
  }

  // Verify token
  const payload = verifyToken(finalToken)

  if (!payload) {
    return { authorized: false }
  }

  // Check role if specified
  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return { authorized: false }
  }

  // Return user info based on type
  if (payload.type === "user") {
    return {
      authorized: true,
      userId: payload.id,
      userRole: payload.role,
    }
  } else if (payload.type === "driver") {
    return {
      authorized: true,
      driverId: payload.id,
      userRole: "driver",
    }
  }

  return { authorized: false }
}
