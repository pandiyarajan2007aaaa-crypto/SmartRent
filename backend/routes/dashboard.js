const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const router = express.Router();

const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Booking = require("../models/Booking");

// Admin Dashboard API
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
      // Total vehicles
      Vehicle.countDocuments(),

      // Available vehicles
      Vehicle.countDocuments({ available: true }),

      // Rented vehicles
      Vehicle.countDocuments({ available: false }),

      // Total customers
      User.countDocuments({ role: { $ne: "admin" } }),

      // Total bookings
      Booking.countDocuments(),

      // Pending bookings
      Booking.countDocuments({ status: "Pending" }),

      // Confirmed bookings
      Booking.countDocuments({ status: "Confirmed" }),

      // Completed bookings
      Booking.countDocuments({ status: "Completed" }),

      // Cancelled bookings
      Booking.countDocuments({ status: "Cancelled" }),

      // Recent bookings
      Booking.find()
        .populate("user", "name email")
        .populate("vehicle", "name brand")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Calculate total revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["Completed", "Returned"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    // Booking status chart data
    const bookingStatus = [
      { name: "Pending", value: pendingBookings },
      { name: "Confirmed", value: confirmedBookings },
      { name: "Completed", value: completedBookings },
      { name: "Cancelled", value: cancelledBookings },
    ];

    // Dashboard response
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

module.exports = router;