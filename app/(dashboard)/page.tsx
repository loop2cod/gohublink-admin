"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, MapPin, Plus, Users } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { get, type Spot } from "@/lib/api"

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
    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [spots, setSpots] = React.useState<Spot[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    get<{ spots: Spot[] }>("/spots")
      .then((res) => setSpots(res.spots))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
  }, [])

  const activeCount = spots?.filter((s) => s.is_active).length ?? 0

  return (
    <DashboardShell title="Overview" subtitle="Network at a glance">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {error || spots === null ? (
          <>
            <div className="h-28 rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-16" />
            </div>
            <div className="hidden h-28 rounded-xl border border-border bg-card p-5 sm:block">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-16" />
            </div>
            <div className="hidden h-28 rounded-xl border border-border bg-card p-5 lg:block">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-16" />
            </div>
          </>
        ) : (
          <>
            <StatCard
              label="Total spots"
              value={String(spots.length)}
              icon={MapPin}
              hint="Across the network"
            />
            <StatCard
              label="Active spots"
              value={String(activeCount)}
              icon={Users}
              hint="Currently live"
            />
            <StatCard
              label="Inactive spots"
              value={String(spots.length - activeCount)}
              icon={MapPin}
              hint="Needs attention"
            />
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Recent spots
        </h2>
        <Link
          href="/spots"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          We couldn&apos;t load your spots. {error}
        </div>
      ) : spots === null ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : spots.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border p-10 text-center">
          <MapPin className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              No spots yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first spot to get the network live.
            </p>
          </div>
          <Link href="/spots/new" className={buttonVariants()}>
            <Plus /> Create a spot
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <ul className="divide-y divide-border">
            {spots.slice(0, 5).map((spot) => (
              <li key={spot.id}>
                <Link
                  href="/spots"
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                      {spot.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {spot.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        ID {spot.id}
                        {spot.incharge_name && ` · ${spot.incharge_name}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={
                      spot.is_active
                        ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {spot.is_active ? "Live" : "Inactive"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardShell>
  )
}