const express = require("express");
const feedbackRoutes = require("./routes/feedback");
const pricingHistoryRoutes = require("./routes/pricingHistory");
const dashboardRoutes = require("./routes/dashboard");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Vehicle = require("./models/Vehicle");
const Rating = require("./models/Rating");
const Booking = require("./models/Booking");
const PricingHistory = require("./models/PricingHistory");
const adminAuth = require("./middleware/adminAuth");

const bookingRoutes = require("./routes/booking");
const authRoutes = require("./routes/auth");
const aiSearchRoutes = require("./routes/aiSearch");
const notificationRoutes = require("./routes/notifications");

const app = express();

// Middleware
app.use(cors());
app.use("/api/pricing-history", pricingHistoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/bookings", express.json(), bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai-search", aiSearchRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((error) => console.error("MongoDB Error:", error.message));

// Test API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartRent Backend is running!",
  });
});

// ==========================================
// CUSTOMER: SUBMIT OR UPDATE VEHICLE RATING
// ==========================================
app.post("/api/vehicles/:id/rating", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rating } = req.body || {};

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID or user ID.",
      });
    }

    const ratingValue = Number(rating);

    if (
      !Number.isInteger(ratingValue) ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
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
        message: "You can rate only vehicles you have returned.",
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
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 5, 1),
      20
    );

    const vehicles = await Vehicle.find({
      rating: { $gt: 0 },
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
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 5, 1),
      20
    );

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
      ...new Set(
        userBookings.map((booking) => booking.vehicle.toString())
      ),
    ];

    if (userVehicleIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        recommendations: [],
        message: "No rental history found to generate recommendations.",
      });
    }

    // Find customers who rented at least one of the same vehicles.
    const similarCustomerBookings = await Booking.find({
      vehicle: { $in: userVehicleIds },
      user: { $ne: userId },
      status: { $in: rentalStatuses },
    }).select("user vehicle");

    const similarityScores = new Map();

    for (const booking of similarCustomerBookings) {
      const similarUserId = booking.user.toString();

      similarityScores.set(
        similarUserId,
        (similarityScores.get(similarUserId) || 0) + 1
      );
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

    // Count candidate vehicles rented by similar customers.
    const candidateBookings = await Booking.find({
      user: { $in: similarUserIds },
      vehicle: { $nin: userVehicleIds },
      status: { $in: rentalStatuses },
    }).select("user vehicle");

    const recommendationScores = new Map();

    for (const booking of candidateBookings) {
      const vehicleId = booking.vehicle.toString();
      const customerId = booking.user.toString();
      const similarity = similarityScores.get(customerId) || 0;

      recommendationScores.set(
        vehicleId,
        (recommendationScores.get(vehicleId) || 0) + similarity
      );
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
    }).lean();

    const recommendations = vehicles
      .map((vehicle) => ({
        ...vehicle,
        recommendationScore:
          recommendationScores.get(vehicle._id.toString()) || 0,
        recommendationReason:
          "Recommended based on customers with similar rental history.",
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
// GET ALL VEHICLES WITH SEARCH AND FILTERS
// ==========================================
app.get("/api/vehicles", async (req, res) => {
  try {
    const { search, brand, type, fuel, available } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
      ];
    }

    if (brand && brand.trim()) {
      filter.brand = {
        $regex: brand.trim(),
        $options: "i",
      };
    }

    if (type && type.trim()) {
      filter.type = {
        $regex: type.trim(),
        $options: "i",
      };
    }

    if (fuel && fuel.trim()) {
      filter.fuel = {
        $regex: fuel.trim(),
        $options: "i",
      };
    }

    if (available !== undefined) {
      filter.available = available.toLowerCase() === "true";
    }

    const vehicles = await Vehicle.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({
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
    const vehicle = new Vehicle(req.body);
    const savedVehicle = await vehicle.save();

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: savedVehicle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN: UPDATE VEHICLE RATE
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

    // Get existing vehicle
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Store old price
    const oldPrice = Number(vehicle.pricePerDay);

    // Update new price
    vehicle.pricePerDay = pricePerDay;
    await vehicle.save();

    // Save admin rate change in pricing history
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
// INDIAN CAR MODELS
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

// ==========================================
// SEARCH WIKIMEDIA COMMONS FOR CAR IMAGES
// ==========================================
async function getCarImage(carName, brand) {
  const search = encodeURIComponent(`${brand} ${carName} car`);

  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${search}&gsrnamespace=6&gsrlimit=5` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Image API returned ${response.status}`);
    }

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
    console.error(
      `Image search failed for ${brand} ${carName}:`,
      error.message
    );
    return "";
  }
}

// ==========================================
// IMPORT CAR MODELS
// ==========================================
app.post(
  "/api/vehicles/import-indian-cars",
  adminAuth,
  async (req, res) => {
    try {
      const results = [];

      for (const car of indianCars) {
        const existing = await Vehicle.findOne({
          name: car.name,
          brand: car.brand,
        });

        if (existing) {
          results.push({
            name: car.name,
            status: "Already exists",
          });
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
  }
);

// ==========================================
// UPDATE IMAGES FOR ALL VEHICLES
// ==========================================
app.post(
  "/api/vehicles/update-all-images",
  adminAuth,
  async (req, res) => {
    try {
      const vehicles = await Vehicle.find();
      const results = [];

      for (const vehicle of vehicles) {
        const image = await getCarImage(vehicle.name, vehicle.brand);

        if (image) {
          vehicle.image = image;
          await vehicle.save();

          results.push({
            name: vehicle.name,
            status: "Image updated",
          });
        } else {
          results.push({
            name: vehicle.name,
            status: "Image not found",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
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
  }
);

// ==========================================
// START SERVER
// ==========================================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});