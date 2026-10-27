const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");

const VALID_TYPES = ["suv", "sedan", "hatchback", "muv"];
const KNOWN_BRANDS = [
  "maruti suzuki",
  "maruti",
  "tata",
  "hyundai",
  "mahindra",
  "toyota",
  "kia",
  "honda",
  "renault",
  "nissan",
  "mg",
  "byd",
  "skoda",
  "volkswagen",
  "jeep",
  "citroen",
];

// Helper: deterministic heuristic extractor when Groq is unavailable or times out
function extractHeuristicRequirements(prompt) {
  const text = String(prompt || "").toLowerCase();

  // Seats: e.g. "7 seater", "5 seats", "7 people"
  let seats = null;
  const seatMatch = text.match(/(\d+)\s*(?:seater|seat|passengers?|people)/i);
  if (seatMatch) {
    seats = parseInt(seatMatch[1], 10);
  }

  // Budget: e.g. "under 3000", "below ₹3500", "budget 2500", "< 4000"
  let maxBudget = null;
  const budgetMatch = text.match(
    /(?:under|below|less than|max|budget|within|upto|up to)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i
  ) || text.match(/(?:rs\.?|₹)\s*(\d+)/i);
  if (budgetMatch) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // Fuel: e.g. "diesel", "petrol", "electric", "ev"
  let fuel = "";
  if (text.includes("diesel")) fuel = "Diesel";
  else if (text.includes("petrol")) fuel = "Petrol";
  else if (text.includes("electric") || text.includes(" ev ")) fuel = "Electric";

  // Transmission: e.g. "automatic", "manual"
  let transmission = "";
  if (text.includes("automatic") || text.includes("auto")) transmission = "Automatic";
  else if (text.includes("manual")) transmission = "Manual";

  // Type: e.g. "suv", "sedan", "hatchback", "muv"
  let type = "";
  for (const vt of VALID_TYPES) {
    if (new RegExp(`\\b${vt}\\b`, "i").test(text)) {
      type = vt.toUpperCase();
      break;
    }
  }

  // Brand
  let brand = "";
  for (const b of KNOWN_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, "i").test(text)) {
      brand = b.charAt(0).toUpperCase() + b.slice(1);
      break;
    }
  }

  return {
    type,
    brand,
    seats,
    maxBudget,
    fuel,
    transmission,
    keywords: prompt.trim().split(/\s+/).slice(0, 5),
  };
}

