"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  Copy,
  Cpu,
  Globe,
  Link2,
  MapPin,
  Monitor,
  Network,
  QrCode,
  Smartphone,
  User,
  UserCheck,
  Users,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { get, type Scan, type ScanStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const statusMeta: Record<
  ScanStatus,
  { label: string; badge: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", badge: "outline" },
  matched: { label: "Matched", badge: "default" },
  expired: { label: "Expired", badge: "secondary" },
}

const deviceMeta: Record<string, { icon: typeof Monitor; label: string }> = {
  ios: { icon: Smartphone, label: "iOS" },
  android: { icon: Smartphone, label: "Android" },
  mobile: { icon: Smartphone, label: "Mobile" },
  tablet: { icon: Monitor, label: "Tablet" },
  desktop: { icon: Monitor, label: "Desktop" },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function relativeExpiry(scan: Scan) {
  const diff = new Date(scan.expires_at).getTime() - Date.now()
  if (scan.status !== "pending") return null
  if (diff <= 0) return { text: "Expired", danger: true }
  const mins = Math.round(diff / 60000)
  if (mins < 60) return { text: `Expires in ${mins} min`, danger: mins <= 10 }
  const hours = Math.round(mins / 60)
  return { text: `Expires in ${hours} hr`, danger: false }
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
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground sm:text-base">
            {title}
          </CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  )
}

function Grid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-x-6 gap-y-5 sm:grid-cols-2", className)}>
      {children}
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`Copy ${value}`}
    >
      <Copy className="size-3.5" />
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

