const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Notification = require("../models/Notification");
const PricingHistory = require("../models/PricingHistory");
const adminAuth = require("../middleware/adminAuth");

// ==========================================
// CREATE NOTIFICATION SAFELY
// ==========================================
async function createNotificationSafely(notificationData) {
  try {
    await Notification.create(notificationData);
  } catch (error) {
    console.error("Notification creation error:", error);
  }
}

// ==========================================
// ADMIN: GET ALL BOOKINGS
// ==========================================
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("vehicle")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Admin fetch bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch bookings.",
    });
  }
});

// ==========================================
// ADMIN: UPDATE BOOKING STATUS + LATE FINE
// ==========================================
router.patch("/admin/:bookingId/status", adminAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body || {};

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Rented",
      "Returned",
      "Cancelled",
      "Completed",
    ];

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status.",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (["Cancelled", "Completed", "Returned"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "This booking is already closed.",
      });
    }

    // ==========================================
    // LATE RETURN FINE
    // ==========================================
    if (status === "Returned") {
      const actualReturnDate = new Date();
      const dueDate = new Date(booking.returnDate);

      const dueDay = Date.UTC(
        dueDate.getUTCFullYear(),
        dueDate.getUTCMonth(),
        dueDate.getUTCDate()
      );

      const actualDay = Date.UTC(
        actualReturnDate.getUTCFullYear(),
        actualReturnDate.getUTCMonth(),
        actualReturnDate.getUTCDate()
      );

      const lateDays = Math.max(
        0,
        Math.floor(
          (actualDay - dueDay) / (1000 * 60 * 60 * 24)
        )
      );

      const finePerDay = 100;

      booking.actualReturnDate = actualReturnDate;
      booking.lateDays = lateDays;
      booking.fineAmount = lateDays * finePerDay;

      booking.fineReason =
        lateDays > 0
          ? `Vehicle returned ${lateDays} day(s) late. Fine: ₹${finePerDay} per day.`
          : "Vehicle returned on time. No fine.";
    }

    booking.status = status;

    await booking.save();

    // ==========================================
    // BOOKING CONFIRMATION NOTIFICATION
    // ==========================================
    if (status === "Confirmed") {
      await createNotificationSafely({
        user: booking.user,
        title: "Booking Confirmed",
        message: "Your vehicle booking has been confirmed.",
        type: "Booking Confirmation",
        relatedBooking: booking._id,
      });
    }

    // ==========================================
    // RETURN NOTIFICATIONS
    // ==========================================
    if (status === "Returned") {
      await createNotificationSafely({
        user: booking.user,
        title: "Vehicle Return Confirmed",
        message: "Your vehicle return has been recorded successfully.",
        type: "Return Confirmation",
        relatedBooking: booking._id,
      });

      if (Number(booking.fineAmount) > 0) {
        await createNotificationSafely({
          user: booking.user,
          title: "Late Return Fine",
          message: `Your late return fine is ₹${booking.fineAmount} for ${booking.lateDays} late day(s).`,
          type: "Late Fee Alert",
          relatedBooking: booking._id,
        });
      }
    }

    // ==========================================
    // UPDATE VEHICLE AVAILABILITY
    // ==========================================
    const vehicleAvailable = [
      "Cancelled",
      "Returned",
      "Completed",
    ].includes(status);

    await Vehicle.findByIdAndUpdate(booking.vehicle, {
      $set: {
        available: vehicleAvailable,
      },
    });

    await booking.populate("user", "name email");
    await booking.populate("vehicle");

    return res.json({
      success: true,
      message: "Booking status updated successfully.",
      booking,
    });
  } catch (error) {
    console.error("Admin update booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update booking status.",
    });
  }
});

// ==========================================
// ADMIN: DELETE BOOKING
// ==========================================
router.delete("/admin/:bookingId", adminAuth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const vehicleId = booking.vehicle;

    await Booking.findByIdAndDelete(bookingId);

    const activeBooking = await Booking.exists({
      vehicle: vehicleId,
      status: {
        $in: ["Pending", "Confirmed", "Rented"],
      },
    });

    const vehicleAvailable = !activeBooking;

    await Vehicle.findByIdAndUpdate(vehicleId, {
      $set: {
        available: vehicleAvailable,
      },
    });

    return res.json({
      success: true,
      message: "Booking deleted successfully.",
      vehicleId: vehicleId.toString(),
      vehicleAvailable,
    });
  } catch (error) {
    console.error("Admin delete booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete booking.",
    });
  }
});

