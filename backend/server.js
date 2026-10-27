const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Robust dotenv resolution regardless of working directory
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Vehicle = require("./models/Vehicle");
const Rating = require("./models/Rating");
const Booking = require("./models/Booking");
const PricingHistory = require("./models/PricingHistory");
const adminAuth = require("./middleware/adminAuth");

const bookingRoutes = require("./routes/booking");
const authRoutes = require("./routes/auth");
const aiSearchRoutes = require("./routes/aiSearch");
const feedbackRoutes = require("./routes/feedback");
const notificationRoutes = require("./routes/notifications");
const pricingHistoryRoutes = require("./routes/pricingHistory");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Middleware: CORS and body parsers mounted first
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pricing-history", pricingHistoryRoutes);
app.use("/api/ai-search", aiSearchRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);

// MongoDB Connection with resilient options
if (!process.env.MONGO_URI) {
  console.error("CRITICAL: MONGO_URI is missing from environment (.env).");
}

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((error) => console.error("MongoDB Connection Error:", error.message));

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection runtime error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected from MongoDB. Reconnecting...");
});

// Healthcheck Test API
app.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    success: true,
    message: "SmartRent Backend is running!",
    database: dbState === 1 ? "connected" : "connecting/disconnected",
  });
});

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: "ok",
    database: dbState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// CUSTOMER: SUBMIT OR UPDATE VEHICLE RATING
// ==========================================
app.post("/api/vehicles/:id/rating", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rating } = req.body || {};

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID or user ID.",
      });
    }

    const ratingValue = Number(rating);

    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    const eligibleBooking = await Booking.findOne({
      user: userId,
      vehicle: id,
      status: { $in: ["Returned", "Completed"] },
    });

    if (!eligibleBooking) {
      return res.status(403).json({
        success: false,
        message: "You can rate only vehicles you have completed renting.",
      });
    }

    await Rating.findOneAndUpdate(
      { user: userId, vehicle: id },
      { $set: { rating: ratingValue } },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const ratingSummary = await Rating.aggregate([
      {
        $match: {
          vehicle: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: "$vehicle",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const summary = ratingSummary[0] || {
      averageRating: 0,
      reviewCount: 0,
    };

    vehicle.rating = Number(summary.averageRating.toFixed(1));
    await vehicle.save();

    return res.json({
      success: true,
      message: "Rating submitted successfully.",
      rating: vehicle.rating,
      reviewCount: summary.reviewCount,
    });
  } catch (error) {
    console.error("Rating submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit rating.",
    });
  }
});

// ==========================================
// CUSTOMER: GET TOP-RATED VEHICLES
// ==========================================
app.get("/api/vehicles/top-rated", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

    const vehicles = await Vehicle.find({
      rating: { $gt: 0 },
      isArchived: { $ne: true },
    })
      .sort({ rating: -1, name: 1 })
      .limit(limit);

    return res.json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("Fetch top-rated vehicles error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch top-rated vehicles.",
    });
  }
});

// ==========================================
// CUSTOMER: COLLABORATIVE VEHICLE RECOMMENDATIONS
// ==========================================
app.get("/api/vehicles/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const rentalStatuses = ["Rented", "Returned", "Completed"];

    const userBookings = await Booking.find({
      user: userId,
      status: { $in: rentalStatuses },
    }).select("vehicle");

    const userVehicleIds = [
      ...new Set(userBookings.map((b) => b.vehicle.toString())),
    ];

    if (userVehicleIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        recommendations: [],
        message: "No rental history found to generate recommendations.",
      });
    }

    const similarCustomerBookings = await Booking.find({
      vehicle: { $in: userVehicleIds },
      user: { $ne: userId },
      status: { $in: rentalStatuses },
    }).select("user vehicle");

    const similarityScores = new Map();
    for (const b of similarCustomerBookings) {
      const sUserId = b.user.toString();
      similarityScores.set(sUserId, (similarityScores.get(sUserId) || 0) + 1);
    }

    const similarUserIds = [...similarityScores.keys()];

    if (similarUserIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        recommendations: [],
        message: "No similar rental history found yet.",
      });
    }

    const candidateBookings = await Booking.find({
      user: { $in: similarUserIds },
      vehicle: { $nin: userVehicleIds },
      status: { $in: rentalStatuses },
    }).select("user vehicle");

    const recommendationScores = new Map();
    for (const b of candidateBookings) {
      const vId = b.vehicle.toString();
      const cId = b.user.toString();
      const sim = similarityScores.get(cId) || 0;
      recommendationScores.set(vId, (recommendationScores.get(vId) || 0) + sim);
    }

    if (recommendationScores.size === 0) {
      return res.json({
        success: true,
        count: 0,
        recommendations: [],
        message: "No new vehicle recommendations are available.",
      });
    }

    const candidateIds = [...recommendationScores.keys()];
    const vehicles = await Vehicle.find({
      _id: { $in: candidateIds },
      available: true,
      isArchived: { $ne: true },
    }).lean();

    const recommendations = vehicles
      .map((vehicle) => ({
        ...vehicle,
        recommendationScore: recommendationScores.get(vehicle._id.toString()) || 0,
        recommendationReason: "Recommended based on customers with similar rental history.",
      }))
      .sort(
        (a, b) =>
          b.recommendationScore - a.recommendationScore ||
          Number(b.rating || 0) - Number(a.rating || 0)
      )
      .slice(0, limit);

    return res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("Vehicle recommendation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate vehicle recommendations.",
    });
  }
});

