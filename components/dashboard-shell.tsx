"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  ScanLine,
  Users,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

const nav = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Scans",
    href: "/scans",
    icon: ScanLine,
    exact: false,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    exact: false,
  },
  {
    label: "Spots",
    href: "/spots",
    icon: MapPin,
    exact: false,
  },
]

export function DashboardShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { username, logout } = useAuth()

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-sidebar-border bg-sidebar lg:w-64">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-3 lg:px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="goHublink admin">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold tracking-tight text-sidebar-primary-foreground">
              gh
            </span>
            <span className="hidden min-w-0 flex-col leading-tight lg:flex">
              <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                goHublink
              </span>
              <span className="text-[11px] text-muted-foreground">Admin console</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 lg:p-4">
          <p className="hidden px-3 pt-1 pb-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase lg:block">
            Main menu
          </p>

          <div className="flex flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    !isActive && "lg:px-4"
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="pt-3">
            <Link
              href="/spots/new"
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-sm font-medium text-foreground transition-colors hover:bg-card lg:justify-start lg:px-4"
            >
              <Plus className="size-5 shrink-0" />
              <span className="hidden lg:inline">New spot</span>
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="shrink-0 border-t border-sidebar-border p-3 lg:p-4">
          <div className="flex flex-col items-center gap-2 lg:flex-row lg:justify-start lg:gap-3 lg:px-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {(username ?? "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 flex-1 flex-col lg:flex">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {username ?? "Admin"}
              </span>
              <span className="text-xs text-muted-foreground">Administrator</span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                router.replace("/login")
              }}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pl-16 lg:pl-64">
        <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          )}
        </div>

        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}