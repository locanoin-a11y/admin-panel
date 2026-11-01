"use client"

import React, { useState } from "react"
import {
  UtensilsCrossed,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  MapPin,
  Camera,
  Loader2,
  Calendar,
  Utensils,
} from "lucide-react"
import { uploadListingImage, validateImageFile } from "@/lib/supabase/storage"

export interface MessItem {
  id: string
  name: string
  area: string
  approximate_location?: string
  cuisine: string
  dietary: "Pure Veg" | "Veg & Non-Veg"
  service_type: "Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery"
  pricing_type?: "meals_per_day" | "meal_combinations"
  meals_per_day_pricing?: Record<string, unknown>
  meal_combinations_pricing?: Record<string, unknown>
  weekly_holidays?: string[]
  timings?: {
    breakfast?: string
    lunch?: string
    dinner?: string
  }
  monthly_price_from: number
  per_meal_price_from?: number
  meals_served: string[]
  status: "published" | "pending" | "rejected" | "archived"
  sample_image?: string | null
  images?: string[]
  nearest_landmark?: string
  description?: string
  latitude?: number | null
  longitude?: number | null
}

interface MessesViewProps {
  messes: MessItem[]
  onUpdateStatus: (id: string, status: "published" | "pending" | "rejected") => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (item: MessItem) => void
  onAddNew: () => void
  onNavigateBulk: () => void
  onReplaceImage?: (id: string, imageUrl: string) => Promise<void>
  isLoading: boolean
}

export function MessesView({
  messes,
  onUpdateStatus,
  onDelete,
  onEdit,
  onAddNew,
  onNavigateBulk,
  onReplaceImage,
}: MessesViewProps) {
  const [search, setSearch] = useState("")
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dietaryFilter, setDietaryFilter] = useState<string>("all")
  const [pricingTypeFilter, setPricingTypeFilter] = useState<string>("all")

  const filtered = messes.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false
    if (dietaryFilter !== "all" && item.dietary !== dietaryFilter) return false
    if (pricingTypeFilter !== "all") {
      const type = item.pricing_type || "meals_per_day"
      if (type !== pricingTypeFilter) return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.area.toLowerCase().includes(q) ||
      item.cuisine.toLowerCase().includes(q) ||
      (item.nearest_landmark && item.nearest_landmark.toLowerCase().includes(q))
    )
  })

  const handleQuickUpload = async (id: string, file: File) => {
    const val = validateImageFile(file)
    if (!val.valid) {
      alert(val.error || "Invalid file format or size.")
      return
    }
    setUploadingId(id)
    try {
      const { publicUrl } = await uploadListingImage(file, "messes", id)
      if (onReplaceImage) {
        await onReplaceImage(id, publicUrl)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed."
      alert("Image update error: " + msg)
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <UtensilsCrossed className="h-5 w-5 text-teal-400" />
            <span>Messes &amp; Student Tiffin Services</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage food vendors, meal plans, pricing structures (Per Day &amp; Combinations), and service hours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateBulk}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-600/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Mess</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by mess name, area, cuisine, landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Pricing Model select */}
          <select
            value={pricingTypeFilter}
            onChange={(e) => setPricingTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Pricing Models</option>
            <option value="meals_per_day">Meals Per Day (Model A)</option>
            <option value="meal_combinations">Meal Combinations (Model B)</option>
          </select>

          {/* Dietary select */}
          <select
            value={dietaryFilter}
            onChange={(e) => setDietaryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Dietary</option>
            <option value="Pure Veg">Pure Veg Only</option>
            <option value="Veg & Non-Veg">Veg &amp; Non-Veg</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <UtensilsCrossed className="h-10 w-10 text-slate-500 mx-auto" />
          <p className="text-base font-semibold text-slate-300 mt-3">No messes found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? "No messes matched your filter." : "Start by adding a mess listing or importing via CSV."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Mess Name &amp; Cuisine</th>
                <th className="py-3 px-4">Area &amp; Schedule</th>
                <th className="py-3 px-4">Pricing Model &amp; Pass</th>
                <th className="py-3 px-4">Dietary &amp; Service</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filtered.map((item) => {
                const isCombinations = item.pricing_type === "meal_combinations"
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Name & Photo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/60 shrink-0 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.sample_image || (item.images && item.images[0]) || "/mess-tiffin.jpg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement
                              target.src = "/mess-tiffin.jpg"
                            }}
                          />
                          {uploadingId === item.id ? (
                            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                            </div>
                          ) : onReplaceImage ? (
                            <label
                              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                              title="Click to replace image (.jpg, .jpeg, .png)"
                            >
                              <Camera className="w-4 h-4 text-slate-200 hover:text-teal-400" />
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) void handleQuickUpload(item.id, file)
                                }}
                              />
                            </label>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-100 block truncate">{item.name}</span>
                          <span className="text-[11px] text-teal-400 block mt-0.5 truncate">{item.cuisine}</span>
                        </div>
                      </div>
                    </td>

                    {/* Area & Schedule */}
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        <span className="font-medium text-slate-200">{item.area}</span>
                      </div>
                      {item.nearest_landmark && (
                        <span className="text-[11px] text-slate-400 block ml-5 truncate max-w-[180px]">
                          {item.nearest_landmark}
                        </span>
                      )}
                      <div className="mt-1 flex items-center gap-1.5 ml-5">
                        {item.weekly_holidays && item.weekly_holidays.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>Off: {item.weekly_holidays.join(", ")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>All 7 Days</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pricing Model & Pass */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-slate-100">
                            ₹{item.monthly_price_from ? item.monthly_price_from.toLocaleString("en-IN") : "0"}
                          </span>
                          <span className="text-slate-400 text-xs">/mo</span>
                        </div>

                        <div>
                          {isCombinations ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              <UtensilsCrossed className="w-2.5 h-2.5" />
                              Combinations
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              <Utensils className="w-2.5 h-2.5" />
                              Meals Per Day
                            </span>
                          )}
                        </div>

                        {item.per_meal_price_from ? (
                          <span className="text-[11px] text-slate-400 block">
                            Walk-in: ₹{item.per_meal_price_from}/meal
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Dietary & Service */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            item.dietary === "Pure Veg"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {item.dietary}
                        </span>
                        <span className="text-slate-400 text-[11px]">{item.service_type}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === "published"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : item.status === "pending"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {item.status === "published" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === "pending" && <Clock className="h-3 w-3" />}
                        {item.status === "rejected" && <XCircle className="h-3 w-3" />}
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== "published" ? (
                          <button
                            onClick={() => onUpdateStatus(item.id, "published")}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Publish listing"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus(item.id, "pending")}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Unpublish (move to pending)"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit listing details and pricing"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                              onDelete(item.id)
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
