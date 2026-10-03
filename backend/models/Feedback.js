const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

   email: {
  type: String,
  trim: true,
  lowercase: true,
  default: "",
            },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Admin reply
    reply: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    repliedAt: {
      type: Date,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isReplied: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", feedbackSchema);