// ==========================================
// GET SINGLE VEHICLE DETAILS (BY ID)
// ==========================================
app.get("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format.",
      });
    }

    const vehicle = await Vehicle.findById(id).lean();

    if (!vehicle || vehicle.isArchived) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    // Get rating count and average
    const ratings = await Rating.find({ vehicle: id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const reviewCount = await Rating.countDocuments({ vehicle: id });

    // Check recent bookings to see active rental status
    const activeBooking = await Booking.findOne({
      vehicle: id,
      status: { $in: ["Pending", "Confirmed", "Rented"] },
    }).sort({ returnDate: -1 });

    return res.status(200).json({
      success: true,
      vehicle: {
        ...vehicle,
        reviewCount,
      },
      ratings,
      activeBooking: activeBooking ? {
        pickupDate: activeBooking.pickupDate,
        returnDate: activeBooking.returnDate,
        status: activeBooking.status,
      } : null,
    });
  } catch (error) {
    console.error("Fetch vehicle by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch vehicle details.",
    });
  }
});

// ==========================================
// GET ALL VEHICLES WITH ADVANCED SEARCH, FILTERS & SORT
// ==========================================
app.get("/api/vehicles", async (req, res) => {
  try {
    const {
      search,
      brand,
      type,
      fuel,
      transmission,
      seats,
      minPrice,
      maxPrice,
      available,
      pickupDate,
      returnDate,
      sort = "name_asc",
      includeArchived = "false",
    } = req.query;

    const filter = {};

    if (includeArchived !== "true") {
      filter.isArchived = { $ne: true };
    }

    // Text search by name, brand, or model
    if (search && search.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { type: searchRegex },
      ];
    }

    // Brand filter
    if (brand && brand.trim() && brand.toLowerCase() !== "all") {
      filter.brand = {
        $regex: `^${brand.trim()}$`,
        $options: "i",
      };
    }

    // Type / category filter
    if (type && type.trim() && type.toLowerCase() !== "all") {
      filter.type = {
        $regex: `^${type.trim()}$`,
        $options: "i",
      };
    }

    // Fuel filter
    if (fuel && fuel.trim() && fuel.toLowerCase() !== "all") {
      filter.fuel = {
        $regex: `^${fuel.trim()}$`,
        $options: "i",
      };
    }

    // Transmission filter
    if (transmission && transmission.trim() && transmission.toLowerCase() !== "all") {
      filter.transmission = {
        $regex: `^${transmission.trim()}$`,
        $options: "i",
      };
    }

    // Seats filter
    if (seats && Number(seats) > 0) {
      filter.seats = { $gte: Number(seats) };
    }

    // Price range filters
    if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice))) {
      filter.pricePerDay = { ...(filter.pricePerDay || {}), $gte: Number(minPrice) };
    }
    if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice))) {
      filter.pricePerDay = { ...(filter.pricePerDay || {}), $lte: Number(maxPrice) };
    }

    // Direct availability filter
    if (available !== undefined && available !== "all" && available !== "") {
      filter.available = available.toLowerCase() === "true";
    }

    // Date availability filter: exclude vehicles with overlapping active bookings
    if (pickupDate && returnDate) {
      const pDate = new Date(pickupDate);
      const rDate = new Date(returnDate);

      if (!isNaN(pDate.getTime()) && !isNaN(rDate.getTime()) && rDate > pDate) {
        const overlappingBookings = await Booking.find({
          status: { $in: ["Pending", "Confirmed", "Rented"] },
          pickupDate: { $lte: rDate },
          returnDate: { $gte: pDate },
        }).select("vehicle");

        const bookedVehicleIds = overlappingBookings.map((b) => b.vehicle);
        if (bookedVehicleIds.length > 0) {
          filter._id = { ...(filter._id || {}), $nin: bookedVehicleIds };
        }
      }
    }

    // Sorting configuration
    let sortOption = { name: 1 };
    switch (sort) {
      case "price_asc":
        sortOption = { pricePerDay: 1 };
        break;
      case "price_desc":
        sortOption = { pricePerDay: -1 };
        break;
      case "rating_desc":
        sortOption = { rating: -1, name: 1 };
        break;
      case "popularity":
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { name: 1 };
        break;
    }

    const vehicles = await Vehicle.find(filter).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("Fetch vehicles error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN: ADD NEW VEHICLE
// ==========================================
app.post("/api/vehicles", adminAuth, async (req, res) => {
  try {
    const {
      name,
      brand,
      type,
      pricePerDay,
      image,
      seats,
      fuel,
      transmission,
      description,
      mileage,
      engineCapacity,
      luggageCapacity,
      modelYear,
      featured,
      available = true,
    } = req.body;

    if (!name || !brand || !type || pricePerDay === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, brand, type, and pricePerDay are required.",
      });
    }

    const vehicle = new Vehicle({
      name: name.trim(),
      brand: brand.trim(),
      type: type.trim(),
      pricePerDay: Number(pricePerDay),
      image: image || "",
      seats: seats ? Number(seats) : 5,
      fuel: fuel || "Petrol",
      transmission: transmission || "Manual",
      description: description ? description.trim() : "",
      mileage: mileage ? mileage.trim() : "",
      engineCapacity: engineCapacity ? engineCapacity.trim() : "",
      luggageCapacity: luggageCapacity ? luggageCapacity.trim() : "",
      modelYear: modelYear ? Number(modelYear) : null,
      featured: Boolean(featured),
      available: Boolean(available),
      isArchived: false,
    });

    const savedVehicle = await vehicle.save();

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: savedVehicle,
    });
  } catch (error) {
    console.error("Add vehicle error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN: UPDATE FULL VEHICLE DETAILS
// ==========================================
app.put("/api/vehicles/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format.",
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    const oldPrice = Number(vehicle.pricePerDay);
    const newPrice = req.body.pricePerDay !== undefined ? Number(req.body.pricePerDay) : oldPrice;

    if (newPrice <= 0 || isNaN(newPrice)) {
      return res.status(400).json({
        success: false,
        message: "Price per day must be a valid positive number.",
      });
    }

    // Apply updates
    if (req.body.name) vehicle.name = req.body.name.trim();
    if (req.body.brand) vehicle.brand = req.body.brand.trim();
    if (req.body.type) vehicle.type = req.body.type.trim();
    vehicle.pricePerDay = newPrice;
    if (req.body.image !== undefined) vehicle.image = req.body.image;
    if (req.body.seats !== undefined) vehicle.seats = Number(req.body.seats);
    if (req.body.fuel) vehicle.fuel = req.body.fuel;
    if (req.body.transmission) vehicle.transmission = req.body.transmission;
    if (req.body.description !== undefined) vehicle.description = req.body.description.trim();
    if (req.body.available !== undefined) vehicle.available = Boolean(req.body.available);
    if (req.body.mileage !== undefined) vehicle.mileage = req.body.mileage.trim();
    if (req.body.engineCapacity !== undefined) vehicle.engineCapacity = req.body.engineCapacity.trim();
    if (req.body.luggageCapacity !== undefined) vehicle.luggageCapacity = req.body.luggageCapacity.trim();
    if (req.body.modelYear !== undefined) vehicle.modelYear = req.body.modelYear ? Number(req.body.modelYear) : null;
    if (req.body.featured !== undefined) vehicle.featured = Boolean(req.body.featured);

    await vehicle.save();

    // Log price update if price changed
    if (oldPrice !== newPrice) {
      await PricingHistory.create({
        vehicle: vehicle._id,
        oldPrice: oldPrice,
        newPrice: newPrice,
        reason: "Admin Rate Update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      vehicle,
    });
  } catch (error) {
    console.error("Update vehicle error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle.",
    });
  }
});

