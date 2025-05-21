import type { ReactNode } from "react"
import Link from "next/link"
import { getServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, Truck, BarChart, Home, LogOut, Database } from "lucide-react"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = getServerClient()

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("name, role").eq("id", session.user.id).single()

  // Update the navItems array to include a database management link for admins
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Orders",
      href: "/dashboard/orders",
      icon: Package,
    },
    {
      title: "Drivers",
      href: "/dashboard/drivers",
      icon: Truck,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart,
    },
    // Add this new item
    ...(profile?.role === "admin"
      ? [
          {
            title: "Database",
            href: "/dashboard/admin/database",
            icon: Database,
          },
        ]
      : []),
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-bold">Delivery Management Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{profile?.name}</span>
              <span className="mx-1">•</span>
              <span className="capitalize">{profile?.role}</span>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <div className="h-full py-6 pr-6 lg:py-8">
            <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden py-6">{children}</main>
      </div>
    </div>
  )
}
