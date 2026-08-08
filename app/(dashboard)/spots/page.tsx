"use client"

import * as React from "react"
import Link from "next/link"
import { MapPin, Plus, Search } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { get, type Spot } from "@/lib/api"

export default function SpotsPage() {
  const [spots, setSpots] = React.useState<Spot[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    get<{ spots: Spot[] }>("/spots")
      .then((res) => setSpots(res.spots))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
  }, [])

  const filtered = React.useMemo(() => {
    if (!spots) return []
    const q = query.trim().toLowerCase()
    if (!q) return spots
    return spots.filter((s) =>
      [s.name, s.id, s.incharge_name, s.incharge_phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    )
  }, [spots, query])

  return (
    <DashboardShell
      title="Spots"
      subtitle="All spaces in the network"
      action={
        <Link href="/spots/new" className={buttonVariants()}>
          <Plus /> New spot
        </Link>
      }
    >
      <div className="mb-5 flex w-full max-w-sm items-center gap-2">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search spots…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load spots. {error}
        </div>
      ) : spots === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
          <MapPin className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {spots.length === 0 ? "No spots yet" : "No matches found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {spots.length === 0
                ? "Create your first spot to get started."
                : "Try adjusting your search."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Incharge</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Coordinates</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((spot) => (
                <TableRow key={spot.id}>
                  <TableCell>
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary">
                      {spot.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {spot.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {spot.incharge_name || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {spot.incharge_phone || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        spot.is_active
                          ? "inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400"
                          : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {spot.is_active ? "Live" : "Inactive"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            {filtered.length} spot{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </DashboardShell>
  )
}