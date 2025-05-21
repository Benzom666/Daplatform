import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import { clearAuthCookies } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.get("refresh_token")?.value

    if (refreshToken) {
      // Delete refresh token from database
      const supabase = getServerClient()
      await supabase.from("refresh_tokens").delete().eq("token", refreshToken)
    }

    // Create response
    const response = NextResponse.json({
      success: true,
    })

    // Clear cookies
    return clearAuthCookies(response)
  } catch (error: any) {
    const response = NextResponse.json({
      success: true,
    })

    // Clear cookies even if there was an error
    return clearAuthCookies(response)
  }
}
