"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { AdminSidebar, AdminTab } from "@/components/AdminSidebar"
import { StatsCards } from "@/components/StatsCards"
import { EnquiriesView, AdminNotificationItem } from "@/components/EnquiriesView"
import { AccommodationsView, AccommodationItem } from "@/components/AccommodationsView"
import { MessesView, MessItem } from "@/components/MessesView"
import { BulkImporterView } from "@/components/BulkImporterView"
import { EditListingModal } from "@/components/EditListingModal"
import { VendorsView, VendorApplicationItem } from "@/components/VendorsView"
import { AdminLogin } from "@/components/AdminLogin"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { ParsedAccommodationRow, ParsedMessRow } from "@/lib/csv-helper"
import type { VendorStatus } from "@/types/database"

export default function AdminPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([])
  const [messes, setMesses] = useState<MessItem[]>([])
  const [vendorApplications, setVendorApplications] = useState<VendorApplicationItem[]>([])

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<AccommodationItem | MessItem | null>(null)
  const [editMode, setEditMode] = useState<"accommodation" | "mess">("accommodation")

  const handleLoginSuccess = (email: string) => {
    setAdminEmail(email)
  }

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut().catch(() => {})
    }
    setAdminEmail(null)
  }

  // Load data from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true)
    const supabase = getSupabaseClient()

    if (!supabase) {
      setNotifications([])
      setVendorApplications([])
      setIsLoading(false)
      return
    }

    try {
      // 1. Fetch notifications
      const { data: notifData } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })

      if (notifData) {
        setNotifications(notifData as AdminNotificationItem[])
      } else {
        setNotifications([])
      }

      // 2. Fetch accommodations
      const { data: accData } = await supabase
        .from("accommodation_listings")
        .select("*")
        .order("created_at", { ascending: false })

      if (accData) {
        setAccommodations(accData as AccommodationItem[])
      }

      // 3. Fetch messes
      const { data: messData } = await supabase
        .from("mess_listings")
        .select("*")
        .order("created_at", { ascending: false })

      if (messData) {
        setMesses(messData as MessItem[])
      }

      // 4. Fetch vendor applications with fallback to profiles table
      let apps: VendorApplicationItem[] = []
      try {
        const { data: vendorData, error: vendorErr } = await supabase
          .from("vendor_applications")
          .select("*")
          .order("created_at", { ascending: false })

        if (!vendorErr && vendorData && vendorData.length > 0) {
          apps = vendorData as VendorApplicationItem[]
        }
      } catch (err) {
        console.warn("Direct vendor_applications table fetch:", err)
      }

      // If vendor_applications returned no rows, fallback to querying profiles with vendor role
      if (apps.length === 0) {
        try {
          const { data: vendorProfiles } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })

          if (vendorProfiles && vendorProfiles.length > 0) {
            const matched = vendorProfiles.filter((p) => {
              const meta = (p.metadata as Record<string, unknown>) || {}
              return p.role === "vendor" || Boolean(meta.vendor_type) || Boolean(meta.business_name)
            })

            apps = matched.map((p) => {
              const meta = (p.metadata as Record<string, unknown>) || {}
              const isFood = meta.vendor_type === "food_mess_vendor"
              const status = (meta.vendor_status as VendorStatus) || "pending"
              return {
                id: p.id,
                user_id: p.id,
                vendor_type: isFood ? "food_mess_vendor" : "pg_vendor",
                status,
                business_name:
                  (meta.business_name as string) ||
                  (meta.property_name as string) ||
                  p.full_name ||
                  "Vendor Business",
                business_phone: p.phone || "",
                business_address: (meta.business_address as string) || "",
                pg_property_name: (meta.pg_property_name as string) || (meta.property_name as string) || null,
                pg_area: (meta.pg_area as string) || null,
                pg_gender_preference: (meta.pg_gender_preference as string) || "Co-ed",
                pg_approximate_rent: (meta.pg_approximate_rent as number) || null,
                mess_name: (meta.mess_name as string) || (meta.business_name as string) || null,
                mess_area: (meta.mess_area as string) || null,
                mess_cuisine: (meta.mess_cuisine as string) || (meta.mess_dietary_type as string) || null,
                created_at: p.created_at,
              }
            })
          }
        } catch (profErr) {
          console.warn("Profile vendor fallback query:", profErr)
        }
      }

      setVendorApplications(apps)
    } catch (err) {
      console.error("Error loading admin data:", err)
      setNotifications([])
      setVendorApplications([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    async function checkExistingSession() {
      const supabase = getSupabaseClient()
      if (supabase) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (!error && user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single()

            if (profile?.role === "admin") {
              setAdminEmail(user.email || "admin")
              setIsMounted(true)
              return
            }
            await supabase.auth.signOut().catch(() => {})
          }
        } catch {
          // Ignore network errors
        }
      }
      setAdminEmail(null)
      setIsMounted(true)
    }

    void checkExistingSession()
  }, [])

  useEffect(() => {
    if (adminEmail) {
      void (async () => { await loadData() })()
    }
  }, [adminEmail, loadData])

  // ==========================================
  // Enquiries & Notifications Handlers
  // ==========================================
  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("admin_notifications").update({ read: true }).eq("id", id)
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("admin_notifications").update({ read: true }).eq("read", false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("admin_notifications").delete().eq("id", id)
    }
  }

  // ==========================================
  // Accommodations Handlers
  // ==========================================
  const handleUpdateAccStatus = async (id: string, status: "published" | "pending" | "rejected") => {
    setAccommodations((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase.from("accommodation_listings").update({ status }).eq("id", id)
      if (error) {
        console.error("Update status error:", error)
        alert("Database Error: " + error.message)
      } else {
        await loadData()
      }
    }
  }

  const handleDeleteAcc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this accommodation listing?")) return
    setAccommodations((prev) => prev.filter((a) => a.id !== id))
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase.from("accommodation_listings").delete().eq("id", id)
      if (error) {
        console.error("Delete error:", error)
        alert("Database Error: " + error.message)
      } else {
        await loadData()
      }
    }
  }

  const handleSaveAccommodation = async (item: Partial<AccommodationItem> & { id?: string }) => {
    const supabase = getSupabaseClient()
    if (!item.id) {
      // Insert new
      const newId = `acc_${Date.now()}`
      const newAcc: AccommodationItem = {
        id: newId,
        name: item.name || "Untitled PG",
        area: item.area || "Saralebettu Road",
        nearest_landmark: item.nearest_landmark || "",
        monthly_rent_from: item.monthly_rent_from || 8000,
        security_deposit: item.security_deposit || 16000,
        gender: item.gender || "Boys",
        type: item.type || "PG",
        amenities: item.amenities || [],
        sharing_options: item.sharing_options || [],
        food_option: item.food_option || "Optional",
        status: item.status || "published",
        description: item.description || "",
        sample_image: item.sample_image || (item.images && item.images[0]) || "/hero-coast.png",
        images: item.images && item.images.length > 0 ? item.images : (item.sample_image ? [item.sample_image] : []),
      }

      setAccommodations((prev) => [newAcc, ...prev])

      if (supabase) {
        const { error } = await supabase.from("accommodation_listings").insert({
          id: newId,
          name: newAcc.name,
          area: newAcc.area,
          nearest_landmark: newAcc.nearest_landmark,
          monthly_rent_from: newAcc.monthly_rent_from,
          security_deposit: newAcc.security_deposit,
          gender: newAcc.gender,
          type: newAcc.type,
          amenities: newAcc.amenities,
          sharing_options: newAcc.sharing_options,
          food_option: newAcc.food_option,
          status: newAcc.status,
          description: newAcc.description,
          sample_image: newAcc.sample_image,
          images: newAcc.images,
          is_demo: false,
        })

        if (error) {
          console.error("Insert accommodation error:", error)
          alert("Database Error: " + error.message)
          return
        }
        await loadData()
      }
    } else {
      // Update existing
      setAccommodations((prev) =>
        prev.map((a) => (a.id === item.id ? ({ ...a, ...item } as AccommodationItem) : a))
      )
      if (supabase) {
        const updatePayload: Record<string, unknown> = {
          name: item.name,
          area: item.area,
          nearest_landmark: item.nearest_landmark,
          monthly_rent_from: item.monthly_rent_from,
          security_deposit: item.security_deposit,
          gender: item.gender,
          type: item.type,
          amenities: item.amenities,
          sharing_options: item.sharing_options,
          food_option: item.food_option,
          status: item.status,
          description: item.description,
          is_demo: false,
          updated_at: new Date().toISOString(),
        }
        if (item.sample_image !== undefined || item.images !== undefined) {
          const imgs = item.images !== undefined ? item.images : (item.sample_image ? [item.sample_image] : [])
          const cover = item.sample_image || (imgs.length > 0 ? imgs[0] : null)
          updatePayload.sample_image = cover
          updatePayload.images = imgs
        }
        const { error } = await supabase
          .from("accommodation_listings")
          .update(updatePayload)
          .eq("id", item.id)

        if (error) {
          console.error("Update accommodation error:", error)
          alert("Database Error: " + error.message)
          return
        }
        await loadData()
      }
    }
  }

  // ==========================================
  // Messes Handlers
  // ==========================================
  const handleUpdateMessStatus = async (id: string, status: "published" | "pending" | "rejected") => {
    setMesses((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase.from("mess_listings").update({ status }).eq("id", id)
      if (error) {
        console.error("Update mess status error:", error)
        alert("Database Error: " + error.message)
      } else {
        await loadData()
      }
    }
  }

  const handleDeleteMess = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mess listing?")) return
    setMesses((prev) => prev.filter((m) => m.id !== id))
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase.from("mess_listings").delete().eq("id", id)
      if (error) {
        console.error("Delete mess error:", error)
        alert("Database Error: " + error.message)
      } else {
        await loadData()
      }
    }
  }

  const handleSaveMess = async (item: Partial<MessItem> & { id?: string }) => {
    const supabase = getSupabaseClient()
    if (!item.id) {
      // Insert new
      const newId = `mess_${Date.now()}`
      const newMess: MessItem = {
        id: newId,
        name: item.name || "Untitled Mess",
        cuisine: item.cuisine || "South Indian",
        area: item.area || "Tiger Circle",
        approximate_location: item.approximate_location || item.area || "",
        nearest_landmark: item.nearest_landmark || "",
        pricing_type: item.pricing_type || "meals_per_day",
        meals_per_day_pricing: item.meals_per_day_pricing,
        meal_combinations_pricing: item.meal_combinations_pricing,
        weekly_holidays: item.weekly_holidays || [],
        timings: item.timings,
        monthly_price_from: item.monthly_price_from || 3000,
        per_meal_price_from: item.per_meal_price_from || 60,
        dietary: item.dietary || "Pure Veg",
        service_type: item.service_type || "Dine-in Mess",
        meals_served: item.meals_served || ["Breakfast", "Lunch", "Dinner"],
        status: item.status || "published",
        description: item.description || "",
        sample_image: item.sample_image || (item.images && item.images[0]) || "/mess-tiffin.jpg",
        images: item.images && item.images.length > 0 ? item.images : (item.sample_image ? [item.sample_image] : []),
      }

      setMesses((prev) => [newMess, ...prev])

      if (supabase) {
        const { error } = await supabase.from("mess_listings").insert({
          id: newId,
          name: newMess.name,
          cuisine: newMess.cuisine,
          area: newMess.area,
          approximate_location: newMess.approximate_location,
          nearest_landmark: newMess.nearest_landmark,
          pricing_type: newMess.pricing_type,
          meals_per_day_pricing: newMess.meals_per_day_pricing,
          meal_combinations_pricing: newMess.meal_combinations_pricing,
          weekly_holidays: newMess.weekly_holidays,
          timings: newMess.timings,
          monthly_price_from: newMess.monthly_price_from,
          per_meal_price_from: newMess.per_meal_price_from,
          dietary: newMess.dietary,
          service_type: newMess.service_type,
          meals_served: newMess.meals_served,
          status: newMess.status,
          description: newMess.description,
          sample_image: newMess.sample_image,
          images: newMess.images,
          is_demo: false,
        })

        if (error) {
          console.error("Insert mess error:", error)
          alert("Database Error: " + error.message)
          return
        }
        await loadData()
      }
    } else {
      // Update existing
      setMesses((prev) => prev.map((m) => (m.id === item.id ? ({ ...m, ...item } as MessItem) : m)))
      if (supabase) {
        const updatePayload: Record<string, unknown> = {
          name: item.name,
          cuisine: item.cuisine,
          area: item.area,
          nearest_landmark: item.nearest_landmark,
          monthly_price_from: item.monthly_price_from,
          per_meal_price_from: item.per_meal_price_from,
          dietary: item.dietary,
          service_type: item.service_type,
          meals_served: item.meals_served,
          status: item.status,
          description: item.description,
          is_demo: false,
          updated_at: new Date().toISOString(),
        }
        if (item.pricing_type !== undefined) updatePayload.pricing_type = item.pricing_type
        if (item.meals_per_day_pricing !== undefined) updatePayload.meals_per_day_pricing = item.meals_per_day_pricing
        if (item.meal_combinations_pricing !== undefined) updatePayload.meal_combinations_pricing = item.meal_combinations_pricing
        if (item.weekly_holidays !== undefined) updatePayload.weekly_holidays = item.weekly_holidays
        if (item.timings !== undefined) updatePayload.timings = item.timings
        if (item.approximate_location !== undefined) updatePayload.approximate_location = item.approximate_location
        if (item.sample_image !== undefined || item.images !== undefined) {
          const imgs = item.images !== undefined ? item.images : (item.sample_image ? [item.sample_image] : [])
          const cover = item.sample_image || (imgs.length > 0 ? imgs[0] : null)
          updatePayload.sample_image = cover
          updatePayload.images = imgs
        }
        const { error } = await supabase
          .from("mess_listings")
          .update(updatePayload)
          .eq("id", item.id)

        if (error) {
          console.error("Update mess error:", error)
          alert("Database Error: " + error.message)
          return
        }
        await loadData()
      }
    }
  }

  // ==========================================
  // Direct Image Replacement (without altering other fields)
  // ==========================================
  const handleReplaceListingImage = async (
    id: string,
    mode: "accommodation" | "mess",
    imageUrl: string
  ) => {
    const supabase = getSupabaseClient()
    if (mode === "accommodation") {
      setAccommodations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, sample_image: imageUrl, images: [imageUrl] } : a))
      )
      if (supabase) {
        const { error } = await supabase
          .from("accommodation_listings")
          .update({
            sample_image: imageUrl,
            images: [imageUrl],
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
        if (error) {
          console.error("Replace accommodation image error:", error)
          throw new Error("Failed to update accommodation image: " + error.message)
        }
      }
    } else {
      setMesses((prev) =>
        prev.map((m) => (m.id === id ? { ...m, sample_image: imageUrl, images: [imageUrl] } : m))
      )
      if (supabase) {
        const { error } = await supabase
          .from("mess_listings")
          .update({
            sample_image: imageUrl,
            images: [imageUrl],
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
        if (error) {
          console.error("Replace mess image error:", error)
          throw new Error("Failed to update mess image: " + error.message)
        }
      }
    }
  }

  // ==========================================
  // Bulk Import Handlers
  // ==========================================
  const handleBulkImportAccommodations = async (items: ParsedAccommodationRow[]) => {
    const supabase = getSupabaseClient()
    const mappedItems: AccommodationItem[] = items.map((r, i) => ({
      id: `acc_bulk_${Date.now()}_${i}`,
      name: r.name,
      area: r.area,
      nearest_landmark: r.nearest_landmark || "",
      monthly_rent_from: r.monthly_rent_from,
      security_deposit: typeof r.security_deposit === "number" && r.security_deposit <= 100000 ? r.security_deposit : r.monthly_rent_from * 2,
      gender: r.gender,
      type: r.type,
      amenities: r.amenities || [],
      sharing_options: r.sharing_options || [],
      food_option: r.food_option || "Optional",
      status: r.status,
      description: r.description || "",
      sample_image: r.sample_image || "/hero-coast.png",
      is_demo: false,
    }))

    // Update local state immediately
    setAccommodations((prev) => [...mappedItems, ...prev])

    // Save to Supabase in batches of 25
    if (supabase) {
      const batchSize = 25
      for (let i = 0; i < mappedItems.length; i += batchSize) {
        const batch = mappedItems.slice(i, i + batchSize)
        const { error } = await supabase.from("accommodation_listings").insert(batch as unknown as Record<string, unknown>[])
        if (error) {
          console.error("Bulk insert accommodation error:", error)
          alert("Database Error: " + error.message)
          return { success: i, failed: mappedItems.length - i }
        }
      }

      await loadData()

      // Add audit notification
      await supabase.from("admin_notifications").insert({
        notification_type: "listing_submitted",
        title: `Bulk Imported ${items.length} Accommodations`,
        message: `Admin imported ${items.length} PG listings via CSV bulk uploader.`,
        read: false,
        metadata: { count: items.length },
      })
    }

    return { success: items.length, failed: 0 }
  }

  const handleBulkImportMesses = async (items: ParsedMessRow[]) => {
    const supabase = getSupabaseClient()
    const mappedItems: MessItem[] = items.map((r, i) => ({
      id: `mess_bulk_${Date.now()}_${i}`,
      name: r.name,
      cuisine: r.cuisine || "South Indian & Coastal",
      area: r.area,
      approximate_location: r.approximate_location || r.area,
      nearest_landmark: r.nearest_landmark || "",
      pricing_type: r.pricing_type || "meals_per_day",
      weekly_holidays: r.weekly_holidays || [],
      timings: r.timings,
      monthly_price_from: r.monthly_price_from,
      per_meal_price_from: r.per_meal_price_from || Math.round(r.monthly_price_from / 60),
      dietary: r.dietary,
      service_type: r.service_type,
      meals_served: r.meals_served || ["Breakfast", "Lunch", "Dinner"],
      status: r.status,
      description: r.description || "",
      sample_image: r.sample_image || "/mess-tiffin.jpg",
      is_demo: false,
    }))

    setMesses((prev) => [...mappedItems, ...prev])

    if (supabase) {
      const batchSize = 25
      for (let i = 0; i < mappedItems.length; i += batchSize) {
        const batch = mappedItems.slice(i, i + batchSize)
        const { error } = await supabase.from("mess_listings").insert(batch as unknown as Record<string, unknown>[])
        if (error) {
          console.error("Bulk insert mess error:", error)
          alert("Database Error: " + error.message)
          return { success: i, failed: mappedItems.length - i }
        }
      }

      await loadData()

      await supabase.from("admin_notifications").insert({
        notification_type: "listing_submitted",
        title: `Bulk Imported ${items.length} Messes`,
        message: `Admin imported ${items.length} mess listings via CSV bulk uploader.`,
        read: false,
        metadata: { count: items.length },
      })
    }

    return { success: items.length, failed: 0 }
  }

  const handleUpdateVendorStatus = async (id: string, status: VendorStatus) => {
    setVendorApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status, reviewed_at: new Date().toISOString() } : app))
    )
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase
        .from("vendor_applications")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("Update vendor application error:", error)
        alert("Database Error: " + error.message)
      } else {
        await loadData()
      }
    }
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  // Not logged in -> Show sleek Admin Login
  if (!adminEmail) {
    return <AdminLogin onSuccess={handleLoginSuccess} />
  }

  // Counts
  const unreadCount = notifications.filter((n) => !n.read).length
  const pendingVendorsCount = vendorApplications.filter((v) => v.status === "pending").length
  const publishedAccCount = accommodations.filter((a) => a.status === "published").length
  const pendingAccCount = accommodations.filter((a) => a.status === "pending").length
  const publishedMessCount = messes.filter((m) => m.status === "published").length
  const pendingMessCount = messes.filter((m) => m.status === "pending").length

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        totalEnquiries={notifications.length}
        pendingVendorsCount={pendingVendorsCount}
        isLive={isSupabaseConfigured()}
        onSignOut={handleSignOut}
        adminEmail={adminEmail}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Overview</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Live snapshot of student enquiries, vendor applications, accommodations, and messes.
                </p>
              </div>

              {/* Stats Cards */}
              <StatsCards
                totalAccommodations={accommodations.length}
                publishedAccommodations={publishedAccCount}
                pendingAccommodations={pendingAccCount}
                totalMesses={messes.length}
                publishedMesses={publishedMessCount}
                pendingMesses={pendingMessCount}
                unreadEnquiries={unreadCount}
                totalEnquiries={notifications.length}
                totalVendors={vendorApplications.length}
                pendingVendors={pendingVendorsCount}
                onNavigate={(tab) => setActiveTab(tab)}
              />

              {/* Pending Vendor Applications Preview on Overview */}
              {pendingVendorsCount > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Pending Vendor Applications</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {pendingVendorsCount} Needs Review
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        New vendor registration forms pending admin approval.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("vendors")}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      View all vendors ({vendorApplications.length}) â†’
                    </button>
                  </div>
                  <VendorsView
                    applications={vendorApplications.filter((a) => a.status === "pending")}
                    onUpdateStatus={handleUpdateVendorStatus}
                    onRefresh={loadData}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Recent Enquiries Preview */}
              <div className="mt-8">
                <EnquiriesView
                  notifications={notifications.slice(0, 5)}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                  onDeleteNotification={handleDeleteNotification}
                  onRefresh={loadData}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}

          {activeTab === "vendors" && (
            <VendorsView
              applications={vendorApplications}
              onUpdateStatus={handleUpdateVendorStatus}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "enquiries" && (
            <EnquiriesView
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onDeleteNotification={handleDeleteNotification}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "accommodations" && (
            <AccommodationsView
              accommodations={accommodations}
              onUpdateStatus={handleUpdateAccStatus}
              onDelete={handleDeleteAcc}
              onEdit={(item) => {
                setEditItem(item)
                setEditMode("accommodation")
                setIsEditModalOpen(true)
              }}
              onAddNew={() => {
                setEditItem(null)
                setEditMode("accommodation")
                setIsEditModalOpen(true)
              }}
              onNavigateBulk={() => setActiveTab("bulk-import")}
              onReplaceImage={(id, url) => handleReplaceListingImage(id, "accommodation", url)}
              isLoading={isLoading}
            />
          )}

          {activeTab === "messes" && (
            <MessesView
              messes={messes}
              onUpdateStatus={handleUpdateMessStatus}
              onDelete={handleDeleteMess}
              onEdit={(item) => {
                setEditItem(item)
                setEditMode("mess")
                setIsEditModalOpen(true)
              }}
              onAddNew={() => {
                setEditItem(null)
                setEditMode("mess")
                setIsEditModalOpen(true)
              }}
              onNavigateBulk={() => setActiveTab("bulk-import")}
              onReplaceImage={(id, url) => handleReplaceListingImage(id, "mess", url)}
              isLoading={isLoading}
            />
          )}

          {activeTab === "bulk-import" && (
            <BulkImporterView
              onImportAccommodations={handleBulkImportAccommodations}
              onImportMesses={handleBulkImportMesses}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
        </div>
      </main>

      {/* Edit / Add Modal */}
      <EditListingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editItem}
        mode={editMode}
        onSaveAccommodation={handleSaveAccommodation}
        onSaveMess={handleSaveMess}
        onReplaceListingImage={handleReplaceListingImage}
      />
    </div>
  )
}
