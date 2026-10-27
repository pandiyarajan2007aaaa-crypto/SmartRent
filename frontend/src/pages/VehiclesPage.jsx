import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Search,
  Filter,
  Car,
  Users,
  Fuel,
  Settings,
  Star,
  Sparkles,
  RotateCcw,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import BookingModal from "../components/common/BookingModal";
import AISearchModal from "../components/common/AISearchModal";

export default function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters from URL or state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("type") || "All");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "All");
  const [selectedFuel, setSelectedFuel] = useState(searchParams.get("fuel") || "All");
  const [selectedTransmission, setSelectedTransmission] = useState(
    searchParams.get("transmission") || "All"
  );
  const [minSeats, setMinSeats] = useState(searchParams.get("seats") || "All");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [pickupDate, setPickupDate] = useState(searchParams.get("pickupDate") || "");
  const [returnDate, setReturnDate] = useState(searchParams.get("returnDate") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name_asc");

  // State
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Modals
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Fetch vehicles whenever filter state changes
  useEffect(() => {
    let isCurrent = true;
    const fetchVehicles = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const query = {
          search: searchQuery,
          type: selectedCategory !== "All" ? selectedCategory : undefined,
          brand: selectedBrand !== "All" ? selectedBrand : undefined,
          fuel: selectedFuel !== "All" ? selectedFuel : undefined,
          transmission: selectedTransmission !== "All" ? selectedTransmission : undefined,
          seats: minSeats !== "All" ? minSeats : undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          pickupDate: pickupDate || undefined,
          returnDate: returnDate || undefined,
          sort: sortBy,
        };

        const res = await api.getVehicles(query);
        if (isCurrent && res && res.success && Array.isArray(res.vehicles)) {
          setVehicles(res.vehicles);
        } else if (isCurrent) {
          setFetchError(res?.message || "Failed to load vehicles from database.");
        }
      } catch (err) {
        if (isCurrent) {
          console.error("Vehicles fetch error:", err);
          setFetchError(
            err.message ||
              "Unable to load vehicle catalogue. Please ensure the backend server is running on port 5000."
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();
    setCurrentPage(1);

    return () => {
      isCurrent = false;
    };
  }, [
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedFuel,
    selectedTransmission,
    minSeats,
    minPrice,
    maxPrice,
    pickupDate,
    returnDate,
    sortBy,
    reloadKey,
  ]);

  // Extract unique brands for filter dropdown
  const uniqueBrands = useMemo(() => {
    const brands = new Set();
    vehicles.forEach((v) => {
      if (v.brand) brands.add(v.brand);
    });
    return ["All", ...Array.from(brands).sort()];
  }, [vehicles]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedBrand("All");
    setSelectedFuel("All");
    setSelectedTransmission("All");
    setMinSeats("All");
    setMinPrice("");
    setMaxPrice("");
    setPickupDate("");
    setReturnDate("");
    setSortBy("name_asc");
    setSearchParams({});
  };

  // Pagination calculation
  const totalPages = Math.ceil(vehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return vehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [vehicles, currentPage]);

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== "All",
    selectedBrand !== "All",
    selectedFuel !== "All",
    selectedTransmission !== "All",
    minSeats !== "All",
    minPrice,
    maxPrice,
    pickupDate,
    returnDate,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Fleet Catalog
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Vehicle Search & Reservations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Filter by category, price, seat count, and date availability across all Indian hubs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 hover:opacity-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>AI Search Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <span>Filters ({activeFiltersCount})</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout (Sidebar + Vehicle Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar (Desktop & Mobile Drawer) */}
          <aside
            className={`lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 lg:block ${
              mobileFilterOpen ? "block fixed inset-4 z-50 overflow-y-auto" : "hidden"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Filter className="w-4 h-4 text-teal-600" />
                <span>Filters & Options</span>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="lg:hidden p-1 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Keyword / Brand
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Swift, Nexon, Creta"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            {/* Category / Body Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Body Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
              >
                <option value="All">All Categories</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="MUV">MUV</option>
              </select>
            </div>

            {/* Seating Capacity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Seats
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {["All", "4", "5", "7"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setMinSeats(s)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      minSeats === s
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {s === "All" ? "Any" : `${s}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Fuel Type
              </label>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
              >
                <option value="All">All Fuels</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric (EV)</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Transmission
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {["All", "Manual", "Automatic"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTransmission(t)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selectedTransmission === t
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t === "All" ? "Any" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Daily Price (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min (₹)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Max (₹)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            {/* Date Availability Range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Check Dates Availability
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
                <input
                  type="date"
                  value={returnDate}
                  min={pickupDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </aside>

          {/* Vehicles Results Section */}
          <main className="lg:col-span-3 space-y-6">
            {/* Top Toolbar: Matching Count + Sort By */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Matching Fleet:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                  {vehicles.length} Vehicle{vehicles.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-44 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-semibold text-slate-700"
                >
                  <option value="name_asc">Name (A to Z)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Highest Rated</option>
                  <option value="popularity">Most Popular</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>
            </div>

            {/* Vehicle Grid */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <span className="text-xs font-semibold">Loading live vehicles from MongoDB...</span>
              </div>
            ) : fetchError ? (
              <div className="py-16 text-center bg-rose-50/60 rounded-2xl border border-rose-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Connection Failed</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  {fetchError}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
                <Car className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No vehicles match your criteria</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try clearing some filters, expanding your budget range, or using the AI Search assistant.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedVehicles.map((vehicle) => (
                  <div
                    key={vehicle._id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="relative">
                        <img
                          src={
                            vehicle.image ||
                            "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80"
                          }
                          alt={vehicle.name}
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-900 shadow flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{vehicle.rating || 4.0}</span>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                          {vehicle.type}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                            {vehicle.brand}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {vehicle.name}
                          </h3>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-3 gap-1 py-2 border-y border-slate-100 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {vehicle.seats || 5} Seats
                          </span>
                          <span className="flex items-center gap-1">
                            <Fuel className="w-3 h-3 text-slate-400" />
                            {vehicle.fuel || "Petrol"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Settings className="w-3 h-3 text-slate-400" />
                            {vehicle.transmission || "Manual"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-4 pt-0 flex items-center justify-between">
                      <div>
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{Number(vehicle.pricePerDay || vehicle.price || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-400"> / day</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/vehicles/${vehicle._id}`}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => setBookingVehicle(vehicle)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, vehicles.length)} of {vehicles.length} cars
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingVehicle && (
        <BookingModal
          vehicle={bookingVehicle}
          isOpen={Boolean(bookingVehicle)}
          onClose={() => setBookingVehicle(null)}
          initialDates={{ pickupDate, returnDate }}
        />
      )}

      {/* AI Search Assistant Modal */}
      {aiModalOpen && (
        <AISearchModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onSelectVehicle={(v) => {
            setAiModalOpen(false);
            setBookingVehicle(v);
          }}
        />
      )}
    </div>
  );
}
