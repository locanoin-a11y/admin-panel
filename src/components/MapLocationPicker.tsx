"use client"
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useState, useEffect, useRef } from "react"
import { Search, MapPin, CheckCircle2, Loader2, Navigation, RotateCcw, AlertCircle, Info } from "lucide-react"
import "leaflet/dist/leaflet.css"

interface MapLocationPickerProps {
  latitude?: number | null
  longitude?: number | null
  areaName?: string
  landmarkName?: string
  onLocationSelect: (coords: { lat: number; lng: number; address?: string }) => void
  onClearLocation?: () => void
}

interface GeocodingResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const MANGALURU_DEFAULT = { lat: 12.8708, lng: 74.8458 } // Balmatta center

export function MapLocationPicker({
  latitude,
  longitude,
  areaName,
  landmarkName,
  onLocationSelect,
  onClearLocation,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )

  // Update position handler
  const updatePosition = (lat: number, lng: number, address?: string) => {
    const formatted = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
    setCurrentCoords(formatted)
    if (address) {
      setSelectedAddress(address)
    } else {
      setSelectedAddress(`Near ${areaName || "selected point"} (${formatted.lat}, ${formatted.lng})`)
    }
    onLocationSelect({ ...formatted, address: address || selectedAddress || undefined })
  }

  // Initialize or update Leaflet map on client mount
  useEffect(() => {
    let isMounted = true

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return

      // Dynamically load Leaflet in browser
      const L = (await import("leaflet")).default

      if (!isMounted || !mapContainerRef.current) return

      const initialLat = latitude || MANGALURU_DEFAULT.lat
      const initialLng = longitude || MANGALURU_DEFAULT.lng
      const initialZoom = latitude && longitude ? 16 : 13

      // Custom marker icon
      const customIcon = L.divIcon({
        className: "custom-locano-map-pin",
        html: `
          <div style="
            background: #0066FF;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      // If existing coordinates provided, place marker
      if (latitude && longitude) {
        const marker = L.marker([latitude, longitude], {
          icon: customIcon,
          draggable: true,
        }).addTo(map)

        marker.on("dragend", () => {
          const pos = marker.getLatLng()
          updatePosition(pos.lat, pos.lng)
        })

        markerRef.current = marker
      }

      // Map click handler: place or move marker
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const marker = L.marker([lat, lng], {
            icon: customIcon,
            draggable: true,
          }).addTo(map)

          marker.on("dragend", () => {
            const pos = marker.getLatLng()
            updatePosition(pos.lat, pos.lng)
          })

          markerRef.current = marker
        }
        updatePosition(lat, lng)
      })
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Sync coords if props change externally
  useEffect(() => {
    if (latitude && longitude) {
      setCurrentCoords({ lat: latitude, lng: longitude })
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude])
        mapInstanceRef.current.setView([latitude, longitude], 16)
      }
    }
  }, [latitude, longitude])

  // Address search using Nominatim (Rate-limit safe: triggered explicitly, not on keystroke)
  const handleAddressSearch = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const query = searchQuery.trim() || `${areaName || ""} ${landmarkName || ""}`.trim()
    if (!query) {
      setSearchError("Please enter an address, landmark, or area to search.")
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])

    try {
      // Nominatim search biased to Mangaluru bounding box
      const encodedQuery = encodeURIComponent(`${query}, Mangalore, Karnataka`)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&viewbox=74.75,12.75,75.10,13.15&bounded=0&limit=5`

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "LocanoAdmin/1.0 (contact@locano.in)",
        },
      })

      if (!res.ok) {
        throw new Error(`Geocoding failed with status ${res.status}`)
      }

      const data: GeocodingResult[] = await res.json()
      if (data && data.length > 0) {
        setSearchResults(data)
      } else {
        setSearchError("No locations found for this query in Mangaluru. Try clicking directly on the map.")
      }
    } catch (err: any) {
      console.warn("Geocoding lookup error:", err)
      setSearchError("Address lookup unavailable. You can click anywhere on the map to pin the exact location.")
    } finally {
      setIsSearching(false)
    }
  }

  // Select search candidate
  const handleSelectCandidate = (candidate: GeocodingResult) => {
    const lat = parseFloat(candidate.lat)
    const lng = parseFloat(candidate.lon)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16)

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        import("leaflet").then((L) => {
          const customIcon = L.default.divIcon({
            className: "custom-locano-map-pin",
            html: `
              <div style="
                background: #0066FF;
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.35);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 10px;
                  height: 10px;
                  background: white;
                  border-radius: 50%;
                  transform: rotate(45deg);
                "></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          })

          const marker = L.default
            .marker([lat, lng], { icon: customIcon, draggable: true })
            .addTo(mapInstanceRef.current)

          marker.on("dragend", () => {
            const pos = marker.getLatLng()
            updatePosition(pos.lat, pos.lng)
          })

          markerRef.current = marker
        })
      }
    }

    updatePosition(lat, lng, candidate.display_name)
    setSearchResults([])
  }

  // Clear pin
  const handleClear = () => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current)
      markerRef.current = null
    }
    setCurrentCoords(null)
    setSelectedAddress(null)
    if (onClearLocation) onClearLocation()
  }

  return (
    <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0066FF] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Interactive Location Picker</span>
              <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">
                Leaflet + OpenStreetMap
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Click anywhere or drag the marker to pin the exact PG entrance.
            </p>
          </div>
        </div>

        {currentCoords && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Pin</span>
          </button>
        )}
      </div>

      {/* Address Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  e.stopPropagation()
                  void handleAddressSearch(e)
                }
              }}
              placeholder={areaName ? `Search address near ${areaName}...` : "Search address or landmark in Mangalore..."}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#0066FF]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void handleAddressSearch(e)
            }}
            disabled={isSearching}
            className="px-3.5 py-2 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            <span>{isSearching ? "Searching..." : "Find Location"}</span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectCandidate(item)}
                className="w-full text-left px-3 py-2 hover:bg-slate-700 text-xs text-slate-200 border-b border-slate-700/50 last:border-0 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-[#0066FF] shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <div className="mt-1.5 text-[11px] text-amber-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Interactive Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
        <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-10" />

        {/* Overlay instruction banner if no pin placed */}
        {!currentCoords && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 text-center text-xs text-slate-300">
              📍 Click on the map to place a location pin for this PG
            </div>
          </div>
        )}
      </div>

      {/* Confirmed Coordinates Card */}
      {currentCoords ? (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span>Location Confirmed</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {selectedAddress || `Near ${areaName || "selected area"}`}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400/80 self-end sm:self-auto font-medium">
            Saved automatically with listing
          </span>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center gap-2 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>No coordinates selected yet. The listing will still be discoverable by area text search.</span>
        </div>
      )}
    </div>
  )
}

