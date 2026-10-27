import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Car,
  Users,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function AdminOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardOverview();
      if (res.success && res.dashboard) {
        setData(res.dashboard);
      }
    } catch (err) {
      toast.error("Failed to load dashboard overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-xs font-semibold">Loading system dashboard...</span>
      </div>
    );
  }

  const d = data || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SmartRent Core Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Fleet Operations & Performance
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Monitor real-time rental fleet availability, track customer reservations, and review recognized revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/analytics"
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
          >
            <span>Weekly & Monthly Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Fleet</span>
            <Car className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 block">{d.totalVehicles ?? 0}</span>
            <span className="text-xs text-slate-400">
              {d.availableVehicles ?? 0} Available • {d.rentedVehicles ?? 0} Currently Rented
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-3xl font-black text-teal-700 block">
              ₹{Number(d.totalRevenue ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-slate-400">From completed & returned rentals</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bookings</span>
            <CalendarDays className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 block">{d.totalBookings ?? 0}</span>
            <span className="text-xs text-slate-400">
              {d.completedBookings ?? 0} Completed • {d.cancelledBookings ?? 0} Cancelled
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Customers</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 block">{d.totalCustomers ?? 0}</span>
            <span className="text-xs text-slate-400">Active customer accounts</span>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/vehicles"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 shadow-sm hover:shadow transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase text-teal-700">Fleet Control</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Manage All 68+ Vehicles</h4>
            <p className="text-xs text-slate-400 mt-1">Add cars, update daily rates & toggle availability</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/bookings"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 shadow-sm hover:shadow transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase text-teal-700">Booking Engine</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Process Reservations</h4>
            <p className="text-xs text-slate-400 mt-1">Approve bookings, mark returns & calculate late fees</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/admin/analytics"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 shadow-sm hover:shadow transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold uppercase text-teal-700">BI Analytics</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Weekly & Monthly Metrics</h4>
            <p className="text-xs text-slate-400 mt-1">Interactive Recharts, vehicle ranking & CSV exports</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Live Feed
            </span>
            <h3 className="text-base font-bold text-slate-900">Recent Customer Bookings</h3>
          </div>
          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Vehicle</th>
                <th className="pb-3 px-3">Rental Dates</th>
                <th className="pb-3 px-3">Total Amount</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Booked On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.recentBookings && d.recentBookings.length > 0 ? (
                d.recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{b.user?.name || "Customer"}</span>
                      <span className="text-[10px] text-slate-400">{b.user?.email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {b.vehicle?.brand} {b.vehicle?.name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {new Date(b.pickupDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} →{" "}
                      {new Date(b.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === "Pending"
                            ? "bg-amber-50 text-amber-700"
                            : b.status === "Confirmed"
                            ? "bg-indigo-50 text-indigo-700"
                            : b.status === "Returned" || b.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {new Date(b.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No recent booking records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
