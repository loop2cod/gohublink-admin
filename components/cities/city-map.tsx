"use client"

import * as React from "react"
import { CreateDivisionInput } from "@/lib/api"

// Distinct pastel zone colors matching the reference image
const ZONE_COLORS: Record<string, { fill: string; stroke: string; badge: string }> = {
  "1":  { fill: "rgba(37, 99, 235, 0.5)",  stroke: "#6B7280", badge: "#6B7280" },  // West - Green
  "2":  { fill: "rgba(37, 99, 235, 0.5)",  stroke: "#6B7280", badge: "#6B7280" },  // Central - Orange
  "3":  { fill: "rgba(37, 99, 235, 0.5)",  stroke: "#6B7280", badge: "#6B7280" },  // Indiranagar - Yellow
  "4":  { fill: "rgba(37, 99, 235, 0.5)", stroke: "#6B7280", badge: "#6B7280" },  // Koramangala - Purple
  "5":  { fill: "rgba(37, 99, 235, 0.5)",  stroke: "#6B7280", badge: "#6B7280" },  // Jayanagar - Pink
  "6":  { fill: "rgba(37, 99, 235, 0.5)", stroke: "#6B7280", badge: "#6B7280" },  // ORR Bellandur - Blue
  "7":  { fill: "rgba(37, 99, 235, 0.5)",   stroke: "#6B7280", badge: "#6B7280" },  // Whitefield - Teal
  "8":  { fill: "rgba(37, 99, 235, 0.5)",  stroke: "#6B7280", badge: "#6B7280" },  // South Outer - Cyan
  "9":  { fill: "rgba(37, 99, 235, 0.5)", stroke: "#6B7280", badge: "#6B7280" },  // North Airport - Lavender
  "10": { fill: "rgba(37, 99, 235, 0.5)", stroke: "#6B7280", badge: "#6B7280" },
  "11": { fill: "rgba(37, 99, 235, 0.5)", stroke: "#6B7280", badge: "#6B7280" },
  "12": { fill: "rgba(37, 99, 235, 0.5)", stroke: "#6B7280", badge: "#6B7280" },
}

function getZoneColor(idx: number) {
  const key = String(idx + 1)
  return ZONE_COLORS[key] || { fill: "rgba(158,158,158,0.3)", stroke: "#2563EB", badge: "#2563EB" }
}

export interface CityMapProps {
  center: [number, number]
  zoom?: number
  cityBoundary?: [number, number][]
  divisions: CreateDivisionInput[]
  selectedDivisionId?: string | null
  onSelectDivision?: (division: CreateDivisionInput) => void
  height?: string
}

export default function CityMap({
  center,
  zoom = 11,
  cityBoundary,
  divisions,
  selectedDivisionId,
  onSelectDivision,
  height = "580px",
}: CityMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<any>(null)
  const layersRef = React.useRef<any[]>([])

  // Initialize Leaflet Map with Google Maps tiles
  React.useEffect(() => {
    if (!mapContainerRef.current) return
    let isMounted = true

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
      })
      mapInstanceRef.current = map

      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Google Maps road tiles
      L.tileLayer(
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        { maxZoom: 20 }
      ).addTo(map)

      renderLayers(L, map)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center[0], center[1], zoom])

  // Re-render when divisions or selection changes
  React.useEffect(() => {
    if (!mapInstanceRef.current) return
    import("leaflet").then((L) => {
      if (!mapInstanceRef.current) return
      renderLayers(L, mapInstanceRef.current)
    })
  }, [divisions, cityBoundary, selectedDivisionId])

  function renderLayers(L: any, map: any) {
    layersRef.current.forEach((layer) => map.removeLayer(layer))
    layersRef.current = []

    const allBounds: [number, number][] = []

    // 1. Outer city boundary (subtle dashed outline)
    if (cityBoundary && cityBoundary.length > 0) {
      const bLayer = L.polygon(cityBoundary, {
        color: "#78909c",
        weight: 2,
        opacity: 0.5,
        fillColor: "transparent",
        fillOpacity: 0,
        dashArray: "6, 4",
      }).addTo(map)
      layersRef.current.push(bLayer)
      allBounds.push(...cityBoundary)
    }

    // 2. Division polygons with unique colors + numbered badges + name labels
    divisions.forEach((div, idx) => {
      try {
        const coords: [number, number][] = JSON.parse(div.polygon_geojson)
        if (!Array.isArray(coords) || coords.length === 0) return
        allBounds.push(...coords)

        const isSelected = selectedDivisionId === div.id
        const color = getZoneColor(idx)

        const poly = L.polygon(coords, {
          color: isSelected ? "#1a237e" : color.stroke,
          weight: isSelected ? 3.5 : 2,
          opacity: 0.9,
          fillColor: color.fill.replace(/[\d.]+\)$/, isSelected ? "0.5)" : "0.35)"),
          fillOpacity: isSelected ? 0.5 : 0.35,
        }).addTo(map)

        poly.on("click", () => {
          if (onSelectDivision) onSelectDivision(div)
        })
        poly.on("mouseover", () => {
          if (!isSelected) poly.setStyle({ fillOpacity: 0.5, weight: 3 })
        })
        poly.on("mouseout", () => {
          if (!isSelected) poly.setStyle({ fillOpacity: 0.35, weight: 2 })
        })
        layersRef.current.push(poly)

        // Numbered badge + division name label (matching the reference image)
        const num = idx + 1
        const markerHtml = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            user-select: none;
            pointer-events: auto;
          ">
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 9999px;
              background: ${color.badge};
              color: #ffffff;
              font-size: 13px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 2.5px solid #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">${num}</div>
            <div style="
              margin-top: 3px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              font-weight: 700;
              color: #1a202c;
              text-align: center;
              white-space: nowrap;
              text-shadow: 0 0 4px #ffffff, 0 0 4px #ffffff, 0 0 4px #ffffff;
              letter-spacing: -0.01em;
            ">${div.name}</div>
          </div>
        `

        const icon = L.divIcon({
          html: markerHtml,
          className: "zone-label-marker",
          iconSize: [140, 55],
          iconAnchor: [70, 14],
        })

        const marker = L.marker([div.center_lat, div.center_lng], { icon }).addTo(map)
        marker.on("click", () => { if (onSelectDivision) onSelectDivision(div) })
        layersRef.current.push(marker)

      } catch {
        // skip invalid polygon
      }
    })

    // Fit bounds
    if (allBounds.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(allBounds), { padding: [30, 30], maxZoom: 12 })
      } catch { /* keep defaults */ }
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
        className="z-0 size-full"
      />

      {/* Legend overlay */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur">
          <span className="size-2.5 rounded-full bg-primary"></span>
          <span>{divisions.length} Zones</span>
        </div>
      </div>
    </div>
  )
}
