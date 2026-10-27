import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Car,
  Calendar,
  MapPin,
  Star,
  Users,
  Fuel,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Gauge,
  Briefcase,
  Zap,
  Info,
} from "lucide-react";
import BookingModal from "../components/common/BookingModal";

export default function VehicleDetailsPage() {
  const { id } = useParams();
  const { user, openLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Direct Inline Booking Form State
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [location, setLocation] = useState("Madurai");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getVehicleById(id);
        if (data.success && data.vehicle) {
          setVehicle(data.vehicle);
          setRatings(Array.isArray(data.ratings) ? data.ratings : []);
        } else {
          setError(data.message || "Vehicle not found.");
        }
      } catch (err) {
        setError(err.message || "Failed to load vehicle details. Please check the URL.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  // Duration & price calculation
  let durationDays = 0;
  let estimatedTotal = 0;
  if (pickupDate && returnDate) {
    const p = new Date(pickupDate);
    const r = new Date(returnDate);
    if (!isNaN(p.getTime()) && !isNaN(r.getTime()) && r > p) {
      durationDays = Math.max(1, Math.ceil((r - p) / (1000 * 60 * 60 * 24)));
      estimatedTotal = durationDays * Number(vehicle?.pricePerDay || 0);
    }
  }

  const handleBookNow = () => {
    if (!user) {
      openLogin();
      return;
    }
    setBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-xs font-semibold text-slate-500">Loading vehicle specifications...</span>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Vehicle Not Found</h2>
        <p className="text-xs text-slate-500">{error || "The vehicle you requested does not exist or has been retired."}</p>
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Catalog</span>
        </Link>
      </div>
    );
  }

  const featuresList = [
    "Anti-Lock Braking System (ABS)",
    "Air Conditioning with Climate Control",
    "Dual Front Airbags",
    "Bluetooth & Audio Streaming",
    "Power Windows & Steering",
    "Reverse Parking Sensors",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Vehicles</span>
          </Link>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              vehicle.available
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {vehicle.available ? "● Available for Rent" : "● Currently In Rental"}
          </span>
        </div>

        {/* Vehicle Header & Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Images, Specs, Details, Reviews) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Main Visual Photo */}
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
              <img
                src={
                  vehicle.image ||
                  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80"
                }
                alt={vehicle.name}
                className="w-full h-[360px] sm:h-[420px] object-cover"
              />
            </div>

            {/* Title, Brand, Rating */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                    {vehicle.brand} {vehicle.modelYear ? `• ${vehicle.modelYear}` : ""}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                    {vehicle.brand} {vehicle.name}
                  </h1>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/70 px-3 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="text-sm font-bold text-amber-900">{vehicle.rating || 4.0}</span>
                  <span className="text-xs text-amber-700">
                    ({vehicle.reviewCount || ratings.length || 0} reviews)
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {vehicle.description ||
                  `The ${vehicle.brand} ${vehicle.name} is a high-performance ${vehicle.type} built for reliability, comfort, and efficiency. Maintained according to strict manufacturer standards with comprehensive sanitation before every customer handover.`}
              </p>

              {/* Technical Specifications Grid */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                  Vehicle Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Car className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Body Type</span>
                      <span className="text-xs font-bold text-slate-800">{vehicle.type}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Users className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capacity</span>
                      <span className="text-xs font-bold text-slate-800">{vehicle.seats || 5} Passenger Seats</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fuel Type</span>
                      <span className="text-xs font-bold text-slate-800">{vehicle.fuel || "Petrol"}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Settings className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Transmission</span>
                      <span className="text-xs font-bold text-slate-800">{vehicle.transmission || "Manual"}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mileage</span>
                      <span className="text-xs font-bold text-slate-800">{vehicle.mileage || "Not specified"}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Luggage Space</span>
                      <span className="text-xs font-bold text-slate-800">{vehicle.luggageCapacity || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard Equipment */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                  Included Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  {featuresList.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Verified Customer Reviews</h3>
                  <p className="text-xs text-slate-500">Ratings from drivers who completed rentals for this car.</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">{vehicle.rating || 4.0}</span>
                  <span className="text-xs text-slate-400"> / 5.0</span>
                </div>
              </div>

              {ratings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No written reviews yet. Rent this vehicle and share your rating upon return!
                </div>
              ) : (
                <div className="space-y-3">
                  {ratings.map((r) => (
                    <div key={r._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-800">{r.user?.name || "Verified Customer"}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(r.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Quick Booking Widget */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-lg space-y-5">
              {/* Daily Rate Banner */}
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Daily Rental Rate</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-slate-900">
                      ₹{Number(vehicle.pricePerDay || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ day</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  Dynamic Value
                </span>
              </div>

              {/* Booking Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium"
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

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
                    <input
                      type="date"
                      min={todayStr}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Return Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
                    <input
                      type="date"
                      min={pickupDate || todayStr}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Price Breakdown Estimation */}
              {durationDays > 0 ? (
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Duration</span>
                    <span className="font-bold text-slate-900">{durationDays} Day{durationDays > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Rate Calculation</span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(vehicle.pricePerDay).toLocaleString("en-IN")} × {durationDays}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-teal-200">
                    <span>Estimated Total</span>
                    <span className="text-teal-800">₹{estimatedTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[10px] text-teal-700 italic">
                    * Authoritative rate confirmed on server with dynamic demand updates.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  Select dates to see price breakdown
                </div>
              )}

              {/* Book Now Button */}
              <button
                type="button"
                onClick={handleBookNow}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Book This Vehicle</span>
              </button>

              {/* Rental Policy Assurance */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Free cancellation within 1 hour of booking.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Standard ₹100/day fine applies on late returns.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <BookingModal
          vehicle={vehicle}
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          initialDates={{ pickupDate, returnDate }}
        />
      )}
    </div>
  );
}