// ==========================================
// DYNAMIC PRICING HELPER
// ==========================================

async function calculateDynamicPrice(vehicle) {
  const thirtyDaysAgo = new Date();

  thirtyDaysAgo.setDate(
    thirtyDaysAgo.getDate() - 30
  );

  const bookingCounts = await Booking.aggregate([
    {
      $match: {
        createdAt: {
          $gte: thirtyDaysAgo,
        },

        status: {
          $ne: "Cancelled",
        },
      },
    },

    {
      $group: {
        _id: "$vehicle",

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const allVehicles = await Vehicle.find({}, "_id");

  // If only one vehicle exists
  if (allVehicles.length <= 1) {
    return {
      basePrice: Number(vehicle.pricePerDay),
      finalPrice: Number(vehicle.pricePerDay),
      pricingType: "Normal Price",
    };
  }

  const countMap = new Map(
    bookingCounts.map((item) => [
      item._id.toString(),
      item.count,
    ])
  );

  const counts = allVehicles.map(
    (item) =>
      countMap.get(item._id.toString()) || 0
  );

  const sortedCounts = [...counts].sort(
    (a, b) => a - b
  );

  const lowIndex = Math.floor(
    (sortedCounts.length - 1) * 0.25
  );

  const highIndex = Math.ceil(
    (sortedCounts.length - 1) * 0.75
  );

  const lowThreshold = sortedCounts[lowIndex];

  const highThreshold = sortedCounts[highIndex];

  const currentCount =
    countMap.get(vehicle._id.toString()) || 0;

  // ==========================================
  // TEMPORARY TEST LOG
  // ==========================================

  console.log("DYNAMIC PRICING TEST:", {
    vehicle: vehicle.name,
    currentCount,
    lowThreshold,
    highThreshold,
    basePrice: vehicle.pricePerDay,
  });

  const basePrice = Number(vehicle.pricePerDay);

  let finalPrice = basePrice;

  let pricingType = "Normal Price";

  // ==========================================
  // HIGH DEMAND +10%
  // ==========================================

  if (
    currentCount > lowThreshold &&
    currentCount >= highThreshold
  ) {
    finalPrice =
      Math.round(basePrice * 1.1 * 100) / 100;

    pricingType = "High Demand (+10%)";
  }

  // ==========================================
  // LOW DEMAND -10%
  // ==========================================

  else if (
    currentCount < highThreshold &&
    currentCount <= lowThreshold
  ) {
    finalPrice =
      Math.round(basePrice * 0.9 * 100) / 100;

    pricingType = "Low Demand (-10%)";
  }

  return {
    basePrice,
    finalPrice,
    pricingType,
  };
}
// ==========================================
// CREATE NEW BOOKING
// ==========================================
router.post("/", async (req, res) => {
  let bookedVehicle = null;

  try {
    const {
      userId,
      vehicleId,
      pickupDate,
      returnDate,
      location,
    } = req.body || {};

    // ==========================================
    // VALIDATE REQUIRED FIELDS
    // ==========================================
    if (
      !userId ||
      !vehicleId ||
      !pickupDate ||
      !returnDate ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // ==========================================
    // VALIDATE OBJECT IDS
    // ==========================================
    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(vehicleId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID or vehicle ID.",
      });
    }

    // ==========================================
    // CHECK USER
    // ==========================================
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==========================================
    // VALIDATE DATES
    // ==========================================
    const pickup = new Date(pickupDate);
    const returning = new Date(returnDate);

    if (
      Number.isNaN(pickup.getTime()) ||
      Number.isNaN(returning.getTime()) ||
      returning <= pickup
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking dates.",
      });
    }

    // ==========================================
    // VALIDATE LOCATION
    // ==========================================
    if (!location.trim()) {
      return res.status(400).json({
        success: false,
        message: "Location is required.",
      });
    }

    // ==========================================
    // LOCK VEHICLE
    // ==========================================
    bookedVehicle =
      await Vehicle.findOneAndUpdate(
        {
          _id: vehicleId,
          available: true,
        },
        {
          $set: {
            available: false,
          },
        },
        {
          new: true,
        }
      );

    if (!bookedVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle is not available.",
      });
    }

    // ==========================================
    // CALCULATE TOTAL DAYS
    // ==========================================
    const totalDays = Math.ceil(
      (returning - pickup) /
        (1000 * 60 * 60 * 24)
    );

    // ==========================================
    // CALCULATE DYNAMIC PRICE
    // ==========================================
    const pricing =
      await calculateDynamicPrice(bookedVehicle);

    // ==========================================
    // SAVE PRICING HISTORY
    // ==========================================
    if (pricing.pricingType !== "Normal Price") {
      let reason = "Normal Price";

      if (
        pricing.pricingType.includes(
          "High Demand"
        )
      ) {
        reason = "High Demand";
      } else if (
        pricing.pricingType.includes(
          "Low Demand"
        )
      ) {
        reason = "Low Demand";
      }

      await PricingHistory.create({
        vehicle: bookedVehicle._id,
        oldPrice: pricing.basePrice,
        newPrice: pricing.finalPrice,
        reason: reason,
      });
    }

    // ==========================================
    // TOTAL AMOUNT
    // ==========================================
    const totalAmount =
      totalDays * pricing.finalPrice;

    // ==========================================
    // CREATE BOOKING
    // ==========================================
    const booking = await Booking.create({
      user: userId,
      vehicle: vehicleId,
      pickupDate: pickup,
      returnDate: returning,
      location: location.trim(),
      totalDays: totalDays,
      totalAmount: totalAmount,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking,
      pricing: {
        ...pricing,
        totalDays,
        totalAmount,
      },
    });
  } catch (error) {
    // ==========================================
    // RESTORE VEHICLE IF BOOKING FAILS
    // ==========================================
    if (bookedVehicle) {
      await Vehicle.findByIdAndUpdate(
        bookedVehicle._id,
        {
          $set: {
            available: true,
          },
        }
      );
    }

    console.error("Booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking.",
    });
  }
});