// Also support PATCH /api/vehicles/:id for partial updates
app.patch("/api/vehicles/:id", adminAuth, async (req, res) => {
  // Delegate to same update handler
  return app._router.handle({ ...req, method: "PUT" }, res);
});

// ==========================================
// ADMIN: UPDATE VEHICLE RATE (Backward Compatible)
// ==========================================
app.patch("/api/vehicles/:id/rate", adminAuth, async (req, res) => {
  try {
    const pricePerDay = Number(req.body.pricePerDay);

    if (
      req.body.pricePerDay === undefined ||
      req.body.pricePerDay === null ||
      req.body.pricePerDay === "" ||
      !Number.isFinite(pricePerDay) ||
      pricePerDay <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "pricePerDay must be a number greater than 0",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const oldPrice = Number(vehicle.pricePerDay);
    vehicle.pricePerDay = pricePerDay;
    await vehicle.save();

    if (oldPrice !== pricePerDay) {
      await PricingHistory.create({
        vehicle: vehicle._id,
        oldPrice: oldPrice,
        newPrice: pricePerDay,
        reason: "Admin Rate Update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle rate updated successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Vehicle rate update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle rate.",
    });
  }
});

// ==========================================
// ADMIN: DELETE OR ARCHIVE VEHICLE
// Non-destructive: preserves historical records
// ==========================================
app.delete("/api/vehicles/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID format.",
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    // Check for active bookings
    const activeBooking = await Booking.findOne({
      vehicle: id,
      status: { $in: ["Pending", "Confirmed", "Rented"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete or archive vehicle while active bookings exist.",
      });
    }

    // Check for past booking history
    const pastBooking = await Booking.findOne({ vehicle: id });

    if (pastBooking) {
      // Historical bookings exist: safely archive instead of breaking relations
      vehicle.isArchived = true;
      vehicle.available = false;
      await vehicle.save();

      return res.status(200).json({
        success: true,
        message: "Vehicle has past booking records and was safely archived to maintain historical data integrity.",
        archived: true,
      });
    }

    // No bookings ever recorded: can safely remove
    await Vehicle.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully.",
      archived: false,
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete vehicle.",
    });
  }
});

