const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/auth");

// ==========================================
// GET CUSTOMER NOTIFICATIONS
// CUSTOMER CAN ONLY SEE THEIR OWN NOTIFICATIONS
// ==========================================

router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const loggedInUserId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "User information not found",
      });
    }

    // Prevent one customer from viewing another customer's notifications
    if (String(loggedInUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own notifications",
      });
    }

    const notifications = await Notification.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .populate("relatedBooking")
      .lean();

    return res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
    });
  }
});

// ==========================================
// MARK NOTIFICATION AS READ
// CUSTOMER CAN ONLY MARK THEIR OWN NOTIFICATION
// ==========================================

router.patch("/:notificationId/read", authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const loggedInUserId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    if (!loggedInUserId) {
      return res.status(401).json({
        success: false,
        message: "User information not found",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: loggedInUserId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
});

module.exports = router;