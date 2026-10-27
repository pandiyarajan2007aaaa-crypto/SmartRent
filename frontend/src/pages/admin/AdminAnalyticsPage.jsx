import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  DollarSign,
  Award,
  Star,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const toast = useToast();

  // Period Filter State
  const [period, setPeriod] = useState("last30days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Vehicle Performance Sorting
  const [perfSort, setPerfSort] = useState("revenue"); // revenue | bookingsCount | rating | utilizationRate
  const [perfOrder, setPerfOrder] = useState("desc");

  // Analytics Data States
  const [analytics, setAnalytics] = useState(null);
  const [vehiclePerf, setVehiclePerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfLoading, setPerfLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Fetch Analytics Data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(
        period,
        period === "custom" ? customStart : "",
        period === "custom" ? customEnd : ""
      );
      if (data.success) {
        setAnalytics(data);
      } else {
        toast.error(data.message || "Unable to load business analytics.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to load analytics engine.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Vehicle Performance Data
  const fetchVehiclePerfData = async () => {
    setPerfLoading(true);
    try {
      const data = await api.getVehiclePerformance(period, {
        startDate: period === "custom" ? customStart : "",
        endDate: period === "custom" ? customEnd : "",
        sort: perfSort,
        order: perfOrder,
      });
      if (data.success) {
        setVehiclePerf(data);
      }
    } catch (err) {
      console.error("Perf fetch error:", err);
    } finally {
      setPerfLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    fetchVehiclePerfData();
  }, [period]);

  useEffect(() => {
    fetchVehiclePerfData();
  }, [perfSort, perfOrder]);

  // Handle Export CSV
  const handleExportCSV = async (type = "bookings") => {
    setExporting(true);
    try {
      const csvData = await api.exportCSV(
        period,
        type,
        period === "custom" ? customStart : "",
        period === "custom" ? customEnd : ""
      );

      // Trigger browser download
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `SmartRent_${type === "vehicles" ? "Vehicle_Performance" : "Bookings"}_${period}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${type === "vehicles" ? "Vehicle analytics" : "Bookings"} CSV exported successfully.`);
    } catch (err) {
      toast.error("Failed to export report CSV.");
    } finally {
      setExporting(false);
    }
  };

  // Safe KPI Percentage Change Formatter
  const renderPercentageBadge = (pct) => {
    if (pct === null || pct === undefined) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
          N/A
        </span>
      );
    }
    const isPositive = pct >= 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
          isPositive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}
      >
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span>{Math.abs(pct)}%</span>
      </span>
    );
  };

  const PERIOD_OPTIONS = [
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Week", value: "thisweek" },
    { label: "Previous Week", value: "lastweek" },
    { label: "This Month", value: "thismonth" },
    { label: "Previous Month", value: "lastmonth" },
    { label: "Current Quarter", value: "thisquarter" },
    { label: "Current Year", value: "thisyear" },
    { label: "Custom Dates", value: "custom" },
  ];

  const STATUS_COLORS = {
    Completed: "#059669",
    Returned: "#0d9488",
    Confirmed: "#2563eb",
    Pending: "#d97706",
    Rented: "#0284c7",
    Cancelled: "#e11d48",
  };

  const kpis = analytics?.kpi;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Toolbar & Period Filters */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                Executive Reporting Suite
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Live Data
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              Weekly & Monthly Business Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Reporting Timezone: Indian Standard Time (IST / UTC+5:30) • Inclusive date boundaries
            </p>
          </div>

          {/* Export & Refresh Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleExportCSV("bookings")}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Bookings CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportCSV("vehicles")}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Vehicle Performance CSV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                fetchAnalyticsData();
                fetchVehiclePerfData();
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === opt.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        {period === "custom" && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Start Date:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">End Date:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                fetchAnalyticsData();
                fetchVehiclePerfData();
              }}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
            >
              Apply Dates
            </button>
          </div>
        )}

        {/* Range Boundary Indicator */}
        {analytics?.reportingRange && (
          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
            <span>
              Reporting Window:{" "}
              <strong className="text-slate-700 font-semibold">
                {new Date(analytics.reportingRange.start).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                —{" "}
                {new Date(analytics.reportingRange.end).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
            </span>
            <span>•</span>
            <span>
              Comparison Window:{" "}
              <span className="text-slate-600 font-medium">
                {new Date(analytics.reportingRange.previousStart).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                —{" "}
                {new Date(analytics.reportingRange.previousEnd).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Bookings
            </span>
            {renderPercentageBadge(kpis?.totalBookings?.percentageChange)}
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {kpis?.totalBookings?.value ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">
              vs {kpis?.totalBookings?.prevValue ?? 0} in previous period
            </span>
          </div>
        </div>

        {/* Total Recognized Revenue */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rental Revenue
            </span>
            {renderPercentageBadge(kpis?.totalRevenue?.percentageChange)}
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-700 block">
              ₹{Number(kpis?.totalRevenue?.value ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-400">
              vs ₹{Number(kpis?.totalRevenue?.prevValue ?? 0).toLocaleString("en-IN")} in prev period
            </span>
          </div>
        </div>

        {/* Completed Rentals */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Completed Rentals
            </span>
            {renderPercentageBadge(kpis?.completedRentals?.percentageChange)}
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block">
              {kpis?.completedRentals?.value ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">
              Returned & Completed bookings
            </span>
          </div>
        </div>

        {/* Average Booking Value */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg Booking Value
            </span>
            {renderPercentageBadge(kpis?.avgBookingValue?.percentageChange)}
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              ₹{Number(kpis?.avgBookingValue?.value ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-slate-400">
              Revenue per completed trip
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Status & Fleet Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Pending</span>
          <span className="text-lg font-bold text-amber-600">{kpis?.pendingBookings?.value ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Confirmed</span>
          <span className="text-lg font-bold text-indigo-600">{kpis?.confirmedBookings?.value ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Active on Trip</span>
          <span className="text-lg font-bold text-teal-600">{kpis?.activeRentals?.value ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Cancelled</span>
          <span className="text-lg font-bold text-rose-600">{kpis?.cancelledBookings?.value ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Available Fleet</span>
          <span className="text-lg font-bold text-emerald-600">{kpis?.availableVehicles?.value ?? 0}</span>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 text-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Fleet</span>
          <span className="text-lg font-bold text-slate-900">{kpis?.totalVehicles?.value ?? 0}</span>
        </div>
      </div>

      {/* 3. Dynamic Narrative Business Insights */}
      {analytics?.insights && analytics.insights.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-3xl text-white shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Automated Business Insights & Intelligence
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-200">
            {analytics.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Booking & Revenue Daily Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                Performance Over Time
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Booking Count & Revenue Trends
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Daily Aggregation</span>
          </div>

          <div className="h-72 w-full pt-4">
            {analytics?.dailyTrends && analytics.dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyTrends}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => `₹${v}`}
                    tick={{ fontSize: 10, fill: "#0d9488" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val, name) =>
                      name === "Revenue (₹)" ? [`₹${Number(val).toLocaleString("en-IN")}`, name] : [val, name]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (₹)"
                    stroke="#0d9488"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend data recorded for selected period.
              </div>
            )}
          </div>
        </div>

        {/* Booking Status Distribution Donut Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Lifecycle Breakdown
            </span>
            <h3 className="text-base font-bold text-slate-900">Booking Status Split</h3>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            {analytics?.statusChart && analytics.statusChart.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusChart.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.statusChart.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 text-center">
                No bookings in selected period.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {analytics?.statusChart?.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[item.name] || "#94a3b8" }}
                />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Category Performance & Most Rented Models */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category Performance Bar Chart */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Fleet Segment Demand
            </span>
            <h3 className="text-base font-bold text-slate-900">Category Performance</h3>
          </div>

          <div className="h-64 w-full pt-2">
            {analytics?.categoryPerformance && analytics.categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="bookings" name="Bookings" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category data for selected period.
              </div>
            )}
          </div>
        </div>

        {/* Top Vehicle Models in Period */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              High Velocity Models
            </span>
            <h3 className="text-base font-bold text-slate-900">Most Frequently Rented Vehicles</h3>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.topVehicles && analytics.topVehicles.length > 0 ? (
              analytics.topVehicles.slice(0, 5).map((v, i) => (
                <div
                  key={v._id || i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {v.brand} {v.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">{v.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-teal-700 block">
                      {v.bookings} Booking{v.bookings > 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ₹{Number(v.revenue || 0).toLocaleString("en-IN")} generated
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No bookings recorded in this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Ranked Vehicle Performance Analytics Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Fleet Asset Intelligence
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Individual Vehicle Performance & Utilization
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked analysis of bookings, revenue attribution, and fleet utilization rate during this reporting period.
            </p>
          </div>

          {/* Table Sorting Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Sort By:</span>
            <select
              value={perfSort}
              onChange={(e) => setPerfSort(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none font-semibold text-slate-700"
            >
              <option value="revenue">Total Revenue</option>
              <option value="bookingsCount">Bookings Count</option>
              <option value="utilizationRate">Utilization Rate (%)</option>
              <option value="rating">Rating</option>
            </select>
            <button
              type="button"
              onClick={() => setPerfOrder(perfOrder === "asc" ? "desc" : "asc")}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-700"
            >
              {perfOrder === "desc" ? "High → Low" : "Low → High"}
            </button>
          </div>
        </div>

        {/* Highlight Banner: Most Rented vs Highest Revenue */}
        {vehiclePerf && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                  Most Requested Vehicle
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {vehiclePerf.mostRentedVehicle?.name || "N/A"}
                </h4>
                <p className="text-xs text-teal-700 font-semibold">
                  {vehiclePerf.mostRentedVehicle?.count || 0} Bookings recorded in period
                </p>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                  Top Revenue Generator
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {vehiclePerf.highestRevenueVehicle?.name || "N/A"}
                </h4>
                <p className="text-xs text-indigo-700 font-semibold">
                  ₹{Number(vehiclePerf.highestRevenueVehicle?.revenue || 0).toLocaleString("en-IN")} Total Revenue
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Vehicle</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Daily Rate</th>
                <th className="pb-3 px-3 text-center">Bookings</th>
                <th className="pb-3 px-3 text-center">Completed</th>
                <th className="pb-3 px-3">Attributed Revenue</th>
                <th className="pb-3 px-3 text-center">Utilization</th>
                <th className="pb-3 px-3">Rating</th>
                <th className="pb-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                    <span>Calculating vehicle metrics...</span>
                  </td>
                </tr>
              ) : vehiclePerf?.vehicles && vehiclePerf.vehicles.length > 0 ? (
                vehiclePerf.vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.image || "https://placehold.co/100x70/e2e8f0/334155?text=Car"}
                          alt={v.name}
                          className="w-10 h-7 object-cover rounded-md border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{v.name}</span>
                          <span className="text-[10px] text-slate-400">{v.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{v.type}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      ₹{Number(v.pricePerDay || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {v.bookingsCount}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-700">
                      {v.completedRentals}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-teal-700">
                      ₹{Number(v.totalRevenue || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-600 h-1.5 rounded-full"
                            style={{ width: `${v.utilizationRate || 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{v.utilizationRate || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{v.rating || 4.0}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.available
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {v.available ? "Available" : "Rented"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No vehicle records found for selected period.
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
