"use client"

import React, { useState, useRef } from "react"
import {
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Image as ImageIcon,
} from "lucide-react"
import { uploadListingImage, validateImageFile } from "@/lib/supabase/storage"

export interface MultiImageUploaderProps {
  images: string[]
  coverImage: string | null
  onChange: (images: string[], coverImage: string | null) => void
  mode: "accommodation" | "mess"
  listingId?: string
  maxPhotos?: number
}

interface UploadingQueueItem {
  id: string
  name: string
  previewUrl: string
}

export function MultiImageUploader({
  images,
  coverImage,
  onChange,
  mode,
  listingId,
  maxPhotos = 10,
}: MultiImageUploaderProps) {
  const [uploadingQueue, setUploadingQueue] = useState<UploadingQueueItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const currentCount = images.length
  const remainingSlots = Math.max(0, maxPhotos - currentCount)

  // Ensure cover photo is valid
  const effectiveCover = coverImage || (images.length > 0 ? images[0] : null)

  const handleFiles = async (fileList: FileList | File[]) => {
    setError(null)
    setSuccessMsg(null)

    const rawFiles = Array.from(fileList)
    if (rawFiles.length === 0) return

    if (currentCount >= maxPhotos) {
      setError(`Maximum limit reached: You can upload up to ${maxPhotos} photos per listing.`)
      return
    }

    // Limit files to remaining slots
    const filesToUpload = rawFiles.slice(0, remainingSlots)
    if (rawFiles.length > remainingSlots) {
      setError(
        `Only ${remainingSlots} more photo${remainingSlots > 1 ? "s" : ""} allowed. First ${remainingSlots} selected.`
      )
    }

    // Validate all files
    for (const file of filesToUpload) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || `Invalid file: ${file.name}`)
        return
      }
    }

    // Build temporary queue items for instant preview
    const queueItems: UploadingQueueItem[] = filesToUpload.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }))

    setUploadingQueue(queueItems)
    setIsUploading(true)

    const folder = mode === "accommodation" ? "accommodations" : "messes"
    const newlyUploadedUrls: string[] = []
    let failedCount = 0

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
        try {
          const { publicUrl } = await uploadListingImage(file, folder, listingId)
          newlyUploadedUrls.push(publicUrl)
        } catch (uploadErr) {
          failedCount++
          console.error("Failed uploading photo:", file.name, uploadErr)
        }
      }

      if (newlyUploadedUrls.length > 0) {
        const updatedImages = [...images, ...newlyUploadedUrls]
        // If there was no cover, set the first newly uploaded image as cover
        const updatedCover = effectiveCover || newlyUploadedUrls[0]
        onChange(updatedImages, updatedCover)
        setSuccessMsg(
          `Uploaded ${newlyUploadedUrls.length} photo${newlyUploadedUrls.length > 1 ? "s" : ""} successfully.`
        )
      }

      if (failedCount > 0) {
        setError(`Failed to upload ${failedCount} photo(s). Please try again.`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload images."
      setError(msg)
    } finally {
      // Clean up object URLs
      queueItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setUploadingQueue([])
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleSetCover = (url: string) => {
    onChange(images, url)
  }

  const handleRemove = (indexToRemove: number) => {
    const targetUrl = images[indexToRemove]
    const updated = images.filter((_, idx) => idx !== indexToRemove)
    let newCover = effectiveCover

    // If removed photo was cover, pick first available
    if (targetUrl === effectiveCover) {
      newCover = updated.length > 0 ? updated[0] : null
    }

    onChange(updated, newCover)
  }

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return
    const updated = [...images]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onChange(updated, effectiveCover)
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-slate-200">
            Listing Photos{" "}
            <span className="text-slate-400 font-normal">
              ({images.length}/{maxPhotos} uploaded)
            </span>
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload up to {maxPhotos} photos. Set one as cover for the listing card. Reorder as desired.
          </p>
        </div>

        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>Add Photos</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Grid of Existing Photos */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, idx) => {
            const isCover = url === effectiveCover

            return (
              <div
                key={`${url}_${idx}`}
                className={`relative group rounded-xl overflow-hidden border transition-all bg-slate-950 flex flex-col ${
                  isCover
                    ? "border-amber-500/80 ring-2 ring-amber-500/30"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.src = mode === "accommodation" ? "/hero-coast.png" : "/mess-tiffin.jpg"
                    }}
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white">
                      #{idx + 1}
                    </span>
                    {isCover && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 shadow-xs">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>Cover</span>
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Remove this photo"
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Footer Controls: Cover & Reorder */}
                <div className="p-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs">
                  {!isCover ? (
                    <button
                      type="button"
                      onClick={() => handleSetCover(url)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-amber-400 transition-colors"
                      title="Set as cover photo"
                    >
                      <Star className="w-3 h-3" />
                      <span>Set Cover</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Cover Photo
                    </span>
                  )}

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move backward"
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, idx + 1)}
                      disabled={idx === images.length - 1}
                      title="Move forward"
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Uploading queue preview cards */}
          {uploadingQueue.map((item) => (
            <div
              key={item.id}
              className="relative aspect-4/3 rounded-xl overflow-hidden border border-indigo-500/50 bg-slate-950 flex flex-col items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.name}
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-white p-2 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-[11px] font-semibold truncate max-w-full">
                  Uploading...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone Container (when under max limit) */}
      {remainingSlots > 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-6 text-center ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10"
              : images.length > 0
              ? "border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/60"
              : "border-slate-700 hover:border-indigo-500/60 bg-slate-800/20 hover:bg-slate-800/40"
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {images.length === 0
                ? "Click or drag and drop photos here"
                : `Click or drag to add more photos (${remainingSlots} slots left)`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports <span className="text-slate-300 font-medium">.jpg</span>,{" "}
              <span className="text-slate-300 font-medium">.jpeg</span>, and{" "}
              <span className="text-slate-300 font-medium">.png</span> up to 5 MB each
            </p>
          </div>
        </div>
      )}

      {/* Zero photos empty indicator */}
      {images.length === 0 && !isUploading && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
          <span>No photos uploaded yet. When you upload photos, the first one will automatically become the cover photo.</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Success alert */}
      {successMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  )
}
