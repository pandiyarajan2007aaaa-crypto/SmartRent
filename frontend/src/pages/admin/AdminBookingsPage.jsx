import React, { useState, useEffect, useMemo } from "react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Loader2,
  User,
  Car,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function AdminBookingsPage() {
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Status updating state
  const [updatingId, setUpdatingId] = useState("");
  const [statusDrafts, setStatusDrafts] = useState({});

  // Deletion state
  const [deletingId, setDeletingId] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminBookings();
      if (res.success && Array.isArray(res.bookings)) {
        setBookings(res.bookings);
      }
    } catch (err) {
      toast.error("Failed to fetch admin bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        search.trim() === "" ||
        b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        b.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b._id?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "All" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [filteredBookings, currentPage]);

  const handleUpdateStatus = async (bookingId) => {
    const newStatus = statusDrafts[bookingId];
    if (!newStatus) return;

    setUpdatingId(bookingId);
    try {
      const res = await api.updateBookingStatus(bookingId, newStatus);
      if (res.success && res.booking) {
        toast.success(`Booking status changed to ${newStatus}`);
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? res.booking : b))
        );
      } else {
        toast.error(res.message || "Failed to update status.");
      }
    } catch (err) {
      toast.error(err.message || "Status update failed.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    setDeletingId(bookingId);
    try {
      const res = await api.deleteAdminBooking(bookingId);
      if (res.success) {
        toast.success("Booking record removed successfully.");
        setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      } else {
        toast.error(res.message || "Unable to delete booking.");
      }
    } catch (err) {
      toast.error(err.message || "Delete booking failed.");
    } finally {
      setDeletingId("");
    }
  };

  const STATUS_LIST = [
    "Pending",
    "Confirmed",
    "Rented",
    "Returned",
    "Completed",
    "Cancelled",
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Booking Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            Customer Reservation Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirm pending requests, mark active vehicle returns, assess late fines, and manage booking lifecycle.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBookings}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, email, car, or booking ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none font-semibold text-slate-700"
          >
            <option value="All">All Statuses ({bookings.length})</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s} ({bookings.filter((b) => b.status === s).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Pickup & Return</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Current Status</th>
                <th className="py-3 px-3">Change Status</th>
                <th className="py-3 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                    <span>Loading bookings...</span>
                  </td>
                </tr>
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No bookings found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => {
                  const isClosed = ["Completed", "Returned", "Cancelled"].includes(b.status);

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b._id.slice(-6)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{b.user?.name || "Customer"}</span>
                        <span className="text-[10px] text-slate-400">{b.user?.email}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {b.vehicle?.brand} {b.vehicle?.name || "Car"}
                        </span>
                        <span className="text-[10px] text-slate-400">{b.vehicle?.type}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="font-medium">
                          {new Date(b.pickupDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} →{" "}
                          {new Date(b.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                        <span className="text-[10px] text-slate-400">{b.totalDays} Day(s)</span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">{b.location}</td>
                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-slate-900 block">
                          ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                        </span>
                        {Number(b.fineAmount) > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            +₹{b.fineAmount} Fine
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : b.status === "Confirmed"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : b.status === "Rented"
                              ? "bg-teal-50 text-teal-800 border border-teal-200"
                              : b.status === "Returned" || b.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {!isClosed ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={statusDrafts[b._id] || b.status}
                              onChange={(e) =>
                                setStatusDrafts({ ...statusDrafts, [b._id]: e.target.value })
                              }
                              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
                            >
                              {STATUS_LIST.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            {statusDrafts[b._id] && statusDrafts[b._id] !== b.status && (
                              <button
                                type="button"
                                disabled={updatingId === b._id}
                                onClick={() => handleUpdateStatus(b._id)}
                                className="px-2.5 py-1 bg-teal-600 text-white font-bold text-[10px] rounded-lg shadow-sm"
                              >
                                {updatingId === b._id ? "..." : "Save"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Closed</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={deletingId === b._id}
                          onClick={() => handleDeleteBooking(b._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete booking record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {currentPage} of {totalPages} ({filteredBookings.length} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
