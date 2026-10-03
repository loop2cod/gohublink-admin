"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Layers,
  LoaderCircle,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { DashboardShell } from "@/components/dashboard-shell"
import CityMap from "@/components/cities/city-map"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ALL_REGIONAL_CITIES,
  CityOption,
  IndianRegion,
  REGIONAL_CITIES,
} from "@/lib/india-cities"
import {
  generateAutoPartitions,
  getBengaluruCuratedPartitions,
} from "@/lib/partition-engine"
import { CreateCityInput, CreateDivisionInput, post } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function NewCityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Selected Region & City
  const [selectedRegion, setSelectedRegion] =
    React.useState<IndianRegion>("South India")
  const [selectedCity, setSelectedCity] = React.useState<CityOption>(
    REGIONAL_CITIES["South India"][0] // Default Bengaluru
  )

  // Auto-partition state
  const [partitionCount, setPartitionCount] = React.useState<number>(8)
  const [divisions, setDivisions] = React.useState<CreateDivisionInput[]>([])
  const [cityBoundary, setCityBoundary] = React.useState<[number, number][]>([])
  const [selectedDivisionId, setSelectedDivisionId] = React.useState<
    string | null
  >(null)

  // Dialog State for Editing Division
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingDivision, setEditingDivision] =
    React.useState<CreateDivisionInput | null>(null)
  const [editNameInput, setEditNameInput] = React.useState("")
  const [editCodeInput, setEditCodeInput] = React.useState("")

  // Initial partition load on mount or when city changes
  const runAutoPartition = React.useCallback(
    (city: CityOption, count?: number) => {
      const result =
        city.id === "bengaluru" && (!count || count === 8)
          ? getBengaluruCuratedPartitions()
          : generateAutoPartitions(city, count)

      setDivisions(result.divisions)
      setCityBoundary(result.cityBoundary)
      setPartitionCount(result.divisions.length)
      setSelectedDivisionId(result.divisions[0]?.id ?? null)
    },
    []
  )

  React.useEffect(() => {
    runAutoPartition(selectedCity, partitionCount)
  }, [selectedCity])

  function handleRegionChange(reg: IndianRegion) {
    setSelectedRegion(reg)
    const firstCity = REGIONAL_CITIES[reg][0]
    if (firstCity) {
      setSelectedCity(firstCity)
      const count = firstCity.id === "bengaluru" ? 8 : 6
      setPartitionCount(count)
      runAutoPartition(firstCity, count)
    }
  }

  function handleCityChange(cityId: string) {
    const found = ALL_REGIONAL_CITIES.find((c) => c.id === cityId)
    if (found) {
      setSelectedCity(found)
      setSelectedRegion(found.region)
      const count = found.id === "bengaluru" ? 8 : 6
      setPartitionCount(count)
      runAutoPartition(found, count)
    }
  }

  function openEditDialog(div: CreateDivisionInput) {
    setEditingDivision(div)
    setEditNameInput(div.name)
    setEditCodeInput(div.code || "")
    setEditDialogOpen(true)
  }

  function saveEditDialog() {
    if (!editingDivision || !editNameInput.trim()) return
    setDivisions((prev) =>
      prev.map((d) =>
        d.id === editingDivision.id
          ? {
              ...d,
              name: editNameInput.trim(),
              code: editCodeInput.trim() || d.code,
            }
          : d
      )
    )
    setEditDialogOpen(false)
    setEditingDivision(null)
    toast.success("Division details updated")
  }

  function handleRemoveDivision(divId: string) {
    if (divisions.length <= 2) {
      toast.error("City must have at least 2 divisions")
      return
    }
    setDivisions((prev) => prev.filter((d) => d.id !== divId))
    if (selectedDivisionId === divId) {
      setSelectedDivisionId(null)
    }
  }

  async function handleSaveCity() {
    if (divisions.length === 0) {
      toast.error("Please auto-partition divisions before saving")
      return
    }

    const payload: CreateCityInput = {
      id: selectedCity.id,
      name: selectedCity.name,
      region: selectedCity.region,
      state: selectedCity.state,
      country: "India",
      latitude: selectedCity.lat,
      longitude: selectedCity.lng,
      boundary_geojson: JSON.stringify(cityBoundary),
      is_active: true,
      divisions: divisions.map((d, index) => ({
        ...d,
        sort_order: index + 1,
      })),
    }

    setIsSubmitting(true)
    try {
      await post("/cities", payload)
      toast.success(
        `${selectedCity.name} and ${divisions.length} divisions saved`
      )
      router.push("/cities")
      router.refresh()
    } catch (err) {
      setIsSubmitting(false)
      const msg = err instanceof Error ? err.message : "Failed to save city"
      toast.error(msg)
    }
  }

  return (
    <DashboardShell
      title="Create City & Auto-Partition"
      subtitle="Select a regional Indian city and partition it into geographic operations zones"
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCity}
            disabled={isSubmitting || divisions.length === 0}
            className="min-w-36"
          >
            {isSubmitting && (
              <LoaderCircle className="size-4 animate-spin mr-2" />
            )}
            {isSubmitting ? "Saving..." : "Save City & Divisions"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Controls Bar using shadcn Select */}
        <Card className="border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Region Selector using shadcn Select */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  1. Indian Region
                </Label>
                <Select
                  value={selectedRegion}
                  onValueChange={(val) => {
                    if (val) handleRegionChange(val as IndianRegion)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(REGIONAL_CITIES).map((reg) => (
                      <SelectItem key={reg} value={reg}>
                        {reg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Selector using shadcn Select */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  2. Select City
                </Label>
                <Select
                  value={selectedCity.id}
                  onValueChange={(val) => {
                    if (val) handleCityChange(val as string)
                  }}
                >
                  <SelectTrigger className="w-full font-semibold">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONAL_CITIES[selectedRegion].map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.state})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Division Count Slider / Stepper */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  3. Division Count:{" "}
                  <span className="text-foreground font-bold">
                    {partitionCount}
                  </span>
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={3}
                    max={12}
                    value={partitionCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setPartitionCount(val)
                      runAutoPartition(selectedCity, val)
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                  />
                  <span className="font-mono text-xs font-semibold text-muted-foreground w-6 text-center">
                    {partitionCount}
                  </span>
                </div>
              </div>

              {/* Auto Partition Button */}
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => runAutoPartition(selectedCity, partitionCount)}
                  className="w-full h-9 flex items-center justify-center gap-2 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <RefreshCw className="size-3.5" />
                  Auto-Partition Divisions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Split View: Map & Divisions List */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Map Canvas (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedCity.name} Geographic Boundaries
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedCity.lat.toFixed(4)}, {selectedCity.lng.toFixed(4)}
              </span>
            </div>

            <CityMap
              center={[selectedCity.lat, selectedCity.lng]}
              zoom={selectedCity.zoom || 11}
              cityBoundary={cityBoundary}
              divisions={divisions}
              selectedDivisionId={selectedDivisionId}
              onSelectDivision={(div) => setSelectedDivisionId(div.id || null)}
              height="580px"
            />
          </div>

          {/* Divisions List / Management Panel (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Partitioned Divisions ({divisions.length})
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Click to inspect / edit
              </span>
            </div>

            <Card className="border-border">
              <CardContent className="p-2 sm:p-3 max-h-[580px] overflow-y-auto divide-y divide-border">
                {divisions.map((div, idx) => {
                  const isSelected = selectedDivisionId === div.id

                  return (
                    <div
                      key={div.id || idx}
                      onClick={() => setSelectedDivisionId(div.id || null)}
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
                            handleRemoveDivision(div.id!)
                          }}
                          className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove division"
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
              <Label htmlFor="div-name">Division Name</Label>
              <Input
                id="div-name"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                placeholder="e.g. Central"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="div-code">Division Code</Label>
              <Input
                id="div-code"
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
            <Button onClick={saveEditDialog}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
