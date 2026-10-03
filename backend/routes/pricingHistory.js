const express = require("express");
const router = express.Router();

const PricingHistory = require("../models/PricingHistory");
const adminAuth = require("../middleware/adminAuth");

// Admin only: Get pricing history
router.get("/", adminAuth, async (req, res) => {
  try {
    const history = await PricingHistory.find()
      .populate("vehicle", "name brand pricePerDay")
      .sort({ changedAt: -1 });

    res.json({
      success: true,
      total: history.length,
      history,
    });
  } catch (error) {
    console.error("Pricing history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing history.",
    });
  }
});

module.exports = router;