// AI Vehicle Search
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please describe the vehicle you need.",
      });
    }

    let requirements = null;
    let aiGenerated = false;

    // 1. Attempt Groq AI extraction if API key is present
    if (process.env.GROQ_API_KEY) {
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              messages: [
                {
                  role: "system",
                  content: `You are an intelligent vehicle rental search assistant for SmartRent.
Your task is to analyze customer vehicle queries and return ONLY valid JSON matching this schema:
{
  "type": "",
  "brand": "",
  "seats": null,
  "maxBudget": null,
  "fuel": "",
  "transmission": "",
  "keywords": []
}

CRITICAL RULES:
1. VEHICLE TYPE:
   - Valid fleet categories are ONLY: "SUV", "Sedan", "Hatchback", "MUV".
   - If the user uses generic terms like "car", "cars", "vehicle", "ride", "automobile", "family car", or does not specify an exact category, type MUST be "".
   - NEVER output "car" or "vehicle" as type.
2. SEATS:
   - Minimum number of seats requested (e.g. "7 seater" -> 7, "5 seater" -> 5). Otherwise null.
3. BUDGET:
   - Maximum daily rental price in INR (e.g. "under 3500" -> 3500, "below 2000" -> 2000). Otherwise null.
4. BRAND:
   - Vehicle brand if explicitly mentioned (e.g. Maruti, Tata, Hyundai, Mahindra, Toyota, Kia, Honda). Otherwise "".
5. FUEL:
   - "Petrol", "Diesel", "Electric", or "".
6. TRANSMISSION:
   - "Automatic", "Manual", or "".
7. Output JSON only without markdown formatting.`,
                },
                {
                  role: "user",
                  content: prompt.trim(),
                },
              ],
              temperature: 0.1,
            }),
            signal: AbortSignal.timeout(8500),
          }
        );

        if (response.ok) {
          const aiData = await response.json();
          const rawContent = aiData.choices?.[0]?.message?.content || "";

          // Clean <think>...</think> if returned by reasoning model
          const cleanContent = rawContent
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

          const jsonStart = cleanContent.indexOf("{");
          const jsonEnd = cleanContent.lastIndexOf("}");

          if (jsonStart !== -1 && jsonEnd !== -1) {
            requirements = JSON.parse(
              cleanContent.substring(jsonStart, jsonEnd + 1)
            );
            aiGenerated = true;
          }
        } else {
          console.warn("Groq API returned status:", response.status);
        }
      } catch (aiErr) {
        console.warn("Groq request failed or timed out:", aiErr.message);
      }
    }

    // 2. Deterministic smart fallback if AI service was unavailable
    if (!requirements) {
      requirements = extractHeuristicRequirements(prompt);
      aiGenerated = false;
    }

    // 3. Fetch non-archived vehicles from MongoDB
    const vehicles = await Vehicle.find({ isArchived: { $ne: true } }).lean();

    const normalize = (val) => String(val ?? "").trim().toLowerCase();

    // Sanitize type requirement:
    // If extracted type is not in VALID_TYPES (e.g., "car", "automobile", ""), disregard type filter.
    let targetType = normalize(requirements.type);
    const matchedValidType = VALID_TYPES.find((vt) => targetType.includes(vt));
    targetType = matchedValidType || "";

    const targetBrand = normalize(requirements.brand);
    const targetFuel = normalize(requirements.fuel);
    const targetTransmission = normalize(requirements.transmission);
    const targetSeats =
      requirements.seats !== null && requirements.seats !== undefined
        ? Number(requirements.seats)
        : null;
    const targetBudget =
      requirements.maxBudget !== null && requirements.maxBudget !== undefined
        ? Number(requirements.maxBudget)
        : null;

    // Filter vehicles matching the criteria
    const matchedVehicles = vehicles.filter((vehicle) => {
      const vType = normalize(vehicle.type);
      const vBrand = normalize(vehicle.brand);
      const vFuel = normalize(vehicle.fuel);
      const vTransmission = normalize(vehicle.transmission);

      // Type filter (only if a specific valid type was requested)
      if (targetType && vType !== targetType) {
        return false;
      }

      // Brand filter
      if (
        targetBrand &&
        targetBrand !== "all" &&
        targetBrand !== "any" &&
        targetBrand !== "car"
      ) {
        const brandMatches =
          vBrand.includes(targetBrand) || targetBrand.includes(vBrand);
        if (!brandMatches) return false;
      }

      // Seats filter
      if (targetSeats && Number(vehicle.seats) < targetSeats) {
        return false;
      }

      // Budget filter
      if (targetBudget && Number(vehicle.pricePerDay) > targetBudget) {
        return false;
      }

      // Fuel filter
      if (targetFuel && targetFuel !== "all" && targetFuel !== "any") {
        if (!vFuel.includes(targetFuel) && !targetFuel.includes(vFuel)) {
          return false;
        }
      }

      // Transmission filter
      if (
        targetTransmission &&
        targetTransmission !== "all" &&
        targetTransmission !== "any"
      ) {
        if (
          !vTransmission.includes(targetTransmission) &&
          !targetTransmission.includes(vTransmission)
        ) {
          return false;
        }
      }

      return true;
    });

    // Provide suggested alternatives if strict match found 0 vehicles
    let suggestions = [];
    if (matchedVehicles.length === 0 && (targetSeats || targetBudget)) {
      suggestions = vehicles
        .filter((v) => {
          if (targetSeats && Number(v.seats) >= targetSeats) return true;
          if (targetBudget && Number(v.pricePerDay) <= targetBudget * 1.25)
            return true;
          return false;
        })
        .slice(0, 4);
    }

    return res.json({
      success: true,
      aiGenerated,
      isFallback: !aiGenerated,
      statusMessage: aiGenerated
        ? "AI analyzed your requirements and matched our available fleet."
        : "AI service temporarily busy; smart keyword matching applied.",
      requirements: {
        ...requirements,
        type: targetType ? targetType.toUpperCase() : "Any Category",
      },
      total: matchedVehicles.length,
      vehicles: matchedVehicles,
      suggestions,
    });
  } catch (error) {
    console.error("AI search route error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process AI search at this moment. Please try again.",
    });
  }
});

module.exports = router;
