"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CITIES, DEFAULT_CITY } from "@/lib/india-cities"
import { post } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Location {
  lat: number
  lng: number
}

interface SearchResult {
  name: string
  lat: number
  lng: number
}

function buildEmbedUrl({ lat, lng }: Location) {
  const q = encodeURIComponent(`${lat},${lng}`)
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${q}&zoom=14`
  }
  return `https://www.google.com/maps?q=${q}&z=14&output=embed`
}

function Field({
  label,
  hint,
  required,
  children,
  className,
  span = false,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  span?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", span && "sm:col-span-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

export default function NewSpotPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [location, setLocation] = React.useState<Location>({
    lat: DEFAULT_CITY.lat,
    lng: DEFAULT_CITY.lng,
  })
  const [city, setCity] = React.useState<string>(DEFAULT_CITY.name)

  const [searchInput, setSearchInput] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [searching, setSearching] = React.useState(false)
  const [pickedLabel, setPickedLabel] = React.useState<string | null>(null)

  React.useEffect(() => {
    const q = searchInput.trim()
    if (q.length < 3 || q === pickedLabel) {
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`
        )
        const data = (await res.json()) as Array<{
          display_name: string
          lat: string
          lon: string
        }>
        setResults(
          Array.isArray(data)
            ? data.map((d) => ({
                name: d.display_name,
                lat: parseFloat(d.lat),
                lng: parseFloat(d.lon),
              }))
            : []
        )
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [searchInput, pickedLabel])

  function handleSearchChange(v: string) {
    setSearchInput(v)
    if (v.trim().length < 3) {
      setPickedLabel(null)
      setResults([])
      setSearching(false)
    }
  }

  function applyLocation(next: Location, opts?: { cityName?: string; label?: string }) {
    setLocation(next)
    if (opts?.cityName) {
      setCity(opts.cityName)
    } else {
      setCity("")
    }
    if (opts?.label) {
      setPickedLabel(opts.label)
      setSearchInput(opts.label)
      setResults([])
    }
  }

  function handleCityChange(name: string) {
    const c = CITIES.find((it) => it.name === name)
    if (c) applyLocation({ lat: c.lat, lng: c.lng }, { cityName: c.name })
  }

  function pickResult(r: SearchResult) {
    applyLocation({ lat: r.lat, lng: r.lng }, { label: r.name })
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const latitude = parseFloat(String(form.get("latitude") ?? ""))
    const longitude = parseFloat(String(form.get("longitude") ?? ""))

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      toast.error("Enter valid latitude and longitude")
      return
    }

    const payload = {
      name: String(form.get("name") ?? "").trim(),
      latitude,
      longitude,
      incharge_name: String(form.get("incharge_name") ?? "").trim(),
      incharge_phone: String(form.get("incharge_phone") ?? "").trim(),
      idcard_type: String(form.get("idcard_type") ?? "").trim(),
      idcard_name: String(form.get("idcard_name") ?? "").trim(),
      idcard_dob: String(form.get("idcard_dob") ?? "").trim(),
      idcard_number: String(form.get("idcard_number") ?? "").trim(),
      id: String(form.get("id") ?? "").trim(),
    }

    setIsSubmitting(true)
    try {
      await post("/spots", payload)
      toast.success("Spot created")
      router.push("/spots")
      router.refresh()
    } catch (err) {
      setIsSubmitting(false)
      const message =
        err instanceof Error ? err.message : "Failed to create spot"
      toast.error(message)
    }
  }

  return (
    <DashboardShell
      title="New spot"
      subtitle="Add a space to the network"
      action={
        <a href="/spots" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </a>
      }
    >
      <form onSubmit={onSubmit} className="max-w-3xl">
        <Card className="border-border">
          <CardContent className="p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Spot details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Basic identity and location of the spot.
                </p>
              </div>
            </div>

            <TwoCol>
              <Field label="Name" required className="sm:col-span-2">
                <Input
                  name="name"
                  placeholder="e.g. Downtown Mall"
                  autoFocus
                  required
                />
              </Field>

              <Field
                label="Spot ID"
                hint="Optional — 6 letters. Auto-generated if left blank."
              >
                <Input
                  name="id"
                  placeholder="AUTO"
                  maxLength={6}
                  className="font-mono uppercase"
                />
              </Field>

              <Field
                label="Location"
                hint="Pick a city or search for an exact place — the map pin updates instantly."
                span
              >
                <div className="grid gap-3">
                  {/* City + search */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="h-9 w-full appearance-none rounded-md border border-input bg-transparent px-8 text-sm font-medium text-foreground shadow-xs transition-[color,box-shadow] outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="">Select a city</option>
                        {CITIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>

                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search for a location…"
                        className="pl-9"
                        autoComplete="off"
                      />

                      <div className="absolute top-full right-0 left-0 z-20 mt-1">
                        {searching && (
                          <div className="flex items-center gap-2 rounded-md border border-border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
                            <LoaderCircle className="size-4 animate-spin" />
                            Searching…
                          </div>
                        )}
                        {!searching && results.length > 0 && (
                          <ul className="max-h-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg">
                            {results.map((r) => (
                              <li key={r.name}>
                                <button
                                  type="button"
                                  onClick={() => pickResult(r)}
                                  className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
                                >
                                  <Navigation className="mt-0.5 size-4 shrink-0 text-primary" />
                                  <span className="line-clamp-2">{r.name}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {!searching &&
                          searchInput.trim().length >= 3 &&
                          results.length === 0 &&
                          searchInput.trim() !== (pickedLabel ?? "") && (
                            <div className="rounded-md border border-border bg-background p-3 py-2 text-sm text-muted-foreground">
                              No places found. Try a nearby city name.
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="relative h-60 overflow-hidden rounded-lg border border-border bg-muted/40 sm:h-72">
                    <iframe
                      title="Spot location"
                      src={buildEmbedUrl(location)}
                      className="size-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 font-mono text-[11px] text-foreground backdrop-blur">
                      <MapPin className="size-3.5 text-primary" />
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                  </div>

                  {/* Lat / Lng */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                        Lat
                      </span>
                      <Input
                        name="latitude"
                        type="number"
                        step="any"
                        value={location.lat}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          setLocation((prev) => ({
                            ...prev,
                            lat: Number.isFinite(v) ? v : prev.lat,
                          }))
                        }}
                        required
                        className="pl-10 font-mono"
                      />
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                        Lng
                      </span>
                      <Input
                        name="longitude"
                        type="number"
                        step="any"
                        value={location.lng}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          setLocation((prev) => ({
                            ...prev,
                            lng: Number.isFinite(v) ? v : prev.lng,
                          }))
                        }}
                        required
                        className="pl-10 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </Field>
            </TwoCol>
          </CardContent>
        </Card>

        <Card className="mt-5 border-border">
          <CardContent className="p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground">
                Spot incharge
              </h2>
              <p className="text-sm text-muted-foreground">
                Who looks after this spot.
              </p>
            </div>

            <TwoCol>
              <Field label="Incharge name">
                <Input
                  name="incharge_name"
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="off"
                />
              </Field>
              <Field label="Incharge phone">
                <Input
                  name="incharge_phone"
                  placeholder="+91 00000 00000"
                  inputMode="tel"
                />
              </Field>
            </TwoCol>
          </CardContent>
        </Card>

        <Card className="mt-5 border-border">
          <CardContent className="p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground">
                Verification
              </h2>
              <p className="text-sm text-muted-foreground">
                Optional identity details.
              </p>
            </div>

            <TwoCol>
              <Field label="ID type">
                <Input
                  name="idcard_type"
                  placeholder="e.g. Aadhaar"
                  autoComplete="off"
                />
              </Field>
              <Field label="ID name">
                <Input
                  name="idcard_name"
                  placeholder="Name on the ID"
                  autoComplete="off"
                />
              </Field>
              <Field label="Date of birth">
                <Input
                  name="idcard_dob"
                  type="date"
                  autoComplete="off"
                />
              </Field>
              <Field label="ID number">
                <Input
                  name="idcard_number"
                  placeholder="ID number"
                  autoComplete="off"
                />
              </Field>
            </TwoCol>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-36">
            {isSubmitting && <LoaderCircle className="animate-spin" />}
            {isSubmitting ? "Creating…" : "Create spot"}
          </Button>
        </div>
      </form>
    </DashboardShell>
  )
}