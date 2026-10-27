import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  X,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";

export default function BookingModal({ vehicle, isOpen, onClose, initialDates = {} }) {
  const { user, openLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [location, setLocation] = useState("Madurai");
  const [customLocation, setCustomLocation] = useState("");
  const [pickupDate, setPickupDate] = useState(initialDates.pickupDate || "");
  const [returnDate, setReturnDate] = useState(initialDates.returnDate || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Set today's date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (initialDates.pickupDate) setPickupDate(initialDates.pickupDate);
    if (initialDates.returnDate) setReturnDate(initialDates.returnDate);
  }, [initialDates]);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setBookingSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen || !vehicle) return null;

  // Calculate estimated days & price
  let estimatedDays = 0;
  let estimatedTotal = 0;
  if (pickupDate && returnDate) {
    const p = new Date(pickupDate);
    const r = new Date(returnDate);
    if (!isNaN(p.getTime()) && !isNaN(r.getTime()) && r > p) {
      estimatedDays = Math.max(1, Math.ceil((r - p) / (1000 * 60 * 60 * 24)));
      estimatedTotal = estimatedDays * Number(vehicle.pricePerDay || vehicle.price || 0);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onClose();
      openLogin();
      return;
    }

    const finalLocation = location === "Other" ? customLocation.trim() : location;
    if (!finalLocation) {
      setError("Please select or enter a pickup location.");
      return;
    }

    if (!pickupDate || !returnDate) {
      setError("Please select both pickup and return dates.");
      return;
    }

    const p = new Date(pickupDate);
    const r = new Date(returnDate);
    if (r <= p) {
      setError("Return date must be strictly after pickup date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        userId: user._id || user.id,
        vehicleId: vehicle._id || vehicle.id,
        pickupDate,
        returnDate,
        location: finalLocation,
      };

      const res = await api.createBooking(payload);
      if (res.success && res.booking) {
        setBookingSuccess({
          booking: res.booking,
          pricing: res.pricing,
        });
        toast.success("Booking confirmed successfully!");
      } else {
        setError(res.message || "Failed to book vehicle.");
      }
    } catch (err) {
      setError(err.message || "Vehicle booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const LOCATIONS = [
    "Madurai",
    "Chennai",
    "Bangalore",
    "Coimbatore",
    "Hyderabad",
    "Kochi",
    "Salem",
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Vehicle Booking
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {vehicle.brand} {vehicle.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {bookingSuccess ? (
          <div className="p-6 overflow-y-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900">Booking Confirmed!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your reservation reference ID has been created in SmartRent system.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Booking ID</span>
                <span className="font-mono font-bold text-slate-900">
                  {bookingSuccess.booking._id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Vehicle</span>
                <span className="font-semibold text-slate-900">
                  {vehicle.brand} {vehicle.name} ({vehicle.type})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Pickup & Return</span>
                <span className="font-semibold text-slate-900">
                  {new Date(bookingSuccess.booking.pickupDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  →{" "}
                  {new Date(bookingSuccess.booking.returnDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Location</span>
                <span className="font-semibold text-slate-900">
                  {bookingSuccess.booking.location}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Duration</span>
                <span className="font-semibold text-slate-900">
                  {bookingSuccess.booking.totalDays} Day(s)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold pt-3 border-t border-slate-200">
                <span className="text-slate-900">Confirmed Total Amount</span>
                <span className="text-teal-700 text-base">
                  ₹{Number(bookingSuccess.booking.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>

              {bookingSuccess.pricing?.pricingType &&
                bookingSuccess.pricing.pricingType !== "Normal Price" && (
                  <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
                    {bookingSuccess.pricing.pricingType.includes("High Demand") ? (
                      <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>Dynamic Pricing Applied: {bookingSuccess.pricing.pricingType}</span>
                  </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/my-bookings");
                }}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Go to My Bookings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {/* Vehicle quick info */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <img
                src={vehicle.image || "https://placehold.co/400x250/e2e8f0/334155?text=Vehicle"}
                alt={vehicle.name}
                className="w-20 h-14 object-cover rounded-lg border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {vehicle.brand} {vehicle.name}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {vehicle.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Base Rate:{" "}
                  <span className="font-bold text-slate-900">
                    ₹{Number(vehicle.pricePerDay || vehicle.price || 0).toLocaleString("en-IN")}
                  </span>{" "}
                  / day
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Pickup & Return Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              {location === "Other" && (
                <input
                  type="text"
                  placeholder="Enter city or hub name"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full mt-2 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
                  required
                />
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Pickup Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    min={todayStr}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    min={pickupDate || todayStr}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            {estimatedDays > 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Rental Duration</span>
                  <span className="font-semibold text-slate-900">
                    {estimatedDays} Day{estimatedDays > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Base Rate</span>
                  <span className="font-semibold text-slate-900">
                    ₹{Number(vehicle.pricePerDay || vehicle.price || 0).toLocaleString("en-IN")} × {estimatedDays}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="text-teal-700">₹{estimatedTotal.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1">
                  * Final price is calculated authoritative on the server based on current dynamic demand conditions.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Select valid pickup and return dates to calculate duration and price.
              </div>
            )}

            {/* Rental policy note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Free cancellation within 1 hour. No hidden reservation fees.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || estimatedDays <= 0}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>Confirm Reservation</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
