import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Car,
  Search,
  Calendar,
  MapPin,
  Star,
  Users,
  Fuel,
  Settings,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Award,
  CheckCircle2,
} from "lucide-react";
import BookingModal from "../components/common/BookingModal";
import AISearchModal from "../components/common/AISearchModal";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search Bar State
  const [searchLocation, setSearchLocation] = useState("Madurai");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [vehicleType, setVehicleType] = useState("All");

  // Data
  const [topRated, setTopRated] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homeError, setHomeError] = useState("");
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Modals
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let isCurrent = true;
    const loadHomeData = async () => {
      setLoading(true);
      setHomeError("");
      try {
        // Top rated
        const topRes = await api.getTopRatedVehicles(6);
        if (isCurrent && topRes.success && Array.isArray(topRes.vehicles)) {
          setTopRated(topRes.vehicles);
        }

        // Recent / Featured Fleet
        const allRes = await api.getVehicles({ sort: "newest" });
        if (isCurrent && allRes.success && Array.isArray(allRes.vehicles)) {
          setRecentVehicles(allRes.vehicles.slice(0, 8));
        }

        // Recommendations if user logged in
        if (user?._id || user?.id) {
          const uid = user._id || user.id;
          const recRes = await api.getRecommendations(uid, 4).catch(() => ({}));
          if (isCurrent && recRes.success && Array.isArray(recRes.recommendations)) {
            setRecommendations(recRes.recommendations);
          }
        }
      } catch (err) {
        if (isCurrent) {
          console.error("Home load error:", err);
          setHomeError(
            err.message || "Failed to load live fleet. Please verify backend is running on port 5000."
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isCurrent = false;
    };
  }, [user?._id || user?.id, reloadTrigger]);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.append("location", searchLocation);
    if (pickupDate) params.append("pickupDate", pickupDate);
    if (returnDate) params.append("returnDate", returnDate);
    if (vehicleType && vehicleType !== "All") params.append("type", vehicleType);
    navigate(`/vehicles?${params.toString()}`);
  };

  const CATEGORIES = [
    { name: "SUV", desc: "Spacious & Powerful", count: "24+ Available" },
    { name: "Sedan", desc: "Comfort & Executive Elegance", count: "16+ Available" },
    { name: "Hatchback", desc: "Agile & Economical", count: "14+ Available" },
    { name: "MUV", desc: "7-Seater Family Cruisers", count: "10+ Available" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden pt-12 pb-24 md:pb-32">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Vehicle Rental Management</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Rent Exceptional Vehicles with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                  Total Freedom
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Discover a verified fleet of premium Indian cars, SUVs, and luxury cruisers.
                Enjoy transparent dynamic pricing, instant reservation, and 24/7 support with zero hidden fees.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>AI Vehicle Finder</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  to="/vehicles"
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 backdrop-blur-sm transition-all"
                >
                  Explore All 68+ Cars
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Verified Maintenance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Free Cancellation in 1 Hr</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Authoritative Server Pricing</span>
                </div>
              </div>
            </div>

            {/* Right Car Image Visual */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/20 to-indigo-500/20 blur-xl -z-10" />
                <img
                  src="https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/2018_Suzuki_Swift_SZ5_Boosterjet_SHVS_1.0_Front.jpg/960px-2018_Suzuki_Swift_SZ5_Boosterjet_SHVS_1.0_Front.jpg"
                  alt="Premium Rental Vehicle"
                  className="w-full h-auto max-h-[340px] object-cover rounded-2xl border border-white/10 shadow-2xl shadow-black/40"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute -bottom-4 -left-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                    <Star className="w-5 h-5 fill-teal-400 text-teal-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Top Rated Fleet</span>
                    <span className="text-[11px] text-slate-400">4.8 Average Customer Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROMINENT SEARCH & BOOKING PANEL */}
      <section className="-mt-12 relative z-20 max-w-6xl mx-auto px-4 sm:px-6">
        <form
          onSubmit={handleHeroSearch}
          className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
        >
          {/* Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Pickup Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
              <select
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium"
              >
                {["Madurai", "Chennai", "Bangalore", "Coimbatore", "Hyderabad", "Kochi", "Salem"].map(
                  (city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Pickup Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Pickup Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
              <input
                type="date"
                min={todayStr}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Return Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Return Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
              <input
                type="date"
                min={pickupDate || todayStr}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Vehicle Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Vehicle Type
            </label>
            <div className="relative">
              <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium"
              >
                <option value="All">All Categories</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="MUV">MUV</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Fleet</span>
            </button>
          </div>
        </form>
      </section>

      {/* 3. POPULAR CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Browse by Category
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Popular Vehicle Categories
            </h2>
          </div>
          <Link
            to="/vehicles"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 mt-2 md:mt-0"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/vehicles?type=${cat.name}`}
              className="group p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-900/5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-teal-700 transition-colors">
                <span>{cat.count}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PERSONALIZED RECOMMENDATIONS (IF AVAILABLE) */}
      {recommendations.length > 0 && (
        <section className="bg-teal-50/50 py-16 border-y border-teal-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Tailored for You
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Recommended Vehicles
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generated via collaborative filtering based on customers with similar rental preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={
                        vehicle.image ||
                        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={vehicle.name}
                      className="w-full h-40 object-cover border-b border-slate-100"
                    />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          {vehicle.brand}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{vehicle.rating || 4.5}</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {vehicle.name}
                      </h4>
                      <p className="text-[11px] text-teal-700 font-medium">
                        {vehicle.recommendationReason}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{Number(vehicle.pricePerDay || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-slate-400"> / day</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleForBooking(vehicle)}
                      className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. TOP-RATED & FEATURED FLEET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Customer Favorites
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Top Rated Vehicles
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Highest satisfaction ratings verified from completed customer rentals.
            </p>
          </div>
          <Link
            to="/vehicles?sort=rating_desc"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 mt-2 md:mt-0"
          >
            <span>View All Top Rated</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topRated.map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400/80 hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="relative">
                  <img
                    src={
                      vehicle.image ||
                      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80"
                    }
                    alt={vehicle.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-900 shadow flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{vehicle.rating || 4.0}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded text-[11px] font-semibold text-white">
                    {vehicle.type}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                      {vehicle.brand}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {vehicle.name}
                    </h3>
                  </div>

                  {/* Specifications snippet */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-slate-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vehicle.seats || 5} Seats</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vehicle.fuel || "Petrol"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vehicle.transmission || "Manual"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & CTA */}
              <div className="p-5 pt-0 flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-slate-900">
                    ₹{Number(vehicle.pricePerDay || vehicle.price || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-400"> / day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/vehicles/${vehicle._id}`}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleForBooking(vehicle)}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. HOW IT WORKS (RENTAL PROCESS) */}
      <section id="how-it-works" className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Seamless 4-Step Process
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">
              How SmartRent Works
            </h2>
            <p className="text-sm text-slate-400">
              Experience the easiest vehicle rental workflow designed for Indian roads and travel requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Choose Vehicle",
                desc: "Browse our 68+ verified fleet by brand, seats, fuel, or ask our intelligent AI search.",
              },
              {
                step: "02",
                title: "Select Dates & City",
                desc: "Pick your preferred pickup and return dates with supported hubs across major Indian cities.",
              },
              {
                step: "03",
                title: "Instant Confirmation",
                desc: "Receive authoritative pricing breakdown and instant booking reference ID with zero wait.",
              },
              {
                step: "04",
                title: "Drive with Freedom",
                desc: "Enjoy your journey with 24/7 roadside assistance, sanitized interiors, and flexible return rules.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3"
              >
                <div className="text-3xl font-black text-teal-400/30">{item.step}</div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS & TRUST INDICATORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Real Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Loved by Thousands of Drivers
          </h2>
          <p className="text-xs text-slate-500">
            Read what our customers say about renting with SmartRent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Arun Kumar",
              location: "Madurai, Tamil Nadu",
              comment:
                "Booked the Maruti Swift Dzire for a 3-day family trip to Kodaikanal. The pickup process was completely frictionless, the vehicle was spotless, and the dynamic rate was very affordable.",
              rating: 5,
              vehicle: "Maruti Suzuki Swift Dzire",
            },
            {
              name: "Nagalakshmi S.",
              location: "Chennai, Tamil Nadu",
              comment:
                "SmartRent's AI search feature is genuinely helpful. I asked for a 7-seater diesel car for a group trip, and it immediately matched the Mahindra XUV700. Loved the transparent pricing!",
              rating: 5,
              vehicle: "Mahindra XUV700",
            },
            {
              name: "Pandi Kumar",
              location: "Bangalore, Karnataka",
              comment:
                "The 1-hour cancellation policy gave me peace of mind when my schedule changed. Returned the car on time with zero fuss. Will definitely recommend SmartRent to my colleagues.",
              rating: 5,
              vehicle: "Tata Nexon",
            },
          ].map((rev, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(rev.rating)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{rev.name}</h4>
                  <span className="text-[11px] text-slate-400">{rev.location}</span>
                </div>
                <span className="text-[10px] font-semibold text-teal-700 px-2 py-0.5 rounded bg-teal-50">
                  {rev.vehicle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {selectedVehicleForBooking && (
        <BookingModal
          vehicle={selectedVehicleForBooking}
          isOpen={Boolean(selectedVehicleForBooking)}
          onClose={() => setSelectedVehicleForBooking(null)}
          initialDates={{ pickupDate, returnDate }}
        />
      )}

      {/* AI Search Modal */}
      {aiModalOpen && (
        <AISearchModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onSelectVehicle={(v) => {
            setAiModalOpen(false);
            setSelectedVehicleForBooking(v);
          }}
        />
      )}
    </div>
  );
}
