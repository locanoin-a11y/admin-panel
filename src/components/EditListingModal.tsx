"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react"
import {
  X,
  Save,
  Home,
  UtensilsCrossed,
  Loader2,
  Clock,
  Calendar,
  Users,
  Utensils,
  Eye,
  AlertCircle,
} from "lucide-react"
import { AccommodationItem } from "./AccommodationsView"
import { MessItem } from "./MessesView"
import { MultiImageUploader } from "./MultiImageUploader"

interface EditListingModalProps {
  isOpen: boolean
  onClose: () => void
  item: AccommodationItem | MessItem | null
  mode: "accommodation" | "mess"
  onSaveAccommodation: (item: Partial<AccommodationItem> & { id?: string }) => Promise<void>
  onSaveMess: (item: Partial<MessItem> & { id?: string }) => Promise<void>
  onReplaceListingImage?: (id: string, mode: "accommodation" | "mess", imageUrl: string) => Promise<void>
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

interface MealsPerDayState {
  oneMealPrice: string | number
  twoMealsPrice: string | number
  threeMealsPrice: string | number
  hasGroupPricing: boolean
  groupOneMealPrice: string | number
  groupTwoMealsPrice: string | number
  groupThreeMealsPrice: string | number
  groupNotes: string
}

interface MealCombinationsState {
  breakfastOnly: string | number
  lunchOnly: string | number
  dinnerOnly: string | number
  breakfastLunch: string | number
  breakfastDinner: string | number
  lunchDinner: string | number
  allThree: string | number
}

interface TimingsState {
  breakfast: string
  lunch: string
  dinner: string
}

export function EditListingModal({
  isOpen,
  onClose,
  item,
  mode,
  onSaveAccommodation,
  onSaveMess,
}: EditListingModalProps) {
  // Shared fields
  const [name, setName] = useState("")
  const [area, setArea] = useState("")
  const [approximateLocation, setApproximateLocation] = useState("")
  const [nearestLandmark, setNearestLandmark] = useState("")
  const [status, setStatus] = useState<"published" | "pending" | "rejected" | "archived">("published")
  const [description, setDescription] = useState("")
  const [sampleImage, setSampleImage] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])

  // Accommodation specific
  const [monthlyRentFrom, setMonthlyRentFrom] = useState<string | number>(8000)
  const [securityDeposit, setSecurityDeposit] = useState<string | number>(16000)
  const [gender, setGender] = useState<"Boys" | "Girls" | "Co-ed">("Boys")
  const [accType, setAccType] = useState<"PG" | "Hostel" | "Shared Apartment">("PG")
  const [amenitiesStr, setAmenitiesStr] = useState("")
  const [sharingStr, setSharingStr] = useState("")
  const [foodOption, setFoodOption] = useState("Optional / Available")
  const [roomFeaturesStr, setRoomFeaturesStr] = useState("")
  const [houseRulesStr, setHouseRulesStr] = useState("")
  const [noticePeriodDays, setNoticePeriodDays] = useState<string | number>(30)
  const [tagline, setTagline] = useState("")

  // Mess specific
  const [cuisine, setCuisine] = useState("South Indian & Coastal")
  const [dietary, setDietary] = useState<"Pure Veg" | "Veg & Non-Veg">("Pure Veg")
  const [serviceType, setServiceType] = useState<"Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery">("Dine-in Mess")
  const [perMealPriceFrom, setPerMealPriceFrom] = useState<string | number>(80)
  const [pricingType, setPricingType] = useState<"meals_per_day" | "meal_combinations">("meals_per_day")

  // Model A State
  const [modelA, setModelA] = useState<MealsPerDayState>({
    oneMealPrice: 1900,
    twoMealsPrice: 3000,
    threeMealsPrice: 3900,
    hasGroupPricing: false,
    groupOneMealPrice: "",
    groupTwoMealsPrice: "",
    groupThreeMealsPrice: "",
    groupNotes: "Discount for groups of 5 students subscribing together",
  })

  // Model B State
  const [modelB, setModelB] = useState<MealCombinationsState>({
    breakfastOnly: "",
    lunchOnly: 2200,
    dinnerOnly: 2200,
    breakfastLunch: "",
    breakfastDinner: "",
    lunchDinner: 3600,
    allThree: 4400,
  })

  // Timings State
  const [timings, setTimings] = useState<TimingsState>({
    breakfast: "",
    lunch: "12:30 PM – 3:00 PM",
    dinner: "7:30 PM – 10:00 PM",
  })

  // Weekly Holidays
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Sunday"])

  // UI state
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    if (item) {
      setName(item.name || "")
      setArea(item.area || "")
      setApproximateLocation(item.approximate_location || "")
      setNearestLandmark(item.nearest_landmark || "")
      setStatus(item.status || "published")
      setDescription(item.description || "")
      const initialImages = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.sample_image && !item.sample_image.includes("hero-coast") && !item.sample_image.includes("mess-tiffin") && !item.sample_image.includes("mess-thali") ? [item.sample_image] : [])
      setImages(initialImages)
      setSampleImage(item.sample_image || (initialImages.length > 0 ? initialImages[0] : null))

      if (mode === "accommodation") {
        const acc = item as AccommodationItem
        setMonthlyRentFrom(acc.monthly_rent_from || 8000)
        setSecurityDeposit(acc.security_deposit || 0)
        setGender(acc.gender || "Boys")
        setAccType(acc.type || "PG")
        setAmenitiesStr(acc.amenities?.join(", ") || "")
        setSharingStr(acc.sharing_options?.join(", ") || "")
        setFoodOption(acc.food_option || "Optional / Available")
        setRoomFeaturesStr(acc.room_features?.join(", ") || "")
        setHouseRulesStr(acc.house_rules?.join(", ") || "")
        setNoticePeriodDays(acc.notice_period_days ?? 30)
        setTagline(acc.tagline || "")
      } else {
        const mess = item as MessItem
        setCuisine(mess.cuisine || "South Indian & Coastal")
        setDietary(mess.dietary || "Pure Veg")
        setServiceType(mess.service_type || "Dine-in Mess")
        setPerMealPriceFrom(mess.per_meal_price_from ?? 80)
        setApproximateLocation(mess.approximate_location || "")

        const pType = mess.pricing_type || "meals_per_day"
        setPricingType(pType)

        // Populate Model A
        const mpd = (mess.meals_per_day_pricing as Record<string, unknown>) || {}
        const grp = (mpd.group_pricing || mpd.groupPricing || {}) as Record<string, unknown>
        setModelA({
          oneMealPrice: (mpd.one_meal_price as number) ?? (mpd.oneMealPrice as number) ?? (pType === "meals_per_day" ? Math.round(mess.monthly_price_from * 0.6) : 1900),
          twoMealsPrice: (mpd.two_meals_price as number) ?? (mpd.twoMealsPrice as number) ?? (pType === "meals_per_day" ? mess.monthly_price_from : 3000),
          threeMealsPrice: (mpd.three_meals_price as number) ?? (mpd.threeMealsPrice as number) ?? (pType === "meals_per_day" ? Math.round(mess.monthly_price_from * 1.3) : 3900),
          hasGroupPricing: Boolean(mpd.has_group_pricing ?? mpd.hasGroupPricing),
          groupOneMealPrice: (grp.one_meal_price as number) ?? (grp.oneMealPrice as number) ?? "",
          groupTwoMealsPrice: (grp.two_meals_price as number) ?? (grp.twoMealsPrice as number) ?? "",
          groupThreeMealsPrice: (grp.three_meals_price as number) ?? (grp.threeMealsPrice as number) ?? "",
          groupNotes: (grp.notes as string) || "Discount for groups of 5 students subscribing together",
        })

        // Populate Model B
        const mcp = (mess.meal_combinations_pricing as Record<string, unknown>) || {}
        setModelB({
          breakfastOnly: (mcp.breakfast_only as number) ?? (mcp.breakfastOnly as number) ?? "",
          lunchOnly: (mcp.lunch_only as number) ?? (mcp.lunchOnly as number) ?? "",
          dinnerOnly: (mcp.dinner_only as number) ?? (mcp.dinnerOnly as number) ?? "",
          breakfastLunch: (mcp.breakfast_lunch as number) ?? (mcp.breakfastLunch as number) ?? "",
          breakfastDinner: (mcp.breakfast_dinner as number) ?? (mcp.breakfastDinner as number) ?? "",
          lunchDinner: (mcp.lunch_dinner as number) ?? (mcp.lunchDinner as number) ?? "",
          allThree: (mcp.all_three as number) ?? (mcp.allThree as number) ?? "",
        })

        // Populate Timings
        const t = (mess.timings as Record<string, string>) || {}
        setTimings({
          breakfast: t.breakfast || "",
          lunch: t.lunch || "",
          dinner: t.dinner || "",
        })

        // Populate Weekly Holidays
        setWeeklyHolidays(Array.isArray(mess.weekly_holidays) ? mess.weekly_holidays : [])
      }
    } else {
      // New Item Defaults
      setName("")
      setNearestLandmark("")
      setStatus("published")
      setDescription("")
      setImages([])
      setSampleImage(null)

      if (mode === "accommodation") {
        setArea("Balmatta")
        setApproximateLocation("")
        setMonthlyRentFrom(8000)
        setSecurityDeposit(16000)
        setGender("Boys")
        setAccType("PG")
        setAmenitiesStr("Wi-Fi, 24/7 Power, CCTV, RO Water")
        setSharingStr("Single, Double")
        setFoodOption("Optional / Available")
        setRoomFeaturesStr("Attached Bathroom, Bed & Mattress, Study Table, Wardrobe")
        setHouseRulesStr("Gate closes at 10:30 PM, Visitors allowed till 8 PM, No smoking")
        setNoticePeriodDays(30)
        setTagline("")
      } else {
        setArea("Kadri")
        setApproximateLocation("")
        setCuisine("South Indian & Coastal")
        setDietary("Pure Veg")
        setServiceType("Dine-in Mess")
        setPerMealPriceFrom(80)
        setPricingType("meals_per_day")
        setModelA({
          oneMealPrice: 1900,
          twoMealsPrice: 3000,
          threeMealsPrice: 3900,
          hasGroupPricing: false,
          groupOneMealPrice: "",
          groupTwoMealsPrice: "",
          groupThreeMealsPrice: "",
          groupNotes: "Discount for groups of 5 students subscribing together",
        })
        setModelB({
          breakfastOnly: 1500,
          lunchOnly: 2200,
          dinnerOnly: 2200,
          breakfastLunch: 3200,
          breakfastDinner: 3200,
          lunchDinner: 3600,
          allThree: 4400,
        })
        setTimings({
          breakfast: "7:30 AM – 9:30 AM",
          lunch: "12:30 PM – 3:00 PM",
          dinner: "7:30 PM – 10:00 PM",
        })
        setWeeklyHolidays(["Sunday"])
      }
    }
    setError(null)
  }, [item, mode, isOpen])

  if (!isOpen) return null

  const isAccommodation = mode === "accommodation"

  // Calculate live starting price for Mess
  const calculateLiveStartingPrice = (): number => {
    if (pricingType === "meals_per_day") {
      const prices = [
        Number(modelA.oneMealPrice),
        Number(modelA.twoMealsPrice),
        Number(modelA.threeMealsPrice),
      ].filter((p) => !isNaN(p) && p > 0)
      return prices.length > 0 ? Math.min(...prices) : 0
    } else {
      const prices = [
        Number(modelB.breakfastOnly),
        Number(modelB.lunchOnly),
        Number(modelB.dinnerOnly),
        Number(modelB.breakfastLunch),
        Number(modelB.breakfastDinner),
        Number(modelB.lunchDinner),
        Number(modelB.allThree),
      ].filter((p) => !isNaN(p) && p > 0)
      return prices.length > 0 ? Math.min(...prices) : 0
    }
  }

  const liveStartingPrice = isAccommodation ? Number(monthlyRentFrom) : calculateLiveStartingPrice()

  const toggleHoliday = (day: string) => {
    setWeeklyHolidays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (isAccommodation) {
        const amenities = amenitiesStr
          ? amenitiesStr.split(",").map((s) => s.trim()).filter(Boolean)
          : []
        const sharing_options = sharingStr
          ? sharingStr.split(",").map((s) => s.trim()).filter(Boolean)
          : []
        const room_features = roomFeaturesStr
          ? roomFeaturesStr.split(",").map((s) => s.trim()).filter(Boolean)
          : []
        const house_rules = houseRulesStr
          ? houseRulesStr.split(",").map((s) => s.trim()).filter(Boolean)
          : []

        await onSaveAccommodation({
          id: item?.id,
          name: name.trim(),
          tagline: tagline.trim(),
          area: area.trim(),
          approximate_location: approximateLocation.trim(),
          nearest_landmark: nearestLandmark.trim(),
          monthly_rent_from: Number(monthlyRentFrom),
          security_deposit: Number(securityDeposit || 0),
          gender,
          type: accType,
          amenities,
          sharing_options,
          room_features,
          house_rules,
          notice_period_days: Number(noticePeriodDays) || 30,
          food_option: foodOption,
          status,
          description: description.trim(),
          sample_image: sampleImage || (images.length > 0 ? images[0] : null),
          images,
        })
      } else {
        // Validate Mess Pricing
        if (pricingType === "meals_per_day") {
          const prices = [
            Number(modelA.oneMealPrice),
            Number(modelA.twoMealsPrice),
            Number(modelA.threeMealsPrice),
          ].filter((p) => !isNaN(p) && p > 0)

          if (prices.length === 0) {
            throw new Error("Meals per Day pricing requires at least one valid monthly price (1, 2, or 3 meals/day).")
          }
        } else {
          const prices = [
            Number(modelB.breakfastOnly),
            Number(modelB.lunchOnly),
            Number(modelB.dinnerOnly),
            Number(modelB.breakfastLunch),
            Number(modelB.breakfastDinner),
            Number(modelB.lunchDinner),
            Number(modelB.allThree),
          ].filter((p) => !isNaN(p) && p > 0)

          if (prices.length === 0) {
            throw new Error("Meal Combinations pricing requires at least one valid meal combination price.")
          }
        }

        const computedMonthlyPriceFrom = calculateLiveStartingPrice()

        // Build meals_served based on provided timings or active combinations
        const mealsServedSet = new Set<string>()
        if (timings.breakfast?.trim()) mealsServedSet.add("Breakfast")
        if (timings.lunch?.trim()) mealsServedSet.add("Lunch")
        if (timings.dinner?.trim()) mealsServedSet.add("Dinner")
        if (pricingType === "meal_combinations") {
          if (Number(modelB.breakfastOnly) > 0 || Number(modelB.breakfastLunch) > 0 || Number(modelB.breakfastDinner) > 0 || Number(modelB.allThree) > 0) {
            mealsServedSet.add("Breakfast")
          }
          if (Number(modelB.lunchOnly) > 0 || Number(modelB.breakfastLunch) > 0 || Number(modelB.lunchDinner) > 0 || Number(modelB.allThree) > 0) {
            mealsServedSet.add("Lunch")
          }
          if (Number(modelB.dinnerOnly) > 0 || Number(modelB.breakfastDinner) > 0 || Number(modelB.lunchDinner) > 0 || Number(modelB.allThree) > 0) {
            mealsServedSet.add("Dinner")
          }
        }
        if (mealsServedSet.size === 0) {
          mealsServedSet.add("Lunch")
          mealsServedSet.add("Dinner")
        }

        // Clean structured JSONB objects (stores both camelCase & snake_case for 100% interoperability)
        const cleanMealsPerDayPricing = {
          oneMealPrice: modelA.oneMealPrice ? Number(modelA.oneMealPrice) : null,
          one_meal_price: modelA.oneMealPrice ? Number(modelA.oneMealPrice) : null,
          twoMealsPrice: modelA.twoMealsPrice ? Number(modelA.twoMealsPrice) : null,
          two_meals_price: modelA.twoMealsPrice ? Number(modelA.twoMealsPrice) : null,
          threeMealsPrice: modelA.threeMealsPrice ? Number(modelA.threeMealsPrice) : null,
          three_meals_price: modelA.threeMealsPrice ? Number(modelA.threeMealsPrice) : null,
          hasGroupPricing: Boolean(modelA.hasGroupPricing),
          has_group_pricing: Boolean(modelA.hasGroupPricing),
          groupPricing: modelA.hasGroupPricing
            ? {
                oneMealPrice: modelA.groupOneMealPrice ? Number(modelA.groupOneMealPrice) : null,
                one_meal_price: modelA.groupOneMealPrice ? Number(modelA.groupOneMealPrice) : null,
                twoMealsPrice: modelA.groupTwoMealsPrice ? Number(modelA.groupTwoMealsPrice) : null,
                two_meals_price: modelA.groupTwoMealsPrice ? Number(modelA.groupTwoMealsPrice) : null,
                threeMealsPrice: modelA.groupThreeMealsPrice ? Number(modelA.groupThreeMealsPrice) : null,
                three_meals_price: modelA.groupThreeMealsPrice ? Number(modelA.groupThreeMealsPrice) : null,
                groupSize: 5,
                group_size: 5,
                notes: modelA.groupNotes || "5-person group pricing tier",
              }
            : null,
          group_pricing: modelA.hasGroupPricing
            ? {
                oneMealPrice: modelA.groupOneMealPrice ? Number(modelA.groupOneMealPrice) : null,
                one_meal_price: modelA.groupOneMealPrice ? Number(modelA.groupOneMealPrice) : null,
                twoMealsPrice: modelA.groupTwoMealsPrice ? Number(modelA.groupTwoMealsPrice) : null,
                two_meals_price: modelA.groupTwoMealsPrice ? Number(modelA.groupTwoMealsPrice) : null,
                threeMealsPrice: modelA.groupThreeMealsPrice ? Number(modelA.groupThreeMealsPrice) : null,
                three_meals_price: modelA.groupThreeMealsPrice ? Number(modelA.groupThreeMealsPrice) : null,
                groupSize: 5,
                group_size: 5,
                notes: modelA.groupNotes || "5-person group pricing tier",
              }
            : null,
        }

        const cleanMealCombinationsPricing = {
          breakfastOnly: modelB.breakfastOnly ? Number(modelB.breakfastOnly) : null,
          breakfast_only: modelB.breakfastOnly ? Number(modelB.breakfastOnly) : null,
          lunchOnly: modelB.lunchOnly ? Number(modelB.lunchOnly) : null,
          lunch_only: modelB.lunchOnly ? Number(modelB.lunchOnly) : null,
          dinnerOnly: modelB.dinnerOnly ? Number(modelB.dinnerOnly) : null,
          dinner_only: modelB.dinnerOnly ? Number(modelB.dinnerOnly) : null,
          breakfastLunch: modelB.breakfastLunch ? Number(modelB.breakfastLunch) : null,
          breakfast_lunch: modelB.breakfastLunch ? Number(modelB.breakfastLunch) : null,
          breakfastDinner: modelB.breakfastDinner ? Number(modelB.breakfastDinner) : null,
          breakfast_dinner: modelB.breakfastDinner ? Number(modelB.breakfastDinner) : null,
          lunchDinner: modelB.lunchDinner ? Number(modelB.lunchDinner) : null,
          lunch_dinner: modelB.lunchDinner ? Number(modelB.lunchDinner) : null,
          allThree: modelB.allThree ? Number(modelB.allThree) : null,
          all_three: modelB.allThree ? Number(modelB.allThree) : null,
        }

        const cleanTimings = {
          breakfast: timings.breakfast.trim() || undefined,
          lunch: timings.lunch.trim() || undefined,
          dinner: timings.dinner.trim() || undefined,
        }

        await onSaveMess({
          id: item?.id,
          name: name.trim(),
          cuisine: cuisine.trim(),
          area: area.trim(),
          approximate_location: approximateLocation.trim(),
          nearest_landmark: nearestLandmark.trim(),
          pricing_type: pricingType,
          meals_per_day_pricing: cleanMealsPerDayPricing,
          meal_combinations_pricing: cleanMealCombinationsPricing,
          weekly_holidays: weeklyHolidays,
          monthly_price_from: computedMonthlyPriceFrom,
          per_meal_price_from: perMealPriceFrom ? Number(perMealPriceFrom) : 0,
          dietary,
          service_type: serviceType,
          meals_served: Array.from(mealsServedSet),
          timings: cleanTimings,
          status,
          description: description.trim(),
          sample_image: sampleImage || (images.length > 0 ? images[0] : null),
          images,
        })
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save listing."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isAccommodation ? "bg-indigo-500/10 text-indigo-400" : "bg-teal-500/10 text-teal-400"
              }`}
            >
              {isAccommodation ? <Home className="h-5 w-5" /> : <UtensilsCrossed className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{item ? `Edit ${isAccommodation ? "Accommodation" : "Mess"}` : `Add New ${isAccommodation ? "Accommodation" : "Mess"}`}</span>
                {!isAccommodation && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {pricingType === "meals_per_day" ? "Model A" : "Model B"}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {item?.id ? `ID: ${item.id}` : "Will be published with live structured pricing to Supabase"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAccommodation && (
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showPreview
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreview ? "Hide Preview" : "Card Preview"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Card Preview (Collapsible) */}
        {!isAccommodation && showPreview && (
          <div className="bg-slate-950 p-4 border-b border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Customer-Facing Preview:</span>
              <span className="text-teal-400 font-bold">
                Computed Starting Price: ₹{liveStartingPrice.toLocaleString("en-IN")}/mo
              </span>
            </div>
            <div className="max-w-md mx-auto bg-white rounded-2xl p-4 text-[#10233f] border border-slate-200 shadow-md">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mr-1.5">
                    {dietary}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {serviceType}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {cuisine}
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#10233f] mt-1">{name || "Sample Mess Name"}</h4>
              <p className="text-xs text-slate-500 line-clamp-1">{area || "Area in Mangalore"} · {nearestLandmark || "Near Landmark"}</p>
              
              <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                <div className="flex items-center justify-between font-bold">
                  <span className={pricingType === "meals_per_day" ? "text-[#0066FF]" : "text-purple-700"}>
                    {pricingType === "meals_per_day" ? "MEALS PER DAY" : "MEAL COMBINATIONS"}
                  </span>
                  <span>Starting from ₹{liveStartingPrice.toLocaleString("en-IN")}/mo</span>
                </div>
                <div className="text-[10.5px] text-slate-500 mt-0.5">
                  {pricingType === "meals_per_day"
                    ? "1 / 2 / 3 meals per day"
                    : "Breakfast / Lunch / Dinner combinations"}
                </div>
                {pricingType === "meals_per_day" && modelA.hasGroupPricing && (
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>5-Person Group Pricing Available</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-500 pt-2 border-t border-slate-100">
                <span>Off: {weeklyHolidays.length > 0 ? weeklyHolidays.join(", ") : "All 7 Days"}</span>
                {perMealPriceFrom && Number(perMealPriceFrom) > 0 && <span>Walk-in: ₹{perMealPriceFrom}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Basic Information */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Basic Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Listing Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Annapoorna Traditional Mess"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "published" | "pending" | "rejected" | "archived")}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                >
                  <option value="published">Published</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Area / Locality *</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Balmatta, Kadri, Deralakatte"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nearest Landmark</label>
                <input
                  type="text"
                  value={nearestLandmark}
                  onChange={(e) => setNearestLandmark(e.target.value)}
                  placeholder="e.g. Near St. Aloysius / City Bus Stand"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Approximate Location</label>
                <input
                  type="text"
                  value={approximateLocation}
                  onChange={(e) => setApproximateLocation(e.target.value)}
                  placeholder="e.g. University Road corridor"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Image Uploader */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Photographs
            </h4>
            <MultiImageUploader
              images={images}
              coverImage={sampleImage}
              onChange={(updatedImages, updatedCover) => {
                setImages(updatedImages)
                setSampleImage(updatedCover)
              }}
              mode={mode}
              listingId={item?.id}
              maxPhotos={10}
            />
          </div>

          {/* ACCOMMODATION SPECIFIC FIELDS */}
          {isAccommodation && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Accommodation Specifics
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Rent / Mo (₹) *</label>
                  <input
                    type="number"
                    required
                    value={monthlyRentFrom}
                    onChange={(e) => setMonthlyRentFrom(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Deposit (₹)</label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "Boys" | "Girls" | "Co-ed")}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Co-ed">Co-ed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as "PG" | "Hostel" | "Shared Apartment")}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="PG">PG</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Shared Apartment">Shared Apartment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Food Option</label>
                  <select
                    value={foodOption}
                    onChange={(e) => setFoodOption(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="Included">Included</option>
                    <option value="Optional / Available">Optional / Available</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Premium student living with attached washrooms & Wi-Fi"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={amenitiesStr}
                  onChange={(e) => setAmenitiesStr(e.target.value)}
                  placeholder="Wi-Fi, 24/7 Power, CCTV, RO Water..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Sharing Options (comma-separated)</label>
                <input
                  type="text"
                  value={sharingStr}
                  onChange={(e) => setSharingStr(e.target.value)}
                  placeholder="Single, Double, Triple..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Room Features (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={roomFeaturesStr}
                  onChange={(e) => setRoomFeaturesStr(e.target.value)}
                  placeholder="Attached Bathroom, Bed & Mattress, Study Table, Wardrobe, AC, Balcony..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Displayed as bullet points in the &ldquo;Room Features&rdquo; section on the PG details page.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  House Guidelines (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={houseRulesStr}
                  onChange={(e) => setHouseRulesStr(e.target.value)}
                  placeholder="Gate closes at 10:30 PM, Visitors allowed till 8 PM, No smoking or alcohol, Keep common areas clean..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Displayed as bullet points in the &ldquo;House Guidelines&rdquo; section on the PG details page.
                </p>
              </div>
            </div>
          )}

          {/* MESS SPECIFIC REDESIGN: TWO PRICING STRUCTURES */}
          {!isAccommodation && (
            <div className="space-y-5 pt-3 border-t border-slate-800">
              {/* Common Mess Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cuisine</label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="e.g. Udupi & Coastal South Indian"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dietary Preference</label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value as "Pure Veg" | "Veg & Non-Veg")}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                  >
                    <option value="Pure Veg">Pure Veg</option>
                    <option value="Veg & Non-Veg">Veg & Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) =>
                      setServiceType(e.target.value as "Dine-in Mess" | "Tiffin & Delivery" | "Dine-in & Delivery")
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
                  >
                    <option value="Dine-in Mess">Dine-in Mess</option>
                    <option value="Tiffin & Delivery">Tiffin & Delivery</option>
                    <option value="Dine-in & Delivery">Dine-in & Delivery</option>
                  </select>
                </div>
              </div>

              {/* PRICING STRUCTURE SELECTOR */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4 text-teal-400" />
                      <span>Select Pricing Structure *</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure according to how this mess advertises its student packages.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* OPTION 1: Meals per Day */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      pricingType === "meals_per_day"
                        ? "border-teal-500 bg-teal-500/10 text-white"
                        : "border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pricing_type_radio"
                      checked={pricingType === "meals_per_day"}
                      onChange={() => setPricingType("meals_per_day")}
                      className="mt-1 accent-teal-500"
                    />
                    <div>
                      <div className="font-bold text-xs">OPTION 1: Meals per Day</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tiered monthly pass for 1, 2, or 3 meals/day, plus optional 5-person group rate.
                      </div>
                    </div>
                  </label>

                  {/* OPTION 2: Meal Combinations */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      pricingType === "meal_combinations"
                        ? "border-purple-500 bg-purple-500/10 text-white"
                        : "border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pricing_type_radio"
                      checked={pricingType === "meal_combinations"}
                      onChange={() => setPricingType("meal_combinations")}
                      className="mt-1 accent-purple-500"
                    />
                    <div>
                      <div className="font-bold text-xs">OPTION 2: Meal Combinations</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Independent rates for specific meal combos (Breakfast, Lunch, Dinner, Combos).
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* CONDITIONAL PRICING FORMS */}
              {pricingType === "meals_per_day" ? (
                /* MODEL A FORM: 1, 2, 3 MEALS PER DAY */
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-blue-400" />
                      <span>Model A: Meals Per Day Monthly Rates</span>
                    </div>
                    <span className="text-[11px] text-slate-400">₹ Monthly</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        1 Meal / Day (₹/mo)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1900"
                        value={modelA.oneMealPrice}
                        onChange={(e) => setModelA({ ...modelA, oneMealPrice: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Lunch OR Dinner</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        2 Meals / Day (₹/mo)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 3000"
                        value={modelA.twoMealsPrice}
                        onChange={(e) => setModelA({ ...modelA, twoMealsPrice: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Lunch + Dinner</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        3 Meals / Day (₹/mo)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 3900"
                        value={modelA.threeMealsPrice}
                        onChange={(e) => setModelA({ ...modelA, threeMealsPrice: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Breakfast + Lunch + Dinner</span>
                    </div>
                  </div>

                  {/* 5-PERSON PRICING TIER TOGGLE */}
                  <div className="pt-3 border-t border-slate-700/60">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modelA.hasGroupPricing}
                        onChange={(e) => setModelA({ ...modelA, hasGroupPricing: e.target.checked })}
                        className="w-4 h-4 rounded-md accent-teal-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-200">
                        Enable separate 5-person group pricing tier
                      </span>
                    </label>

                    {modelA.hasGroupPricing && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                          <Users className="w-3.5 h-3.5" />
                          <span>5-Person Group Monthly Rates</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                              1 Meal / Day (5 pax)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 1700"
                              value={modelA.groupOneMealPrice}
                              onChange={(e) => setModelA({ ...modelA, groupOneMealPrice: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                              2 Meals / Day (5 pax)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 2700"
                              value={modelA.groupTwoMealsPrice}
                              onChange={(e) => setModelA({ ...modelA, groupTwoMealsPrice: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                              3 Meals / Day (5 pax)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 3500"
                              value={modelA.groupThreeMealsPrice}
                              onChange={(e) => setModelA({ ...modelA, groupThreeMealsPrice: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 text-[10.5px] mb-1">
                            Group Pricing Explanation / Basis
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Price per person when 5 students subscribe together"
                            value={modelA.groupNotes}
                            onChange={(e) => setModelA({ ...modelA, groupNotes: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MODEL B FORM: 7 MEAL COMBINATIONS */
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-purple-400" />
                      <span>Model B: Specific Meal Combinations</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Only fill offered options (₹/mo)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Single Meals */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">1. Breakfast Only (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={modelB.breakfastOnly}
                        onChange={(e) => setModelB({ ...modelB, breakfastOnly: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">2. Lunch Only (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2200"
                        value={modelB.lunchOnly}
                        onChange={(e) => setModelB({ ...modelB, lunchOnly: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">3. Dinner Only (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2200"
                        value={modelB.dinnerOnly}
                        onChange={(e) => setModelB({ ...modelB, dinnerOnly: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Dual Combinations */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">4. Breakfast + Lunch (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3000"
                        value={modelB.breakfastLunch}
                        onChange={(e) => setModelB({ ...modelB, breakfastLunch: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">5. Breakfast + Dinner (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3000"
                        value={modelB.breakfastDinner}
                        onChange={(e) => setModelB({ ...modelB, breakfastDinner: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">6. Lunch + Dinner (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3600"
                        value={modelB.lunchDinner}
                        onChange={(e) => setModelB({ ...modelB, lunchDinner: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* All Three */}
                    <div className="sm:col-span-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <label className="block text-purple-300 font-bold mb-1">
                        7. All Three Meals (Breakfast + Lunch + Dinner) (₹/mo)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 4400"
                        value={modelB.allThree}
                        onChange={(e) => setModelB({ ...modelB, allThree: e.target.value })}
                        className="w-full bg-slate-900 border border-purple-500/50 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WALK-IN SINGLE MEAL RATE */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Walk-in Single Meal Rate (₹) (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={perMealPriceFrom}
                  onChange={(e) => setPerMealPriceFrom(e.target.value)}
                  className="w-full max-w-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* INDEPENDENT MEAL TIMINGS (BREAKFAST, LUNCH, DINNER) */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Independent Meal Timings</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Leave blank if not served</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      Breakfast Timing
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7:30 AM – 9:30 AM"
                      value={timings.breakfast}
                      onChange={(e) => setTimings({ ...timings, breakfast: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      Lunch Timing
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12:30 PM – 3:00 PM"
                      value={timings.lunch}
                      onChange={(e) => setTimings({ ...timings, lunch: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[11px] font-semibold mb-1">
                      Dinner Timing
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7:30 PM – 10:00 PM"
                      value={timings.dinner}
                      onChange={(e) => setTimings({ ...timings, dinner: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* WEEKLY HOLIDAYS SELECTOR */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span>Weekly Holidays / Scheduled Offs</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeeklyHolidays([])}
                    className="text-[11px] text-teal-400 hover:underline"
                  >
                    Clear All (Open All 7 Days)
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = weeklyHolidays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleHoliday(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                            : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10.5px] text-slate-500">
                  {weeklyHolidays.length === 0
                    ? "Currently configured: Open all 7 days with zero scheduled holidays."
                    : `Closed on: ${weeklyHolidays.join(", ")}.`}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wholesome authentic home-cooked meals..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Starting from:{" "}
              <span className="font-bold text-white">
                ₹{liveStartingPrice ? liveStartingPrice.toLocaleString("en-IN") : "0"}/mo
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold shadow-md transition-all disabled:opacity-50 ${
                  isAccommodation
                    ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                    : "bg-teal-600 hover:bg-teal-500 shadow-teal-600/30"
                }`}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Listing</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
