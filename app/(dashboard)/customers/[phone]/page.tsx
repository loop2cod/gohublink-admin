"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Fingerprint,
  MapPin,
  Network,
  Phone,
  ScanLine,
  Smartphone,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { get, type CustomerDetail, type ScanStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const statusMeta: Record<
  ScanStatus,
  { label: string; badge: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Pending", badge: "outline" },
  matched: { label: "Matched", badge: "default" },
  expired: { label: "Expired", badge: "secondary" },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: string | number | null
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 break-words text-sm text-foreground",
          mono && "font-mono text-xs tracking-wide"
        )}
      >
        {value === undefined || value === null || value === "" ? "—" : String(value)}
      </p>
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="flex flex-row items-center gap-2.5 border-b border-border/60 p-4 sm:p-5">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <CardTitle className="text-sm font-semibold text-foreground sm:text-base">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  )
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-black tabular-nums", accent)}>{value}</p>
    </div>
  )
}

export default function CustomerDetailPage() {
  const { phone } = useParams<{ phone: string }>()
  const [data, setData] = React.useState<CustomerDetail | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const requestIdRef = React.useRef(0)

  React.useEffect(() => {
    const requestId = ++requestIdRef.current
    get<CustomerDetail>(`/customers/${encodeURIComponent(phone)}`)
      .then((res) => {
        if (requestIdRef.current === requestId) {
          setData(res)
          setError(null)
        }
      })
      .catch((e) => {
        if (requestIdRef.current === requestId) {
          setData(null)
          setError(e instanceof Error ? e.message : "Failed to load")
        }
      })
  }, [phone])

  const loaded = data !== null && data.phone_number === phone
  const customer = loaded ? data : null

  const flaggedScans = customer
    ? customer.scans.filter((s) => s.flags.different_region || s.flags.different_ip)
        .length
    : 0

  return (
    <DashboardShell
      title="Customer detail"
      subtitle={loaded ? customer!.name || customer!.phone_number : "Loading…"}
      action={
        <Link
          href="/customers"
          className={buttonVariants({ variant: "ghost" })}
        >
          <ArrowLeft /> Back to customers
        </Link>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load this customer. {error}
        </div>
      ) : !loaded || customer === null ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Hero header ─────────────────────────────── */}
          <Card className="overflow-hidden border-border">
            <CardContent className="p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {customer.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={customer.profile_picture_url}
                      alt={customer.name || "Customer"}
                      className="size-16 shrink-0 rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-black text-primary">
                      {initials(customer.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-foreground sm:text-xl">
                      {customer.name || "Unnamed customer"}
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="size-4" />
                      <span className="font-mono">{customer.phone_number}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        Joined {formatDate(customer.first_scan_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        Last active {formatDateTime(customer.last_active)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-7 gap-1.5 text-xs",
                      flaggedScans > 0 &&
                        "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    <AlertTriangle className="size-3.5" />
                    {flaggedScans} flagged scan{flaggedScans === 1 ? "" : "s"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Summary stats ───────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Total scans" value={customer.summary.total_scans} />
            <StatTile
              label="Matched"
              value={customer.summary.matched_scans}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <StatTile
              label="Pending"
              value={customer.summary.pending_scans}
              accent="text-amber-600 dark:text-amber-400"
            />
            <StatTile label="Expired" value={customer.summary.expired_scans} />
            <StatTile label="Spots visited" value={customer.summary.spots_visited} />
            <StatTile label="Regions seen" value={customer.summary.regions_seen} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ── Usual location ────────────────────────── */}
            <SectionCard icon={MapPin} title="Usual location">
              {customer.usual_location ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <MapPin className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {[
                          customer.usual_location.city,
                          customer.usual_location.region,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {customer.usual_location.country} · seen{" "}
                        {customer.usual_location.count} time
                        {customer.usual_location.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="City"
                      value={customer.usual_location.city}
                    />
                    <Field
                      label="Region"
                      value={customer.usual_location.region}
                    />
                    <Field
                      label="Country"
                      value={customer.usual_location.country}
                    />
                    <Field
                      label="Country code"
                      value={customer.usual_location.country_code}
                      mono
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No location data for this customer yet.
                </p>
              )}
            </SectionCard>

            {/* ── Usual network ─────────────────────────── */}
            <SectionCard icon={Network} title="Usual network">
              {customer.usual_network ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <Network className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-foreground">
                        {customer.usual_network.ip_address}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-muted-foreground">
                        {[customer.usual_network.isp, customer.usual_network.network_org]
                          .filter(Boolean)
                          .join(" · ") || "No ISP data"}
                      </p>
                    </div>
                  </div>
                  <Field
                    label="Times seen from this network"
                    value={customer.usual_network.count}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No network data for this customer yet.
                </p>
              )}
            </SectionCard>
          </div>

          {/* ── Scan history ────────────────────────────── */}
          <SectionCard icon={ScanLine} title={`Scan history (${customer.scans.length})`}>
            {customer.scans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-secondary/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Token</th>
                      <th className="px-4 py-2.5">Spot</th>
                      <th className="px-4 py-2.5">Location</th>
                      <th className="px-4 py-2.5">IP</th>
                      <th className="px-4 py-2.5">Device</th>
                      <th className="px-4 py-2.5">Scanned</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customer.scans.map((scan) => (
                      <tr
                        key={scan.id}
                        className="text-xs transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/scans/${scan.scan_token}`}
                            className="rounded-md bg-accent px-2 py-1 font-mono text-xs font-black tracking-widest text-primary hover:underline"
                          >
                            {scan.scan_token}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-bold">{scan.spot_id}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            {[scan.city, scan.region].filter(Boolean).join(", ") ||
                              "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 font-mono text-muted-foreground">
                            <Fingerprint className="size-3.5 shrink-0" />
                            {scan.ip_address || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="size-3.5 shrink-0" />
                            <span className="capitalize">
                              {scan.device_type || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(scan.scanned_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge variant={statusMeta[scan.status].badge}>
                              {statusMeta[scan.status].label}
                            </Badge>
                            {(scan.flags.different_region ||
                              scan.flags.different_ip) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="size-3" />
                                {[
                                  scan.flags.different_region ? "Region" : null,
                                  scan.flags.different_ip ? "IP" : null,
                                ]
                                  .filter(Boolean)
                                  .join(" + ")}{" "}
                                unusual
                              </span>
                            )}
                          </div>
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
            )}
          </SectionCard>
        </div>
      )}
    </DashboardShell>
  )
}
