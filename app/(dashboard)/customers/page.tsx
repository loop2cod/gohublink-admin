"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Users,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { get, type CustomerListResponse } from "@/lib/api"

const PAGE_SIZE = 10

function buildPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  const candidates = [1, total, current - 1, current, current + 1]
  const pages = Array.from(new Set(candidates))
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  let prev = 0
  for (const p of pages) {
    if (p - prev > 1) result.push("ellipsis")
    result.push(p)
    prev = p
  }
  return result
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<CustomerListResponse | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  React.useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 350)
    return () => clearTimeout(id)
  }, [query])

  React.useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setLoading(true)
    })

    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(PAGE_SIZE))
    if (debouncedQuery) params.set("q", debouncedQuery)

    get<CustomerListResponse>(`/customers?${params.toString()}`)
      .then((res) => {
        if (cancelled) return
        setCustomers(res)
        setError(null)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to load")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, debouncedQuery])

  const items = customers?.customers ?? []
  const total = customers?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, total)

  function resetPage() {
    setPage(1)
  }

  return (
    <DashboardShell
      title="Customers"
      subtitle="People in your network"
    >
      {/* ── Toolbar: search ───────────────────────────── */}
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name or phone…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            resetPage()
          }}
          className="pl-9"
        />
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load customers. {error}
        </div>
      ) : loading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <Users className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {total === 0 ? "No customers yet" : "No matches found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {total === 0
                ? "Customers appear here once they claim a check-in."
                : "Try adjusting your search."}
            </p>
          </div>
        </div>
      ) : (
        <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="font-black">Customer directory</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {total} customer{total === 1 ? "" : "s"} in your network
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Usual location</th>
                  <th className="px-4 py-2.5">Scans</th>
                  <th className="px-4 py-2.5">Spots</th>
                  <th className="px-4 py-2.5">Last active</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((cu) => (
                  <tr
                    key={cu.phone_number}
                    className="text-xs transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {cu.profile_picture_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cu.profile_picture_url}
                              alt={cu.name}
                              className="size-9 rounded-full object-cover"
                            />
                          ) : (
                            initials(cu.name)
                          )}
                        </div>
                        <span className="font-semibold text-foreground">
                          {cu.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {cu.phone_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        {cu.usual_city
                          ? [cu.usual_city, cu.usual_region]
                              .filter(Boolean)
                              .join(", ")
                          : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-foreground">
                        {cu.total_scans}
                      </span>
                      <span className="ml-1.5 text-muted-foreground">
                        ({cu.matched_scans} matched)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cu.spots_visited}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(cu.last_active)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/customers/${encodeURIComponent(cu.phone_number)}`}
                        className="font-bold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border p-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing {start}–{end} of {total} customer
              {total === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={safePage <= 1 || loading}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>

              <span className="px-2 text-sm font-medium text-foreground sm:hidden">
                Page {safePage} of {totalPages}
              </span>

              <div className="hidden items-center gap-1 sm:flex">
                {buildPageNumbers(safePage, totalPages).map((p, i) =>
                  p === "ellipsis" ? (
                    <span
                      key={`e-${i}`}
                      className="flex h-8 items-center px-1 text-sm text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      type="button"
                      size="icon-sm"
                      variant={p === safePage ? "default" : "ghost"}
                      disabled={loading}
                      onClick={() => setPage(p)}
                      aria-label={`Go to page ${p}`}
                      aria-current={p === safePage ? "page" : undefined}
                    >
                      {p}
                    </Button>
                  )
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={safePage >= totalPages || loading}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </section>
      )}
    </DashboardShell>
  )
}
