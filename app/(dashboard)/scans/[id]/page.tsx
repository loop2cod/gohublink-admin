"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Clock,
  MapPin,
  Monitor,
  QrCode,
  Smartphone,
  User,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { get, type Scan } from "@/lib/api"
import { cn } from "@/lib/utils"

const statusStyles: Record<Scan["status"], string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  matched: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expired: "bg-secondary text-muted-foreground",
}

const deviceIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  ios: Smartphone,
  android: Smartphone,
  desktop: Monitor,
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "break-words text-sm text-foreground",
          mono && "font-mono text-xs tracking-wide"
        )}
      >
        {value || "—"}
      </p>
    </div>
  )
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

function relativeTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return "Expired"
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `Expires in ${mins} min`
  const hours = Math.round(mins / 60)
  return `Expires in ${hours} hr`
}

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [scan, setScan] = React.useState<Scan | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    get<Scan>(`/scans/${id}`)
      .then(setScan)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
  }, [id])

  const DeviceIcon = deviceIcon[scan?.device_type ?? ""] ?? Monitor

  return (
    <DashboardShell
      title="Scan detail"
      subtitle={scan ? `Check-in #${scan.id}` : "Loading…"}
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
      ) : scan === null ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header card */}
          <Card className="border-border">
            <CardContent className="p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-xl bg-primary/10">
                    <QrCode className="size-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black tracking-widest text-foreground">
                        {scan.scan_token}
                      </span>
                      <span
                        className={cn(
                          "rounded-sm px-2 py-1 text-[10px] font-bold",
                          statusStyles[scan.status]
                        )}
                      >
                        {scan.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Scanned at spot{" "}
                      <span className="font-bold text-foreground">
                        {scan.spot_id}
                      </span>
                    </p>
                  </div>
                </div>

                {scan.status === "pending" && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Clock className="size-4" />
                    {relativeTime(scan.expires_at)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Scan metadata */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-2">
                  <QrCode className="size-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    Scan metadata
                  </h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Token" value={scan.scan_token} mono />
                  <Field label="Spot ID" value={scan.spot_id} />
                  <Field label="Scanned at" value={formatDateTime(scan.scanned_at)} />
                  <Field label="Expires at" value={formatDateTime(scan.expires_at)} />
                  <Field label="IP address" value={scan.ip_address} mono />
                  <Field label="City" value={scan.city} />
                  <Field label="Device" value={scan.device_type} />
                </div>
              </CardContent>
            </Card>

            {/* Device info */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-2">
                  <DeviceIcon className="size-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    Device
                  </h2>
                </div>
                <div className="grid gap-5">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <DeviceIcon className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground capitalize">
                        {scan.device_type || "Unknown"}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-muted-foreground">
                        {scan.ip_address || "—"}
                      </p>
                    </div>
                  </div>
                  <Field label="User agent" value={scan.user_agent} mono />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer info */}
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-2">
                <User className="size-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  Customer
                </h2>
              </div>
              {scan.customer_name || scan.phone_number ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Name" value={scan.customer_name ?? ""} />
                  <Field label="Phone" value={scan.phone_number ?? ""} mono />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  No customer matched to this scan yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}
