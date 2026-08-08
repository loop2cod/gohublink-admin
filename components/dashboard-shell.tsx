"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, MapPin, Plus } from "lucide-react"

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
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-border bg-sidebar lg:w-64">
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-border lg:justify-start lg:px-6">
          <Link href="/" className="flex items-center" aria-label="goHublink admin">
            <Image
              src="/logo.svg"
              alt="goHublink logo"
              width={549}
              height={156}
              priority
              className="hidden h-7 w-auto lg:block"
            />
            <span className="lg:hidden">GH</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <p className="hidden px-2 pt-2 pb-3 text-[11px] font-medium tracking-widest text-muted-foreground uppercase lg:block">
            Manage
          </p>

          <div className="flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon
              const isActive = (() => {
                if (item.exact) return pathname === item.href
                return pathname.startsWith(item.href)
              })()
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:justify-start",
                    isActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/spots/new"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 lg:justify-start"
            >
              <Plus className="size-5 shrink-0" />
              <span className="hidden lg:inline">New spot</span>
            </Link>
          </div>
        </nav>

        <div className="flex shrink-0 flex-row items-center justify-around gap-2 border-t border-border p-3 lg:flex-col lg:items-stretch">
          <div className="flex h-9 items-center gap-2.5 px-1 lg:px-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground uppercase">
              {(username ?? "A").charAt(0)}
            </div>
            <div className="hidden min-w-0 flex-col lg:flex">
              <span className="truncate text-sm font-medium text-foreground">
                {username ?? "Admin"}
              </span>
              <span className="text-xs text-muted-foreground">Administrator</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              router.replace("/login")
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:w-full lg:justify-start lg:gap-2 lg:px-2"
            aria-label="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="hidden lg:inline text-sm">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pl-16 lg:pl-64">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>

        <div className="mx-auto w-full max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}