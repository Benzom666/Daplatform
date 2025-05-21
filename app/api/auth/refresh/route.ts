import { type NextRequest, NextResponse } from "next/server"
import { refreshAccessToken, clearAuthCookies } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      const response = NextResponse.json({ error: "No refresh token provided" }, { status: 401 })
      return clearAuthCookies(response)
    }

    // Try to refresh the access token
    const newAccessToken = await refreshAccessToken(refreshToken)

    if (!newAccessToken) {
      const response = NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
      return clearAuthCookies(response)
    }

    // Create response
    const response = NextResponse.json({
      token: newAccessToken,
    })

    // Set new access token cookie (keep the same refresh token)
    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    })

    return response
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message || "Token refresh failed" }, { status: 500 })
    return clearAuthCookies(response)
  }
}
