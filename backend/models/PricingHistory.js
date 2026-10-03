const mongoose = require("mongoose");

const pricingHistorySchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    oldPrice: {
      type: Number,
      required: true,
    },

    newPrice: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "High Demand",
        "Low Demand",
        "Late Return",
        "Admin Rate Update",
        "Normal Price",
      ],
      required: true,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PricingHistory",
  pricingHistorySchema
);