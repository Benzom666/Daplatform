import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Define public paths that don't require authentication
const publicPaths = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/refresh"]

// Define paths that require specific roles
const roleRestrictedPaths = {
  "/dashboard": ["admin", "dispatcher", "manager"],
  "/api/users": ["admin"],
  "/api/drivers/register": ["admin", "manager"],
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next()

  // Check if the path is public
  if (publicPaths.some((p) => path === p || path.startsWith(`${p}/`))) {
    return response
  }

  // Create Supabase client
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // If API request, return 401
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Otherwise redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Get user role from metadata
  const role = session.user.user_metadata.role || "user"

  // Check role restrictions
  for (const [restrictedPath, allowedRoles] of Object.entries(roleRestrictedPaths)) {
    if (path.startsWith(restrictedPath) && !allowedRoles.includes(role)) {
      // If API request, return 403
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Otherwise redirect to home
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // Special case for driver app - only drivers can access their own pages
  if (path.startsWith("/driver-app/") && role === "driver") {
    const driverId = path.split("/")[2]
    if (driverId && driverId !== session.user.id) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
