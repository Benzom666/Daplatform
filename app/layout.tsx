import type React from "react"
import { RealtimeProvider } from "@/components/realtime-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "@/app/globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RealtimeProvider>{children}</RealtimeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