// ==========================================
// INDIAN CAR MODELS FOR SEEDING
// ==========================================
const indianCars = [
  { name: "Swift", brand: "Maruti Suzuki", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Dzire", brand: "Maruti Suzuki", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Baleno", brand: "Maruti Suzuki", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Brezza", brand: "Maruti Suzuki", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Ertiga", brand: "Maruti Suzuki", type: "MUV", seats: 7, fuel: "Petrol" },
  { name: "Fronx", brand: "Maruti Suzuki", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Grand Vitara", brand: "Maruti Suzuki", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Wagon R", brand: "Maruti Suzuki", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Alto K10", brand: "Maruti Suzuki", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Creta", brand: "Hyundai", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Venue", brand: "Hyundai", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "i20", brand: "Hyundai", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Exter", brand: "Hyundai", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Verna", brand: "Hyundai", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Alcazar", brand: "Hyundai", type: "SUV", seats: 7, fuel: "Petrol" },
  { name: "Aura", brand: "Hyundai", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Nexon", brand: "Tata", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Punch", brand: "Tata", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Harrier", brand: "Tata", type: "SUV", seats: 5, fuel: "Diesel" },
  { name: "Safari", brand: "Tata", type: "SUV", seats: 7, fuel: "Diesel" },
  { name: "Altroz", brand: "Tata", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Tiago", brand: "Tata", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Tigor", brand: "Tata", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Thar", brand: "Mahindra", type: "SUV", seats: 4, fuel: "Diesel" },
  { name: "Scorpio N", brand: "Mahindra", type: "SUV", seats: 7, fuel: "Diesel" },
  { name: "Scorpio Classic", brand: "Mahindra", type: "SUV", seats: 7, fuel: "Diesel" },
  { name: "XUV700", brand: "Mahindra", type: "SUV", seats: 7, fuel: "Diesel" },
  { name: "XUV 3XO", brand: "Mahindra", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Bolero", brand: "Mahindra", type: "SUV", seats: 7, fuel: "Diesel" },
  { name: "Innova Crysta", brand: "Toyota", type: "MUV", seats: 7, fuel: "Diesel" },
  { name: "Innova Hycross", brand: "Toyota", type: "MUV", seats: 7, fuel: "Petrol" },
  { name: "Fortuner", brand: "Toyota", type: "SUV", seats: 7, fuel: "Diesel" },
  { name: "Glanza", brand: "Toyota", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Urban Cruiser Hyryder", brand: "Toyota", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Seltos", brand: "Kia", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Sonet", brand: "Kia", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Carens", brand: "Kia", type: "MUV", seats: 7, fuel: "Petrol" },
  { name: "Syros", brand: "Kia", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "City", brand: "Honda", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Amaze", brand: "Honda", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Elevate", brand: "Honda", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Kwid", brand: "Renault", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Kiger", brand: "Renault", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Triber", brand: "Renault", type: "MUV", seats: 7, fuel: "Petrol" },
  { name: "Magnite", brand: "Nissan", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Hector", brand: "MG", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Astor", brand: "MG", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Comet EV", brand: "MG", type: "Hatchback", seats: 4, fuel: "Electric" },
  { name: "Windsor EV", brand: "MG", type: "SUV", seats: 5, fuel: "Electric" },
  { name: "Virtus", brand: "Volkswagen", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Taigun", brand: "Volkswagen", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Slavia", brand: "Skoda", type: "Sedan", seats: 5, fuel: "Petrol" },
  { name: "Kushaq", brand: "Skoda", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Kylaq", brand: "Skoda", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "C3", brand: "Citroen", type: "Hatchback", seats: 5, fuel: "Petrol" },
  { name: "Aircross", brand: "Citroen", type: "SUV", seats: 5, fuel: "Petrol" },
  { name: "Compass", brand: "Jeep", type: "SUV", seats: 5, fuel: "Diesel" },
  { name: "Meridian", brand: "Jeep", type: "SUV", seats: 7, fuel: "Diesel" },
  { name: "Atto 3", brand: "BYD", type: "SUV", seats: 5, fuel: "Electric" },
  { name: "eMAX 7", brand: "BYD", type: "MUV", seats: 7, fuel: "Electric" },
  { name: "Seal", brand: "BYD", type: "Sedan", seats: 5, fuel: "Electric" },
];

async function getCarImage(carName, brand) {
  const search = encodeURIComponent(`${brand} ${carName} car`);
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${search}&gsrnamespace=6&gsrlimit=5` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return "";

    const page = Object.values(pages).find((p) =>
      /\.(jpg|jpeg|png|webp)$/i.test(p.title)
    );

    return (
      page?.imageinfo?.[0]?.thumburl ||
      page?.imageinfo?.[0]?.url ||
      ""
    );
  } catch (error) {
    return "";
  }
}

// Import cars
app.post("/api/vehicles/import-indian-cars", adminAuth, async (req, res) => {
  try {
    const results = [];

    for (const car of indianCars) {
      const existing = await Vehicle.findOne({
        name: car.name,
        brand: car.brand,
      });

      if (existing) {
        results.push({ name: car.name, status: "Already exists" });
        continue;
      }

      const image = await getCarImage(car.name, car.brand);

      const vehicle = new Vehicle({
        ...car,
        pricePerDay: 1500,
        transmission: "Manual",
        rating: 4.0,
        description: `${car.brand} ${car.name}`,
        image,
        available: true,
      });

      await vehicle.save();
      results.push({
        name: car.name,
        status: "Added",
        imageFound: Boolean(image),
      });
    }

    res.json({
      success: true,
      message: "Car import completed",
      count: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update images
app.post("/api/vehicles/update-all-images", adminAuth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isArchived: { $ne: true } });
    const results = [];

    for (const vehicle of vehicles) {
      const image = await getCarImage(vehicle.name, vehicle.brand);
      if (image) {
        vehicle.image = image;
        await vehicle.save();
        results.push({ name: vehicle.name, status: "Image updated" });
      } else {
        results.push({ name: vehicle.name, status: "Image not found" });
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    res.json({
      success: true,
      message: "Image update completed",
      total: vehicles.length,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
