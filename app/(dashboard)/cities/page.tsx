"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Layers,
  Map,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { City, del, get } from "@/lib/api"
import { cn } from "@/lib/utils"

type RegionFilter =
  | "all"
  | "South India"
  | "North India"
  | "West India"
  | "East India"
  | "Central India"

const regions: { value: RegionFilter; label: string }[] = [
  { value: "all", label: "All Regions" },
  { value: "South India", label: "South India" },
  { value: "North India", label: "North India" },
  { value: "West India", label: "West India" },
  { value: "East India", label: "East India" },
  { value: "Central India", label: "Central India" },
]

export default function CitiesPage() {
  const [cities, setCities] = React.useState<City[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [regionFilter, setRegionFilter] = React.useState<RegionFilter>("all")

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [cityToDelete, setCityToDelete] = React.useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const loadCities = React.useCallback(() => {
    setLoading(true)
    get<{ cities: City[] }>("/cities")
      .then((res) => setCities(res.cities || []))
      .catch((err) => {
        toast.error(
          "Failed to load cities: " +
            (err instanceof Error ? err.message : "")
        )
        setCities([])
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    loadCities()
  }, [loadCities])

  function confirmDeleteCity(id: string, name: string) {
    setCityToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  async function handleDeleteCity() {
    if (!cityToDelete) return
    setIsDeleting(true)
    try {
      await del(`/cities/${cityToDelete.id}`)
      toast.success(`${cityToDelete.name} deleted`)
      setDeleteDialogOpen(false)
      setCityToDelete(null)
      loadCities()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete city"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = React.useMemo(() => {
    if (!cities) return []
    const q = search.trim().toLowerCase()
    return cities.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.state && c.state.toLowerCase().includes(q)) ||
        (c.region && c.region.toLowerCase().includes(q))
      const matchesRegion =
        regionFilter === "all" || c.region === regionFilter
      return matchesSearch && matchesRegion
    })
  }, [cities, search, regionFilter])

  return (
    <DashboardShell
      title="Cities & Divisions"
      subtitle="Manage regional operations and geographic divisions for spots & analytics"
      action={
        <Link href="/cities/new" className={buttonVariants()}>
          <Plus className="size-4" /> Add City & Divisions
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city or state..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {regions.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRegionFilter(r.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                  regionFilter === r.value
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cities List / Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
                <Map className="size-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                No cities found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {search || regionFilter !== "all"
                  ? "Try changing your search query or region filter."
                  : "Get started by adding a city and auto-partitioning it into divisions."}
              </p>
              <div className="mt-6">
                <Link href="/cities/new" className={buttonVariants()}>
                  <Plus className="size-4" /> Create First City
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((city) => (
              <Card
                key={city.id}
                className="group relative border-border transition-all hover:border-primary/50 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                          {city.name}
                        </h3>
                        {city.is_active && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {city.state ? `${city.state}, ` : ""}
                        {city.country || "India"}
                      </p>
                    </div>

                    <span className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {city.region}
                    </span>
                  </div>

                  <div className="my-4 grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/25 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Divisions
                      </span>
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                        <Layers className="size-3.5 text-primary" />
                        {city.division_count || 0} Zones
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Coordinates
                      </span>
                      <span className="font-mono text-muted-foreground block truncate mt-0.5">
                        {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    <Link
                      href={`/cities/${city.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "flex-1 text-xs justify-between"
                      )}
                    >
                      <span>View Divisions</span>
                      <ChevronRight className="size-3.5" />
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDeleteCity(city.id, city.name)}
                      className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete city"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="size-5" />
              <DialogTitle>Delete City</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{cityToDelete?.name}</strong>?
              This will permanently delete the city and all its associated
              geographic divisions.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteCity}
            >
              {isDeleting ? "Deleting..." : "Delete City"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
