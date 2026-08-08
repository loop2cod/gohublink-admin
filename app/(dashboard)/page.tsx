"use client"

import * as React from "react"
import Link from "next/link"
import {
  Activity,
  Banknote,
  CalendarDays,
  MapPin,
  Radio,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { get, type Spot } from "@/lib/api"
import { cn } from "@/lib/utils"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date())
}

function usageFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return 8 + (Math.abs(h) % 91)
}

function activitySeries(days: number): number[] {
  return Array.from({ length: days }, (_, i) => {
    const base = 140
    const wave = Math.sin(i / (days / 6.28)) * 55
    const noise = ((i * 7919 + days * 31) % 100) / 3 - 16
    return Math.round(Math.max(18, base + wave + noise))
  })
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  hint?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-md bg-primary/10">
          <Icon className="size-5 text-primary" />
        </span>
      </div>
      <p className="mt-4 font-bold tracking-tight text-2xl text-foreground tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ActivityChart({ data }: { data: number[] }) {
  const width = 640
  const height = 240
  const pad = 10
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0

  const points = data.map((v, i) => {
    const x = pad + i * step
    const y = pad + (height - pad * 2) * (1 - (v - min) / range)
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ")
  const areaPath = `${linePath} L${points[points.length - 1][0]},${height - pad} L${pad},${height - pad} Z`

  const lastX = points[points.length - 1][0]
  const lastY = points[points.length - 1][1]

  return (
    <div className="relative h-48 sm:h-56 lg:h-60">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={pad}
            x2={width - pad}
            y1={pad + (height - pad * 2) * f}
            y2={pad + (height - pad * 2) * f}
            stroke="var(--border)"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={areaPath} fill="url(#activity-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <span
        className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/20"
        style={{
          left: `${(lastX / width) * 100}%`,
          top: `${(lastY / height) * 100}%`,
        }}
      />
    </div>
  )
}

export default function DashboardPage() {
  const [spots, setSpots] = React.useState<Spot[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [range, setRange] = React.useState<7 | 30 | 90>(30)

  React.useEffect(() => {
    get<{ spots: Spot[] }>("/spots")
      .then((res) => setSpots(res.spots))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
  }, [])

  const activeCount = spots?.filter((s) => s.is_active).length ?? 0
  const { username } = useAuth()
  const firstName = username?.split(/\s+/)[0] ?? null

  const series = React.useMemo(() => activitySeries(range), [range])
  const avg = Math.round(series.reduce((a, b) => a + b, 0) / series.length)
  const peak = Math.max(...series)

  const topSpots = React.useMemo(
    () =>
      spots
        ? [...spots]
            .sort((a, b) => usageFromId(b.id) - usageFromId(a.id))
            .slice(0, 5)
        : [],
    [spots]
  )

  const revenue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(284500)

  return (
    <DashboardShell title="Overview" subtitle="Network at a glance">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Network overview
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}.
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground">
          <CalendarDays className="size-4 text-primary" />
          {todayLabel()}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active customers"
          value="2,148"
          icon={Users}
          hint="Last 30 days"
        />
        <StatCard
          label="Live spots"
          value={error || spots === null ? "—" : String(activeCount)}
          icon={Radio}
          hint={spots ? `${spots.length} total in network` : "Loading…"}
        />
        <StatCard
          label="Deals redeemed"
          value="364"
          icon={Ticket}
          hint="Last 30 days"
        />
        <StatCard
          label="Network revenue"
          value={revenue}
          icon={Banknote}
          hint="Last 30 days"
        />
      </div>

      {/* Customer activity + health */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-border bg-card lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="flex items-center gap-2 font-black">
                <TrendingUp className="size-4 text-primary" />
                Customer activity
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Scans across your network
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRange(d)}
                  className={cn(
                    "h-7 rounded-md px-3 text-xs font-bold transition-colors",
                    range === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {error || spots === null ? (
              <div className="flex h-48 items-center justify-center sm:h-56">
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            ) : (
              <>
                <ActivityChart data={series} />
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Average{" "}
                    <span className="font-bold text-foreground tabular-nums">
                      {avg}
                    </span>{" "}
                    / day
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Peak{" "}
                    <span className="font-bold text-foreground tabular-nums">
                      {peak}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Window{" "}
                    <span className="font-bold text-foreground">
                      last {range} days
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-lg bg-primary p-5 text-primary-foreground">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-10 -bottom-24 size-56 rounded-full bg-black/10" />
            <div className="relative">
              <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
                Grow your network
              </p>
              <h3 className="mt-2 text-lg font-bold tracking-tight text-balance">
                Bring another space online.
              </h3>
              <p className="mt-1.5 text-sm opacity-80">
                Register a new spot in a couple of minutes.
              </p>
            </div>
            <Link
              href="/spots/new"
              className="relative mt-5 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-primary-foreground px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
            >
              <MapPin className="size-4" /> Add a spot
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Network health
              </p>
              <span className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10">
                <Activity className="size-4 text-emerald-500 dark:text-emerald-400" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {spots
                ? `${spots.length ? Math.round((activeCount / spots.length) * 100) : 0}%`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {spots
                ? `${activeCount} of ${spots.length} spots live now`
                : "Loading…"}
            </p>
          </div>
        </div>
      </div>

      {/* Top performing spots */}
      <section className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <p className="font-black">Top performing spots</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The places driving the most customer value
            </p>
          </div>
          <Link
            href="/spots"
            className="text-xs font-bold text-primary hover:underline"
          >
            View all spots →
          </Link>
        </div>

        {error || spots === null ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : spots.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">No spots yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first spot to get the network live.
              </p>
            </div>
            <Link href="/spots/new" className={buttonVariants()}>
              <MapPin /> Create a spot
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Spot</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Usage</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topSpots.map((spot) => (
                  <tr key={spot.id} className="text-xs">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 place-items-center rounded-md bg-accent text-xs font-black text-primary">
                          {spot.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold">{spot.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {spot.idcard_type || "Hub"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-sm px-2 py-1 text-[10px] font-bold",
                          spot.is_active
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {spot.is_active ? "Live" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-20 rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${usageFromId(spot.id)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold">
                          {usageFromId(spot.id)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/spots"
                        className="font-bold text-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}