"use client"

import React, { useState } from "react"
import {
  Home,
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
} from "lucide-react"
import { uploadListingImage, validateImageFile } from "@/lib/supabase/storage"

export interface AccommodationItem {
  id: string
  name: string
  area: string
  monthly_rent_from: number
  security_deposit?: number
  gender: "Boys" | "Girls" | "Co-ed"
  type: "PG" | "Hostel" | "Shared Apartment"
  amenities: string[]
  sharing_options: string[]
  food_option?: string
  status: "published" | "pending" | "rejected" | "archived"
  sample_image?: string | null
  images?: string[]
  nearest_landmark?: string
  created_at?: string
  description?: string
  room_features?: string[]
  house_rules?: string[]
  notice_period_days?: number
  approximate_location?: string
  tagline?: string
}

interface AccommodationsViewProps {
  accommodations: AccommodationItem[]
  onUpdateStatus: (id: string, status: "published" | "pending" | "rejected") => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (item: AccommodationItem) => void
  onAddNew: () => void
  onNavigateBulk: () => void
  onReplaceImage?: (id: string, imageUrl: string) => Promise<void>
  isLoading: boolean
}

export function AccommodationsView({
  accommodations,
  onUpdateStatus,
  onDelete,
  onEdit,
  onAddNew,
  onNavigateBulk,
  onReplaceImage,
}: AccommodationsViewProps) {
  const [search, setSearch] = useState("")
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [genderFilter, setGenderFilter] = useState<string>("all")

  const filtered = accommodations.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false
    if (genderFilter !== "all" && item.gender !== genderFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.area.toLowerCase().includes(q) ||
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
      const { publicUrl } = await uploadListingImage(file, "accommodations", id)
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
            <Home className="h-5 w-5 text-indigo-400" />
            Accommodations Management
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {accommodations.length} total
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review, publish, edit, or remove PG and hostel listings across all student zones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateBulk}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-colors"
          >
            Bulk Import CSV
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30"
          >
            <Plus className="h-4 w-4" />
            Add Single Accommodation
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PG name, area, landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published (Live)</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* PG Type select */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All PG Types</option>
            <option value="Boys">Boys PG</option>
            <option value="Girls">Girls PG</option>
          </select>
        </div>
      </div>

      {/* Listings Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Home className="h-10 w-10 text-slate-500 mx-auto" />
          <p className="text-base font-semibold text-slate-300 mt-3">No accommodations found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? "No listings matched your search criteria." : "Start by adding a listing or using the Bulk CSV Import tool."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Area & Landmark</th>
                <th className="py-3 px-4">Rent / Mo</th>
                <th className="py-3 px-4">PG Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filtered.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Name & Photo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/60 shrink-0 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.sample_image || (item.images && item.images[0]) || "/hero-coast.png"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement
                              target.src = "/hero-coast.png"
                            }}
                          />
                          {uploadingId === item.id ? (
                            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            </div>
                          ) : onReplaceImage ? (
                            <label
                              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                              title="Click to replace image (.jpg, .jpeg, .png)"
                            >
                              <Camera className="w-4 h-4 text-slate-200 hover:text-indigo-400" />
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
                          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                            {item.amenities?.slice(0, 3).join(" · ") || "No amenities listed"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Area */}
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span>{item.area}</span>
                      </div>
                      {item.nearest_landmark && (
                        <span className="text-[11px] text-slate-400 block ml-5">{item.nearest_landmark}</span>
                      )}
                    </td>

                    {/* Rent */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-100">₹{item.monthly_rent_from.toLocaleString("en-IN")}</span>
                      <span className="text-slate-400 text-xs"> /mo</span>
                    </td>

                    {/* PG Type */}
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          item.gender === "Girls"
                            ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {item.gender === "Girls" ? "Girls PG" : "Boys PG"}
                      </span>
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
                            className="px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 transition-colors"
                            title="Approve & Publish to student website"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus(item.id, "pending")}
                            className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-colors"
                            title="Unpublish (set to pending)"
                          >
                            Unpublish
                          </button>
                        )}

                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete"
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
