const express = require("express");
const router = express.Router();

const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");
const adminAuth = require("../middleware/adminAuth");
const authMiddleware = require("../middleware/auth");

// ==========================================
// CUSTOMER: SUBMIT FEEDBACK
// ==========================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feedback message is required.",
      });
    }

    const userId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User information not found. Please log in again.",
      });
    }

    const feedback = await Feedback.create({
      user: userId,
      name: req.user.name || "Customer",
      email: req.user.email || "",
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback,
    });
  } catch (error) {
    console.error("Feedback submit error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit feedback.",
    });
  }
});

// ==========================================
// ADMIN ONLY: GET ALL FEEDBACK
// ==========================================

router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error("Feedback fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch feedback.",
    });
  }
});

// ==========================================
// ADMIN ONLY: REPLY TO FEEDBACK
// ==========================================

router.patch("/admin/:feedbackId/reply", adminAuth, async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required.",
      });
    }

    const feedback = await Feedback.findById(req.params.feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found.",
      });
    }

    const cleanReply = reply.trim();

    // Save admin reply
    feedback.reply = cleanReply;
    feedback.repliedAt = new Date();
    feedback.isReplied = true;

    await feedback.save();

    // ==========================================
    // SEND NOTIFICATION TO CUSTOMER
    // ==========================================

    await Notification.create({
      user: feedback.user,
      title: "SmartRent Support",
      message: `From: SmartRent\n\n${cleanReply}`,
      type: "Customer Feedback Reply",
      relatedBooking: null,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully from SmartRent.",
      feedback,
    });
  } catch (error) {
    console.error("Feedback reply error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send reply.",
    });
  }
});

// ==========================================
// ADMIN ONLY: MARK FEEDBACK AS READ
// ==========================================

router.patch("/admin/:feedbackId/read", adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.feedbackId,
      { isRead: true },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback marked as read.",
      feedback,
    });
  } catch (error) {
    console.error("Feedback read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update feedback.",
    });
  }
});

module.exports = router;