const express = require("express");
const mongoose = require("mongoose");
const adminAuth = require("../middleware/adminAuth");
const router = express.Router();

const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Booking = require("../models/Booking");

// ==========================================
// DATE BOUNDARY CALCULATOR
// ==========================================
function getPeriodDateRanges(period, customStart, customEnd) {
  const now = new Date();
  let start, end, prevStart, prevEnd;

  switch (period) {
    case "today": {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);
      prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - 1);
      break;
    }
    case "last7days": {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const span = end.getTime() - start.getTime() + 1;
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - span + 1);
      break;
    }
    case "last30days": {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      start = new Date(end);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      const span = end.getTime() - start.getTime() + 1;
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - span + 1);
      break;
    }
    case "thisweek": {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const duration = end.getTime() - start.getTime();
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(prevStart.getTime() + duration);
      break;
    }
    case "lastweek": {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
      start = new Date(thisMonday);
      start.setDate(start.getDate() - 7);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(end);
      prevEnd.setDate(prevEnd.getDate() - 7);
      break;
    }
    case "thismonth": {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const prevEquivalentDay = Math.min(now.getDate(), prevMonthLastDay);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, prevEquivalentDay, 23, 59, 59, 999);
      break;
    }
    case "lastmonth": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      end = new Date(now.getFullYear(), now.getMonth() - 1, lastDay, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      const prevLastDay = new Date(now.getFullYear(), now.getMonth() - 1, 0).getDate();
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 2, prevLastDay, 23, 59, 59, 999);
      break;
    }
    case "thisquarter": {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), (q - 1) * 3, 1, 0, 0, 0, 0);
      const span = end.getTime() - start.getTime() + 1;
      prevEnd = new Date(prevStart.getTime() + span - 1);
      break;
    }
    case "thisyear": {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case "custom": {
      if (customStart && customEnd) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          start = new Date(end);
          start.setDate(start.getDate() - 29);
          start.setHours(0, 0, 0, 0);
        }
      } else {
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        start = new Date(end);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
      }
      const span = end.getTime() - start.getTime() + 1;
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - span + 1);
      break;
    }
    default: {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      start = new Date(end);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      const span = end.getTime() - start.getTime() + 1;
      prevEnd = new Date(start.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - span + 1);
      break;
    }
  }

  return { start, end, prevStart, prevEnd };
}

// Percentage change calculation with safe division
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    if (current === 0) return 0;
    return null; // N/A
  }
  const diff = current - previous;
  const pct = (diff / Math.abs(previous)) * 100;
  return Number(pct.toFixed(1));
}

