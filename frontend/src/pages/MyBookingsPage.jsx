import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  CalendarDays,
  MapPin,
  Clock,
  Car,
  AlertTriangle,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  User,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export default function MyBookingsPage() {
  const { user, openLogin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All"); // All | Active | Completed | Cancelled
  const [cancellingId, setCancellingId] = useState("");
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [savingRatingId, setSavingRatingId] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const uid = user._id || user.id;
        const res = await api.getUserBookings(uid);
        if (res.success && Array.isArray(res.bookings)) {
          setBookings(res.bookings);
        }
      } catch (err) {
        toast.error("Failed to load your bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, toast]);

  // Tab Filtering
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "All") return true;
    if (activeTab === "Active") return ["Pending", "Confirmed", "Rented"].includes(b.status);
    if (activeTab === "Completed") return ["Returned", "Completed"].includes(b.status);
    if (activeTab === "Cancelled") return b.status === "Cancelled";
    return true;
  });

  // 1-Hour cancellation check
  const isCancellable = (booking) => {
    if (!["Pending", "Confirmed"].includes(booking.status)) return false;
    const createdAt = new Date(booking.createdAt).getTime();
    const elapsed = Date.now() - createdAt;
    return elapsed <= 60 * 60 * 1000;
  };

  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      const uid = user._id || user.id;
      const res = await api.cancelBooking(bookingId, uid);
      if (res.success) {
        toast.success("Booking cancelled successfully.");
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: "Cancelled" } : b))
        );
      } else {
        toast.error(res.message || "Unable to cancel booking.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to cancel booking.");
    } finally {
      setCancellingId("");
    }
  };

  const handleRatingSubmit = async (bookingId, vehicleId) => {
    const ratingValue = ratingDrafts[bookingId];
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      toast.warning("Please select a rating between 1 and 5 stars.");
      return;
    }

    setSavingRatingId(bookingId);
    try {
      const uid = user._id || user.id;
      const res = await api.submitRating(vehicleId, uid, ratingValue);
      if (res.success) {
        toast.success("Thank you! Your rating has been recorded.");
        setRatingDrafts((prev) => ({ ...prev, [bookingId]: ratingValue }));
      } else {
        toast.error(res.message || "Could not submit rating.");
      }
    } catch (err) {
      toast.error(err.message || "Unable to submit rating.");
    } finally {
      setSavingRatingId("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Sign in to view your bookings</h2>
          <p className="text-xs text-slate-500">
            Please log in with your customer account to access active bookings, completed rental receipts, and vehicle ratings.
          </p>
          <button
            onClick={openLogin}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending Confirmation</span>;
      case "Confirmed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Confirmed</span>;
      case "Rented":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">Currently On Trip</span>;
      case "Returned":
      case "Completed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed & Returned</span>;
      case "Cancelled":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Customer Profile Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-teal-700 text-white font-black text-xl flex items-center justify-center uppercase shadow-md">
              {user.name ? user.name[0] : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Customer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs text-slate-600">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rentals</span>
              <span className="text-base font-extrabold text-slate-900">{bookings.length}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Now</span>
              <span className="text-base font-extrabold text-teal-700">
                {bookings.filter((b) => ["Pending", "Confirmed", "Rented"].includes(b.status)).length}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed</span>
              <span className="text-base font-extrabold text-emerald-700">
                {bookings.filter((b) => ["Returned", "Completed"].includes(b.status)).length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-200">
          {["All", "Active", "Completed", "Cancelled"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab
                  ? "border-teal-600 text-teal-700 bg-white rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab} Bookings
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Loading rental history...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No {activeTab.toLowerCase()} bookings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ready for your next journey? Browse our verified fleet and reserve your preferred car.
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              <span>Explore Available Fleet</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const v = b.vehicle || {};
              const cancellable = isCancellable(b);

              return (
                <div
                  key={b._id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Vehicle Info & Image */}
                    <div className="flex items-start gap-4">
                      <img
                        src={v.image || "https://placehold.co/300x200/e2e8f0/334155?text=Car"}
                        alt={v.name || "Vehicle"}
                        className="w-24 h-16 sm:w-28 sm:h-20 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                            {v.brand || "SmartRent"}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400 font-mono">ID: {b._id}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {v.brand} {v.name || "Rental Vehicle"}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            {b.location}
                          </span>
                          <span>•</span>
                          <span>{b.totalDays} Day(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Dates & Status Badge */}
                    <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 text-right">
                      <div>{getStatusBadge(b.status)}</div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {new Date(b.pickupDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>{" "}
                        →{" "}
                        <span className="font-semibold text-slate-900">
                          {new Date(b.returnDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown & Actions Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Rental Amount</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {Number(b.fineAmount) > 0 && (
                        <div className="p-1.5 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Late fine: ₹{b.fineAmount} ({b.lateDays} days)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Rating submission for returned cars */}
                      {["Returned", "Completed"].includes(b.status) && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1.5 px-3 rounded-xl">
                          <span className="text-[11px] font-semibold text-slate-600">Rate trip:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingDrafts((prev) => ({ ...prev, [b._id]: star }))}
                                className="p-0.5 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    (ratingDrafts[b._id] || 0) >= star
                                      ? "fill-amber-400 text-amber-500"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            disabled={savingRatingId === b._id || !ratingDrafts[b._id]}
                            onClick={() => handleRatingSubmit(b._id, v._id || b.vehicle)}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-800 disabled:opacity-40 ml-1"
                          >
                            {savingRatingId === b._id ? "Saving..." : "Submit"}
                          </button>
                        </div>
                      )}

                      {/* Cancel Button */}
                      {cancellable && (
                        <button
                          type="button"
                          disabled={cancellingId === b._id}
                          onClick={() => handleCancelBooking(b._id)}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {cancellingId === b._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}

                      <Link
                        to={`/vehicles/${v._id || b.vehicle}`}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Vehicle Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
