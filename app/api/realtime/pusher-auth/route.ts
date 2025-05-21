import { type NextRequest, NextResponse } from "next/server"
import { pusherServer } from "@/lib/pusher-server"
import { authenticateRequest } from "@/lib/auth"

export async function POST(req: NextRequest) {
  // Authenticate the request
  const { user, isAuthorized } = await authenticateRequest(req)

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const socketId = data.socket_id
    const channel = data.channel_name

    // Authorize the channel
    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: user.id.toString(),
      user_info: {
        name: user.name,
        role: user.role,
      },
    })

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("Pusher auth error:", error)
    return NextResponse.json({ error: "Failed to authorize channel" }, { status: 500 })
  }
}