// ==========================================
// 1. BASIC DASHBOARD OVERVIEW (Backward Compatible)
// ==========================================
router.get("/", adminAuth, async (req, res) => {
  try {
    const [
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      totalCustomers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      recentBookings,
    ] = await Promise.all([
      Vehicle.countDocuments({ isArchived: { $ne: true } }),
      Vehicle.countDocuments({ available: true, isArchived: { $ne: true } }),
      Vehicle.countDocuments({ available: false, isArchived: { $ne: true } }),
      User.countDocuments({ role: { $ne: "admin" } }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "Pending" }),
      Booking.countDocuments({ status: "Confirmed" }),
      Booking.countDocuments({ status: { $in: ["Completed", "Returned"] } }),
      Booking.countDocuments({ status: "Cancelled" }),
      Booking.find()
        .populate("user", "name email")
        .populate("vehicle", "name brand type pricePerDay image")
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["Completed", "Returned"] },
        },
      },
      {
        $group: {
          _id: null,
          baseRevenue: { $sum: "$totalAmount" },
          fineRevenue: { $sum: { $ifNull: ["$fineAmount", 0] } },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? (revenueResult[0].baseRevenue || 0) + (revenueResult[0].fineRevenue || 0)
        : 0;

    const bookingStatus = [
      { name: "Pending", value: pendingBookings },
      { name: "Confirmed", value: confirmedBookings },
      { name: "Completed", value: completedBookings },
      { name: "Cancelled", value: cancelledBookings },
    ];

    res.status(200).json({
      success: true,
      dashboard: {
        totalVehicles,
        availableVehicles,
        rentedVehicles,
        totalCustomers,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        bookingStatus,
        recentBookings,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
    });
  }
});

// ==========================================
// 2. PERIOD-BASED BUSINESS ANALYTICS API
// ==========================================
router.get("/analytics", adminAuth, async (req, res) => {
  try {
    const { period = "last30days", startDate, endDate } = req.query;
    const { start, end, prevStart, prevEnd } = getPeriodDateRanges(period, startDate, endDate);

    // Queries for Current Period
    const currentFilter = { createdAt: { $gte: start, $lte: end } };
    const prevFilter = { createdAt: { $gte: prevStart, $lte: prevEnd } };

    // Completed/Revenue filter (recognized when status is Completed or Returned)
    const currentCompletedFilter = {
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["Completed", "Returned"] },
    };
    const prevCompletedFilter = {
      createdAt: { $gte: prevStart, $lte: prevEnd },
      status: { $in: ["Completed", "Returned"] },
    };

    const [
      currTotalBookings,
      prevTotalBookings,
      currCompletedBookings,
      prevCompletedBookings,
      currPendingBookings,
      currConfirmedBookings,
      currCancelledBookings,
      prevCancelledBookings,
      currActiveRentals,
      currNewUsers,
      prevNewUsers,
      currRevenueAgg,
      prevRevenueAgg,
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      statusBreakdownRaw,
      dailyTrendRaw,
      categoryPerfRaw,
      topVehiclesRaw,
    ] = await Promise.all([
      Booking.countDocuments(currentFilter),
      Booking.countDocuments(prevFilter),
      Booking.countDocuments(currentCompletedFilter),
      Booking.countDocuments(prevCompletedFilter),
      Booking.countDocuments({ ...currentFilter, status: "Pending" }),
      Booking.countDocuments({ ...currentFilter, status: "Confirmed" }),
      Booking.countDocuments({ ...currentFilter, status: "Cancelled" }),
      Booking.countDocuments({ ...prevFilter, status: "Cancelled" }),
      Booking.countDocuments({ ...currentFilter, status: "Rented" }),
      User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: prevStart, $lte: prevEnd } }),
      Booking.aggregate([
        { $match: currentCompletedFilter },
        {
          $group: {
            _id: null,
            base: { $sum: "$totalAmount" },
            fines: { $sum: { $ifNull: ["$fineAmount", 0] } },
          },
        },
      ]),
      Booking.aggregate([
        { $match: prevCompletedFilter },
        {
          $group: {
            _id: null,
            base: { $sum: "$totalAmount" },
            fines: { $sum: { $ifNull: ["$fineAmount", 0] } },
          },
        },
      ]),
      Vehicle.countDocuments({ isArchived: { $ne: true } }),
      Vehicle.countDocuments({ available: true, isArchived: { $ne: true } }),
      Vehicle.countDocuments({ available: false, isArchived: { $ne: true } }),
      // Status breakdown
      Booking.aggregate([
        { $match: currentFilter },
        { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      ]),
      // Daily trends
      Booking.aggregate([
        { $match: currentFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            bookings: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["Completed", "Returned"]] },
                  { $add: ["$totalAmount", { $ifNull: ["$fineAmount", 0] }] },
                  0,
                ],
              },
            },
            completed: {
              $sum: {
                $cond: [{ $in: ["$status", ["Completed", "Returned"]] }, 1, 0],
              },
            },
            cancelled: {
              $sum: {
                $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Category performance
      Booking.aggregate([
        { $match: currentFilter },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle",
            foreignField: "_id",
            as: "vehicleInfo",
          },
        },
        { $unwind: "$vehicleInfo" },
        {
          $group: {
            _id: "$vehicleInfo.type",
            bookings: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["Completed", "Returned"]] },
                  { $add: ["$totalAmount", { $ifNull: ["$fineAmount", 0] }] },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { bookings: -1 } },
      ]),
      // Top vehicles in period
      Booking.aggregate([
        { $match: currentFilter },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle",
            foreignField: "_id",
            as: "vehicleInfo",
          },
        },
        { $unwind: "$vehicleInfo" },
        {
          $group: {
            _id: "$vehicle",
            name: { $first: "$vehicleInfo.name" },
            brand: { $first: "$vehicleInfo.brand" },
            type: { $first: "$vehicleInfo.type" },
            image: { $first: "$vehicleInfo.image" },
            bookings: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $in: ["$status", ["Completed", "Returned"]] }, 1, 0],
              },
            },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["Completed", "Returned"]] },
                  { $add: ["$totalAmount", { $ifNull: ["$fineAmount", 0] }] },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { bookings: -1, revenue: -1 } },
        { $limit: 6 },
      ]),
    ]);

    // Current & previous revenues
    const currRevenue = currRevenueAgg.length > 0 ? (currRevenueAgg[0].base + currRevenueAgg[0].fines) : 0;
    const prevRevenue = prevRevenueAgg.length > 0 ? (prevRevenueAgg[0].base + prevRevenueAgg[0].fines) : 0;

    // Average booking values
    const currAvgValue = currCompletedBookings > 0 ? Math.round(currRevenue / currCompletedBookings) : (currTotalBookings > 0 ? Math.round(currRevenue / currTotalBookings) : 0);
    const prevAvgValue = prevCompletedBookings > 0 ? Math.round(prevRevenue / prevCompletedBookings) : (prevTotalBookings > 0 ? Math.round(prevRevenue / prevTotalBookings) : 0);

    // KPI Summary Object
    const kpi = {
      totalBookings: {
        value: currTotalBookings,
        prevValue: prevTotalBookings,
        percentageChange: calculatePercentageChange(currTotalBookings, prevTotalBookings),
      },
      totalRevenue: {
        value: currRevenue,
        prevValue: prevRevenue,
        percentageChange: calculatePercentageChange(currRevenue, prevRevenue),
      },
      completedRentals: {
        value: currCompletedBookings,
        prevValue: prevCompletedBookings,
        percentageChange: calculatePercentageChange(currCompletedBookings, prevCompletedBookings),
      },
      pendingBookings: {
        value: currPendingBookings,
      },
      confirmedBookings: {
        value: currConfirmedBookings,
      },
      cancelledBookings: {
        value: currCancelledBookings,
        prevValue: prevCancelledBookings,
        percentageChange: calculatePercentageChange(currCancelledBookings, prevCancelledBookings),
      },
      activeRentals: {
        value: currActiveRentals,
      },
      newCustomers: {
        value: currNewUsers,
        prevValue: prevNewUsers,
        percentageChange: calculatePercentageChange(currNewUsers, prevNewUsers),
      },
      totalVehicles: {
        value: totalVehicles,
      },
      availableVehicles: {
        value: availableVehicles,
      },
      rentedVehicles: {
        value: rentedVehicles,
      },
      avgBookingValue: {
        value: currAvgValue,
        prevValue: prevAvgValue,
        percentageChange: calculatePercentageChange(currAvgValue, prevAvgValue),
      },
    };

    // Format status breakdown
    const statusMap = {
      Pending: 0,
      Confirmed: 0,
      Rented: 0,
      Returned: 0,
      Completed: 0,
      Cancelled: 0,
    };
    statusBreakdownRaw.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });

    const statusChart = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Ensure daily trend array fills days if under 31 days
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    let dailyTrends = [];
    if (totalDays <= 31) {
      const trendMap = new Map(dailyTrendRaw.map((d) => [d._id, d]));
      const runner = new Date(start);
      while (runner <= end) {
        const key = runner.toISOString().split("T")[0];
        const monthDay = `${runner.getDate()} ${runner.toLocaleString("default", { month: "short" })}`;
        const existing = trendMap.get(key);
        dailyTrends.push({
          date: key,
          label: monthDay,
          bookings: existing ? existing.bookings : 0,
          revenue: existing ? existing.revenue : 0,
          completed: existing ? existing.completed : 0,
          cancelled: existing ? existing.cancelled : 0,
        });
        runner.setDate(runner.getDate() + 1);
      }
    } else {
      dailyTrends = dailyTrendRaw.map((d) => ({
        date: d._id,
        label: d._id,
        bookings: d.bookings,
        revenue: d.revenue,
        completed: d.completed,
        cancelled: d.cancelled,
      }));
    }

    // Category Performance
    const categoryPerformance = categoryPerfRaw.map((c) => ({
      category: c._id || "Other",
      bookings: c.bookings,
      revenue: c.revenue,
      share: currTotalBookings > 0 ? Math.round((c.bookings / currTotalBookings) * 100) : 0,
    }));

    // Top Vehicle by Bookings & Revenue
    let mostRentedVehicle = null;
    let highestRevenueVehicle = null;
    if (topVehiclesRaw.length > 0) {
      mostRentedVehicle = topVehiclesRaw[0];
      const byRevenue = [...topVehiclesRaw].sort((a, b) => b.revenue - a.revenue);
      highestRevenueVehicle = byRevenue[0];
    }

    // Dynamic Business Insights Generation
    const insights = [];
    if (kpi.totalRevenue.percentageChange !== null) {
      const sign = kpi.totalRevenue.percentageChange >= 0 ? "increased" : "decreased";
      insights.push(
        `Rental revenue ${sign} by ${Math.abs(kpi.totalRevenue.percentageChange)}% compared with the previous period (₹${currRevenue.toLocaleString("en-IN")} vs ₹${prevRevenue.toLocaleString("en-IN")}).`
      );
    } else if (currRevenue > 0 && prevRevenue === 0) {
      insights.push(
        `Rental revenue generated in this period was ₹${currRevenue.toLocaleString("en-IN")}, while the previous period recorded no recognized revenue.`
      );
    }

    if (mostRentedVehicle) {
      insights.push(
        `"${mostRentedVehicle.brand} ${mostRentedVehicle.name}" was the most requested vehicle with ${mostRentedVehicle.bookings} booking(s).`
      );
    }

    if (highestRevenueVehicle && highestRevenueVehicle.revenue > 0) {
      insights.push(
        `"${highestRevenueVehicle.brand} ${highestRevenueVehicle.name}" generated the highest rental revenue at ₹${highestRevenueVehicle.revenue.toLocaleString("en-IN")}.`
      );
    }

    if (categoryPerformance.length > 0) {
      const topCategory = categoryPerformance[0];
      insights.push(
        `${topCategory.category} category accounted for ${topCategory.share}% of total bookings during this timeframe.`
      );
    }

    if (currCancelledBookings > 0 && currTotalBookings > 0) {
      const cancellationRate = Math.round((currCancelledBookings / currTotalBookings) * 100);
      insights.push(`Booking cancellation rate stood at ${cancellationRate}% (${currCancelledBookings} cancelled out of ${currTotalBookings} bookings).`);
    }

    res.status(200).json({
      success: true,
      period,
      reportingRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        previousStart: prevStart.toISOString(),
        previousEnd: prevEnd.toISOString(),
      },
      kpi,
      statusChart,
      dailyTrends,
      categoryPerformance,
      topVehicles: topVehiclesRaw,
      insights,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to calculate business analytics.",
      error: error.message,
    });
  }
});

