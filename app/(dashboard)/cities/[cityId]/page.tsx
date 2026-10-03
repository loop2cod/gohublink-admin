"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Layers,
  LoaderCircle,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { DashboardShell } from "@/components/dashboard-shell"
import CityMap from "@/components/cities/city-map"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { City, CreateDivisionInput, Division, del, get, put } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function CityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cityId = params?.cityId as string

  const [city, setCity] = React.useState<City | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedDivisionId, setSelectedDivisionId] = React.useState<
    string | null
  >(null)

  // Edit Division Dialog State
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingDivision, setEditingDivision] = React.useState<Division | null>(
    null
  )
  const [editNameInput, setEditNameInput] = React.useState("")
  const [editCodeInput, setEditCodeInput] = React.useState("")
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Delete Division Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [divisionToDelete, setDivisionToDelete] =
    React.useState<Division | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const loadCity = React.useCallback(async () => {
    if (!cityId) return
    setLoading(true)
    try {
      const data = await get<City>(`/cities/${cityId}`)
      setCity(data)
      if (data.divisions && data.divisions.length > 0) {
        setSelectedDivisionId(data.divisions[0].id)
      }
    } catch (err) {
      toast.error(
        "Failed to load city: " + (err instanceof Error ? err.message : "")
      )
    } finally {
      setLoading(false)
    }
  }, [cityId])

  React.useEffect(() => {
    loadCity()
  }, [loadCity])

  function openEditDialog(div: Division) {
    setEditingDivision(div)
    setEditNameInput(div.name)
    setEditCodeInput(div.code || "")
    setEditDialogOpen(true)
  }

  async function handleSaveDivisionEdit() {
    if (!editingDivision || !editNameInput.trim()) return
    setIsUpdating(true)
    try {
      await put(`/cities/divisions/${editingDivision.id}`, {
        name: editNameInput.trim(),
        code: editCodeInput.trim() || editingDivision.code,
      })
      toast.success("Division updated")
      setEditDialogOpen(false)
      setEditingDivision(null)
      loadCity()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update division"
      )
    } finally {
      setIsUpdating(false)
    }
  }

  function confirmDeleteDivision(div: Division) {
    setDivisionToDelete(div)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteDivision() {
    if (!divisionToDelete) return
    setIsDeleting(true)
    try {
      await del(`/cities/divisions/${divisionToDelete.id}`)
      toast.success("Division deleted")
      setDeleteDialogOpen(false)
      setDivisionToDelete(null)
      loadCity()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete division"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleToggleCityActive() {
    if (!city) return
    try {
      await put(`/cities/${city.id}`, {
        is_active: !city.is_active,
      })
      toast.success(`City marked ${!city.is_active ? "active" : "inactive"}`)
      loadCity()
    } catch (err) {
      toast.error("Failed to update status")
    }
  }

  if (loading) {
    return (
      <DashboardShell
        title="Loading city..."
        subtitle="Fetching operations divisions"
      >
        <div className="flex h-64 items-center justify-center">
          <LoaderCircle className="size-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  if (!city) {
    return (
      <DashboardShell title="City not found">
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Could not find the requested city.
            </p>
            <Link href="/cities" className={buttonVariants()}>
              Back to Cities
            </Link>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  // Parse city boundary
  let boundary: [number, number][] = []
  if (city.boundary_geojson) {
    try {
      boundary = JSON.parse(city.boundary_geojson)
    } catch {
      boundary = []
    }
  }

  const mapDivisions: CreateDivisionInput[] = (city.divisions || []).map(
    (d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      center_lat: d.center_lat,
      center_lng: d.center_lng,
      polygon_geojson: d.polygon_geojson,
      color: d.color,
      is_active: d.is_active,
      sort_order: d.sort_order,
    })
  )

  return (
    <DashboardShell
      title={`${city.name} Divisions`}
      subtitle={`${city.region} · ${city.state ? city.state + ", " : ""}${city.country}`}
      action={
        <div className="flex items-center gap-2">
          <Link href="/cities" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft className="size-4" /> All Cities
          </Link>
          <Button
            variant={city.is_active ? "outline" : "default"}
            size="sm"
            onClick={handleToggleCityActive}
          >
            {city.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Summary Bar */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {city.region}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <MapIcon className="size-4" />
              </span>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Divisions</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {city.divisions?.length || 0} Operational Zones
                </p>
              </div>
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <Layers className="size-4" />
              </span>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Center Coordinates</p>
                <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                  {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <MapPin className="size-4" />
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Map and Divisions Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Map Canvas */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapIcon className="size-4 text-primary" />
                Geographic Partition Map
              </h3>
              <span className="text-xs text-muted-foreground">
                Hover or click division to inspect
              </span>
            </div>

            <CityMap
              center={[city.latitude, city.longitude]}
              cityBoundary={boundary}
              divisions={mapDivisions}
              selectedDivisionId={selectedDivisionId}
              onSelectDivision={(div) => setSelectedDivisionId(div.id || null)}
              height="580px"
            />
          </div>

          {/* Divisions Table & Management */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                Divisions ({city.divisions?.length || 0})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Click to edit in dialog
              </span>
            </div>

            <Card className="border-border">
              <CardContent className="p-2 sm:p-3 max-h-[580px] overflow-y-auto divide-y divide-border">
                {city.divisions?.map((div, idx) => {
                  const isSelected = selectedDivisionId === div.id

                  return (
                    <div
                      key={div.id}
                      onClick={() => setSelectedDivisionId(div.id)}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {div.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {div.code} · {div.center_lat.toFixed(3)},{" "}
                              {div.center_lng.toFixed(3)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(div)
                          }}
                          className="size-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit division in dialog"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            confirmDeleteDivision(div)
                          }}
                          className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete division"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Division shadcn Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Division</DialogTitle>
            <DialogDescription>
              Update operational division name and identifier code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-div-name">Division Name</Label>
              <Input
                id="edit-div-name"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                placeholder="e.g. Central"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-div-code">Division Code</Label>
              <Input
                id="edit-div-code"
                value={editCodeInput}
                onChange={(e) => setEditCodeInput(e.target.value)}
                placeholder="e.g. BLR-CEN"
                className="font-mono uppercase"
              />
            </div>

            {editingDivision && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground block mb-1">
                  Center Coordinates
                </span>
                <span className="font-mono">
                  Latitude: {editingDivision.center_lat.toFixed(5)}, Longitude:{" "}
                  {editingDivision.center_lng.toFixed(5)}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button disabled={isUpdating} onClick={handleSaveDivisionEdit}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Division shadcn Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="size-5" />
              <DialogTitle>Delete Division</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {divisionToDelete?.name}
              </strong>
              ? This division boundary will be removed from this city.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteDivision}
            >
              {isDeleting ? "Deleting..." : "Delete Division"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