export default function ScanDetailPage() {
  const { token } = useParams<{ token: string }>()
  const [scan, setScan] = React.useState<Scan | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const requestIdRef = React.useRef(0)

  React.useEffect(() => {
    const requestId = ++requestIdRef.current
    get<Scan>(`/scans/by-token/${encodeURIComponent(token)}`)
      .then((data) => {
        if (requestIdRef.current === requestId) {
          setScan(data)
          setError(null)
        }
      })
      .catch((e) => {
        if (requestIdRef.current === requestId) {
          setScan(null)
          setError(e instanceof Error ? e.message : "Failed to load")
        }
      })
  }, [token])

  // Only show data that belongs to the current token so navigating between
  // scans never flashes a stale record. While a request is in flight we show
  // the loading skeleton.
  const loaded = scan !== null && scan.scan_token === token
  const shown = loaded ? scan : null

  const expiry = shown ? relativeExpiry(shown) : null
  const device = deviceMeta[shown?.device_type ?? ""] ?? {
    icon: Monitor,
    label: shown?.device_type ? shown.device_type : "Unknown",
  }
  const DeviceIcon = device.icon
  const hasNetwork = Boolean(
    shown?.ip_address ||
      shown?.isp ||
      shown?.network_org ||
      shown?.as_number ||
      shown?.connection_type
  )
  const hasLocation = Boolean(
    shown?.city || shown?.region || shown?.country_name || shown?.postal_code
  )
  const hasDevice = Boolean(
    shown?.os_name ||
      shown?.browser_name ||
      shown?.device_brand ||
      shown?.device_model
  )
  const hasReferral = Boolean(
    shown?.referrer_host ||
      shown?.utm_source ||
      shown?.utm_medium ||
      shown?.utm_campaign
  )

  return (
    <DashboardShell
      title="Scan detail"
      subtitle={loaded ? `Check-in ${shown!.scan_token}` : "Loading…"}
      action={
        <Link
          href="/scans"
          className={buttonVariants({ variant: "ghost" })}
        >
          <ArrowLeft /> Back to scans
        </Link>
      }
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load this scan. {error}
        </div>
      ) : !loaded ? (
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
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 sm:size-16">
                    <QrCode className="size-7 text-primary sm:size-8" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-black tracking-widest text-foreground sm:text-xl">
                        {shown!.scan_token}
                      </span>
                      <Badge variant={statusMeta[shown!.status].badge}>
                        {statusMeta[shown!.status].label}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Scanned at spot{" "}
                      <span className="font-bold text-foreground">{shown!.spot_id}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span>{formatDateTime(shown!.scanned_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {expiry && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold",
                        expiry.danger
                          ? "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                          : "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      <Clock className="size-4" />
                      {expiry.text}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="h-6 gap-1.5 font-mono text-xs">
                      <Network className="size-3" />
                      {shown!.ip_address || "No IP"}
                    </Badge>
                    {hasLocation && (
                      <Badge variant="outline" className="h-6 gap-1.5">
                        <MapPin className="size-3" />
                        {[shown!.city, shown!.region].filter(Boolean).join(", ") ||
                          shown!.country_name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ── Overview / metadata ────────────────────── */}
            <SectionCard icon={QrCode} title="Check-in details">
              <Grid>
                <Field label="Scan ID" value={shown!.id} mono />
                <Field label="Spot ID" value={shown!.spot_id} mono />
                <Field label="Token" value={shown!.scan_token} mono />
                <Field label="Status" value={shown!.status} />
                <Field label="Scanned at" value={formatDateTime(shown!.scanned_at)} />
                <Field label="Expires at" value={formatDateTime(shown!.expires_at)} />
              </Grid>
            </SectionCard>

            {/* ── Network & IP ───────────────────────────── */}
            <SectionCard icon={Network} title="Network & IP">
              {hasNetwork ? (
                <Grid>
                  <Field label="IP address" value={shown!.ip_address} mono />
                  {shown!.ipv6_address && (
                    <Field label="IPv6 address" value={shown!.ipv6_address} mono />
                  )}
                  <Field label="ISP" value={shown!.isp} />
                  <Field label="Network" value={shown!.network_org} />
                  <Field label="AS number" value={shown!.as_number} mono />
                  <Field label="AS organization" value={shown!.as_organization} />
                  <Field label="Connection type" value={shown!.connection_type} />
                </Grid>
              ) : (
                <p className="text-sm text-muted-foreground">No network data captured.</p>
              )}
            </SectionCard>

            {/* ── Location ──────────────────────────────── */}
            <SectionCard icon={MapPin} title="Location">
              {hasLocation ? (
                <Grid>
                  <Field label="City" value={shown!.city} />
                  <Field label="Region" value={shown!.region} />
                  <Field label="Region code" value={shown!.region_code} mono />
                  <Field label="Country" value={shown!.country_name} />
                  <Field label="Country code" value={shown!.country} mono />
                  <Field label="Postal code" value={shown!.postal_code} mono />
                  <Field label="Timezone" value={shown!.timezone} />
                  <Field
                    label="Coordinates"
                    value={
                      shown!.latitude && shown!.longitude
                        ? `${shown!.latitude.toFixed(4)}, ${shown!.longitude.toFixed(4)}`
                        : null
                    }
                    mono
                  />
                </Grid>
              ) : (
                <p className="text-sm text-muted-foreground">No location data captured.</p>
              )}
            </SectionCard>

            {/* ── Device & browser ───────────────────────── */}
            <SectionCard icon={Cpu} title="Device & browser">
              <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                  <DeviceIcon className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground capitalize">
                    {device.label}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    {shown!.user_agent || "—"}
                  </p>
                </div>
              </div>
              <Grid>
                <Field label="Device type" value={shown!.device_type} />
                <Field
                  label="Device model"
                  value={
                    [shown!.device_brand, shown!.device_model].filter(Boolean).join(" ") ||
                    null
                  }
                />
                <Field
                  label="Operating system"
                  value={
                    [shown!.os_name, shown!.os_version].filter(Boolean).join(" ") || null
                  }
                />
                <Field
                  label="Browser"
                  value={
                    [shown!.browser_name, shown!.browser_version].filter(Boolean).join(" ") ||
                    null
                  }
                />
                <Field label="Language" value={shown!.language} mono />
              </Grid>
              {!hasDevice && (
                <p className="mt-4 text-sm text-muted-foreground">
                  No detailed device info captured.
                </p>
              )}
            </SectionCard>

            {/* ── Referral & UTM ─────────────────────────── */}
            {hasReferral && (
              <SectionCard icon={Link2} title="Referral & UTM" className="lg:col-span-2">
                <Grid>
                  <Field label="Referrer" value={shown!.referrer} />
                  <Field label="Referrer host" value={shown!.referrer_host} mono />
                  <Field label="UTM source" value={shown!.utm_source} mono />
                  <Field label="UTM medium" value={shown!.utm_medium} mono />
                  <Field label="UTM campaign" value={shown!.utm_campaign} mono />
                </Grid>
              </SectionCard>
            )}

            {/* ── Customer ───────────────────────────────── */}
            <SectionCard
              icon={User}
              title="Customer"
              className="lg:col-span-2"
              action={
                shown!.phone_number ? (
                  <CopyButton value={shown!.phone_number} />
                ) : undefined
              }
            >
              {shown!.customer_name || shown!.phone_number ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10">
                    <UserCheck className="size-6 text-primary" />
                  </div>
                  <Grid className="flex-1">
                    <Field label="Name" value={shown!.customer_name} />
                    <Field label="Phone number" value={shown!.phone_number} mono />
                  </Grid>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <Users className="size-4 shrink-0" />
                  No customer matched to this scan yet.
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── Token reference strip ───────────────────── */}
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="size-4 shrink-0" />
              <span>
                Token{" "}
                <span className="font-mono font-bold text-foreground">
                  {shown!.scan_token}
                </span>{" "}
                used by a customer to claim this check-in.
              </span>
            </div>
            <CopyButton value={shown!.scan_token} />
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