// ==========================================
// 3. VEHICLE PERFORMANCE ANALYTICS API
// ==========================================
router.get("/vehicle-performance", adminAuth, async (req, res) => {
  try {
    const { period = "last30days", startDate, endDate, sort = "revenue", order = "desc" } = req.query;
    const { start, end } = getPeriodDateRanges(period, startDate, endDate);
    const totalPeriodDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    // Fetch all active vehicles
    const vehicles = await Vehicle.find({ isArchived: { $ne: true } }).lean();

    // Fetch all bookings for this period
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    // Map metrics per vehicle
    const perfMap = new Map();
    for (const v of vehicles) {
      perfMap.set(v._id.toString(), {
        _id: v._id,
        name: v.name,
        brand: v.brand,
        type: v.type,
        pricePerDay: v.pricePerDay,
        image: v.image,
        rating: v.rating || 0,
        available: v.available,
        bookingsCount: 0,
        completedRentals: 0,
        totalRevenue: 0,
        rentedDays: 0,
        utilizationRate: 0,
      });
    }

    for (const b of bookings) {
      const vid = b.vehicle ? b.vehicle.toString() : null;
      if (vid && perfMap.has(vid)) {
        const item = perfMap.get(vid);
        item.bookingsCount += 1;
        if (["Completed", "Returned"].includes(b.status)) {
          item.completedRentals += 1;
          item.totalRevenue += (b.totalAmount || 0) + (b.fineAmount || 0);
          item.rentedDays += b.totalDays || 1;
        } else if (["Confirmed", "Rented"].includes(b.status)) {
          item.rentedDays += b.totalDays || 1;
        }
      }
    }

    // Calculate utilization rate
    const list = Array.from(perfMap.values()).map((v) => {
      const rate = Math.min(100, Math.round((v.rentedDays / totalPeriodDays) * 100));
      return {
        ...v,
        utilizationRate: rate,
      };
    });

    // Sorting
    list.sort((a, b) => {
      let valA = a[sort] ?? 0;
      let valB = b[sort] ?? 0;
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (order === "asc") {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });

    const mostRented = [...list].sort((a, b) => b.bookingsCount - a.bookingsCount)[0];
    const highestRevenue = [...list].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

    res.status(200).json({
      success: true,
      period,
      totalVehicles: list.length,
      mostRentedVehicle: mostRented ? { name: `${mostRented.brand} ${mostRented.name}`, count: mostRented.bookingsCount } : null,
      highestRevenueVehicle: highestRevenue ? { name: `${highestRevenue.brand} ${highestRevenue.name}`, revenue: highestRevenue.totalRevenue } : null,
      vehicles: list,
    });
  } catch (error) {
    console.error("Vehicle performance error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch vehicle performance analytics.",
    });
  }
});

