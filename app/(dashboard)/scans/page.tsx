"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  QrCode,
  Search,
  Smartphone,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  get,
  type Scan,
  type ScanStatus,
  type ScanListResponse,
  type ScanStats,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

type StatusFilter = "all" | ScanStatus

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "matched", label: "Matched" },
  { value: "expired", label: "Expired" },
]

const statusBadgeDot: Record<ScanStatus, string> = {
  pending: "bg-amber-500",
  matched: "bg-emerald-500",
  expired: "bg-muted-foreground",
}

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function expiryLabel(scan: Scan) {
  const diff = new Date(scan.expires_at).getTime() - Date.now()
  if (scan.status !== "pending") return null
  if (diff <= 0) return "Expired"
  const mins = Math.max(0, Math.round(diff / 60000))
  if (mins < 60) return `Expires in ${mins} min`
  return `Expires in ${Math.round(mins / 60)} hr`
}

export default function ScansPage() {
  const [scans, setScans] = React.useState<Scan[] | null>(null)
  const [stats, setStats] = React.useState<ScanStats | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [device, setDevice] = React.useState("all")
  const [page, setPage] = React.useState(1)

  // Debounced query so we don't hit the backend on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  React.useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 350)
    return () => clearTimeout(id)
  }, [query])

  // Load stats (summary cards + device options) once.
  React.useEffect(() => {
    get<ScanStats>("/scans/stats")
      .then(setStats)
      .catch(() => {})
  }, [])

  // Load scans with server-side filters + pagination.
  React.useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setLoading(true)
    })

    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(PAGE_SIZE))
    if (status !== "all") params.set("status", status)
    if (device !== "all") params.set("device", device)
    if (debouncedQuery) params.set("q", debouncedQuery)

    get<ScanListResponse>(`/scans?${params.toString()}`)
      .then((res) => {
        if (cancelled) return
        setScans(res.scans)
        setTotal(res.total)
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
  }, [page, status, device, debouncedQuery])

  function resetPage() {
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, total)

  const summary = [
    { label: "Total", value: stats?.total ?? 0, accent: "text-foreground" },
    { label: "Matched", value: stats?.matched ?? 0, accent: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pending", value: stats?.pending ?? 0, accent: "text-amber-600 dark:text-amber-400" },
    { label: "Expired", value: stats?.expired ?? 0, accent: "text-muted-foreground" },
  ]

  return (
    <DashboardShell
      title="Scans"
      subtitle="QR check-ins across the network"
    >
      {/* ── Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-black tabular-nums", s.accent)}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Toolbar: search + filters ────────────────── */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search token, city, device, IP…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetPage()
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setStatus(f.value)
                  resetPage()
                }}
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                  status === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Device filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <Filter className="size-4" />
                  {device === "all" ? "All devices" : device}
                  <ChevronDown className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={device}
                onValueChange={(v) => {
                  setDevice(v)
                  resetPage()
                }}
              >
                <DropdownMenuRadioItem value="all">All devices</DropdownMenuRadioItem>
                {(stats?.devices ?? []).map((d) => (
                  <DropdownMenuRadioItem key={d} value={d} className="capitalize">
                    {d}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────── */}
      {error ? (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load scans. {error}
        </div>
      ) : loading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : scans === null || scans.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <QrCode className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {total === 0 ? "No scans yet" : "No matches found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {total === 0
                ? "QR check-ins will show up here as customers scan in."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        </div>
      ) : (
        <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
          {/* Table header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="font-black">Check-in directory</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {total} scan{total === 1 ? "" : "s"} matching your search
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Token</th>
                  <th className="px-4 py-2.5">Spot</th>
                  <th className="px-4 py-2.5">City</th>
                  <th className="px-4 py-2.5">Region</th>
                  <th className="px-4 py-2.5">Device</th>
                  <th className="px-4 py-2.5">Scanned at</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scans.map((scan) => (
                  <tr key={scan.id} className="text-xs transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-accent px-2 py-1 font-mono text-xs font-black tracking-widest text-primary">
                        {scan.scan_token}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{scan.spot_id}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        {scan.city || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {scan.region || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="size-3.5 shrink-0" />
                        <span className="capitalize">{scan.device_type || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" />
                        {formatTime(scan.scanned_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-sm bg-secondary/60 px-2 py-1 text-[10px] font-bold text-muted-foreground">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            statusBadgeDot[scan.status]
                          )}
                        />
                        <span className="capitalize">{scan.status}</span>
                      </span>
                      {expiryLabel(scan) && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {expiryLabel(scan)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/scans/${scan.scan_token}`}
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
              Showing {start}–{end} of {total} scan
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