// ==========================================
// GET BOOKINGS FOR USER
// ==========================================
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const bookings = await Booking.find({
      user: userId,
      status: {
        $ne: "Cancelled",
      },
    })
      .populate("vehicle")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error(
      "Fetch bookings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch bookings.",
    });
  }
});

// ==========================================
// CANCEL BOOKING WITHIN 1 HOUR
// ==========================================
router.post(
  "/:bookingId/cancel",
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { userId } = req.body || {};

      // ==========================================
      // VALIDATE IDS
      // ==========================================
      if (
        !mongoose.isValidObjectId(bookingId) ||
        !mongoose.isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid booking ID or user ID.",
        });
      }

      // ==========================================
      // FIND BOOKING
      // ==========================================
      const booking =
        await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      // ==========================================
      // CHECK OWNER
      // ==========================================
      if (
        booking.user.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot cancel this booking.",
        });
      }

      // ==========================================
      // CHECK STATUS
      // ==========================================
      if (
        !["Pending", "Confirmed"].includes(
          booking.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This booking cannot be cancelled.",
        });
      }

      // ==========================================
      // ONE HOUR CANCELLATION LIMIT
      // ==========================================
      const oneHour =
        60 * 60 * 1000;

      const elapsedTime =
        Date.now() -
        booking.createdAt.getTime();

      if (elapsedTime > oneHour) {
        return res.status(400).json({
          success: false,
          message:
            "Cancellation time has expired. You can cancel only within 1 hour.",
        });
      }

      // ==========================================
      // CANCEL BOOKING
      // ==========================================
      booking.status = "Cancelled";

      await booking.save();

      // ==========================================
      // MAKE VEHICLE AVAILABLE
      // ==========================================
      await Vehicle.findByIdAndUpdate(
        booking.vehicle,
        {
          $set: {
            available: true,
          },
        }
      );

      return res.json({
        success: true,
        message:
          "Booking cancelled successfully.",
      });
    } catch (error) {
      console.error(
        "Cancel booking error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to cancel booking.",
      });
    }
  }
);

// ==========================================
// EXPORT ROUTER
// ==========================================
module.exports = router;