// ==========================================
// 4. EXPORT ANALYTICS (CSV)
// ==========================================
router.get("/export", adminAuth, async (req, res) => {
  try {
    const { period = "last30days", type = "bookings", startDate, endDate } = req.query;
    const { start, end } = getPeriodDateRanges(period, startDate, endDate);

    if (type === "vehicles") {
      const vehicles = await Vehicle.find({ isArchived: { $ne: true } }).lean();
      const bookings = await Booking.find({
        createdAt: { $gte: start, $lte: end },
      }).lean();

      const totalPeriodDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const perfMap = new Map();
      for (const v of vehicles) {
        perfMap.set(v._id.toString(), {
          id: v._id.toString(),
          name: v.name,
          brand: v.brand,
          type: v.type,
          pricePerDay: v.pricePerDay,
          rating: v.rating || 0,
          available: v.available ? "Yes" : "No",
          bookingsCount: 0,
          completedRentals: 0,
          totalRevenue: 0,
          rentedDays: 0,
        });
      }

      for (const b of bookings) {
        const vid = b.vehicle ? b.vehicle.toString() : null;
        if (vid && perfMap.has(vid)) {
          const item = perfMap.get(vid);
          item.bookingsCount += 1;
          if (["Completed", "Returned"].includes(b.status)) {
            item.completedRentals += 1;
            item.totalRevenue += (b.totalAmount || 0) + (b.fineAmount || 0);
            item.rentedDays += b.totalDays || 1;
          }
        }
      }

      const rows = [
        ["Vehicle ID", "Brand", "Model / Name", "Category", "Daily Rate (INR)", "Rating", "Available", "Period Bookings", "Completed Rentals", "Total Revenue (INR)", "Utilization (%)"],
      ];

      for (const item of perfMap.values()) {
        const util = Math.min(100, Math.round((item.rentedDays / totalPeriodDays) * 100));
        rows.push([
          `"${item.id}"`,
          `"${item.brand}"`,
          `"${item.name}"`,
          `"${item.type}"`,
          item.pricePerDay,
          item.rating,
          item.available,
          item.bookingsCount,
          item.completedRentals,
          item.totalRevenue,
          util,
        ]);
      }

      const csv = rows.map((r) => r.join(",")).join("\r\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=SmartRent_Vehicle_Performance_${period}.csv`);
      return res.status(200).send(csv);
    }

    // Default: Bookings export
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate("user", "name email")
      .populate("vehicle", "name brand type pricePerDay")
      .sort({ createdAt: -1 })
      .lean();

    const rows = [
      ["Booking ID", "Customer Name", "Customer Email", "Vehicle Brand", "Vehicle Name", "Category", "Pickup Date", "Return Date", "Location", "Total Days", "Total Amount (INR)", "Fine (INR)", "Status", "Booked At"],
    ];

    for (const b of bookings) {
      const uName = b.user?.name || "N/A";
      const uEmail = b.user?.email || "N/A";
      const vBrand = b.vehicle?.brand || "N/A";
      const vName = b.vehicle?.name || "N/A";
      const vType = b.vehicle?.type || "N/A";
      const pickup = b.pickupDate ? new Date(b.pickupDate).toISOString().split("T")[0] : "";
      const ret = b.returnDate ? new Date(b.returnDate).toISOString().split("T")[0] : "";
      const bookedAt = b.createdAt ? new Date(b.createdAt).toISOString().replace("T", " ").substring(0, 19) : "";

      rows.push([
        `"${b._id}"`,
        `"${uName}"`,
        `"${uEmail}"`,
        `"${vBrand}"`,
        `"${vName}"`,
        `"${vType}"`,
        `"${pickup}"`,
        `"${ret}"`,
        `"${b.location || ""}"`,
        b.totalDays || 0,
        b.totalAmount || 0,
        b.fineAmount || 0,
        `"${b.status}"`,
        `"${bookedAt}"`,
      ]);
    }

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=SmartRent_Bookings_${period}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate CSV export.",
    });
  }
});

module.exports = router;
