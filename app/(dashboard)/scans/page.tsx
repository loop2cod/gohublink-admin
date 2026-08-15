"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  QrCode,
  Search,
  Smartphone,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { get, type Scan, type ScanStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

type StatusFilter = "all" | ScanStatus

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "matched", label: "Matched" },
  { value: "expired", label: "Expired" },
]

const statusStyles: Record<ScanStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  matched: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expired: "bg-secondary text-muted-foreground",
}

function matchesQuery(scan: Scan, q: string) {
  if (!q) return true
  return [scan.scan_token, scan.spot_id, scan.ip_address, scan.customer_name]
    .filter(Boolean)
    .some((v) => v!.toLowerCase().includes(q))
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
  return `Expires in ${mins} min`
}

export default function ScansPage() {
  const [scans, setScans] = React.useState<Scan[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    get<{ scans: Scan[] }>("/scans")
      .then((res) => setScans(res.scans))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
  }, [])

  const filtered = React.useMemo(() => {
    if (!scans) return []
    const q = query.trim().toLowerCase()
    return scans.filter(
      (s) =>
        matchesQuery(s, q) && (status === "all" || s.status === status)
    )
  }, [scans, query, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, filtered.length)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function resetPage() {
    setPage(1)
  }

  return (
    <DashboardShell
      title="Scans"
      subtitle="QR check-ins across the network"
    >
      {/* Toolbar: search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search token, spot, IP…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetPage()
            }}
            className="pl-9"
          />
        </div>

        <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1">
          {filters.map((f) => (
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
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load scans. {error}
        </div>
      ) : scans === null ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <QrCode className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {scans.length === 0 ? "No scans yet" : "No matches found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {scans.length === 0
                ? "QR check-ins will show up here as customers scan in."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        </div>
      ) : (
        <section className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="font-black">Check-in directory</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered.length} scan{filtered.length === 1 ? "" : "s"} matching
                your search
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Token</th>
                  <th className="px-4 py-2.5">Spot</th>
                  <th className="px-4 py-2.5">Device</th>
                  <th className="px-4 py-2.5">Scanned at</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((scan) => (
                  <tr key={scan.id} className="text-xs">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-accent px-2 py-1 font-mono text-xs font-black tracking-widest text-primary">
                        {scan.scan_token}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{scan.spot_id}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="size-3.5" />
                        <span className="capitalize">{scan.device_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {formatTime(scan.scanned_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-sm px-2 py-1 text-[10px] font-bold",
                          statusStyles[scan.status]
                        )}
                      >
                        {scan.status}
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

          <div className="flex flex-col items-center justify-between gap-3 border-t border-border p-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing {start}–{end} of {filtered.length} scan
              {filtered.length === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={safePage <= 1}
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
                disabled={safePage >= totalPages}
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
