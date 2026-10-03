const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");

// AI Vehicle Search
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please describe the vehicle you need.",
      });
    }

    // Extract vehicle requirements using Groq AI
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
              content: `You are an intelligent vehicle rental search assistant.

Your task is to understand the user's vehicle requirements and
extract them into JSON.

Return ONLY valid JSON with these fields:
{
  "type": "",
  "brand": "",
  "seats": null,
  "maxBudget": null,
  "fuel": "",
  "transmission": "",
  "keywords": []
}

IMPORTANT RULES:

1. VEHICLE TYPE:
- Extract only a specific vehicle category when explicitly requested.
- Examples: SUV, sedan, hatchback, van.
- "Family car" is a usage preference, NOT a vehicle type.
- If the user says "family car", leave type as an empty string.
- Do not set type to "car" unless it is a specific category
  supported by the user's request.

2. SEATS:
- Extract the requested number of seats.
- "7 seater" means seats = 7.
- "5 seater" means seats = 5.
- If no seat count is mentioned, use null.

3. BUDGET:
- Extract the maximum daily rental budget.
- "Under 3000" means maxBudget = 3000.
- If no budget is mentioned, use null.

4. BRAND:
- Extract the brand only if the user mentions one.
- Otherwise, use an empty string.

5. FUEL:
- Extract fuel type only if mentioned.
- Examples: petrol, diesel, electric, CNG.
- Otherwise, use an empty string.

6. TRANSMISSION:
- Extract transmission only if mentioned.
- Examples: manual, automatic.
- Otherwise, use an empty string.

7. KEYWORDS:
- Extract useful preferences such as family, spacious,
  comfortable, luggage, and long-distance.
- Do not use these keywords as strict database filters.

8. Do not invent requirements.
9. Use empty strings or null when information is missing.
10. Return valid JSON only. Do not include markdown.`,
            },
            {
              role: "user",
              content: prompt.trim(),
            },
          ],
          temperature: 0.2,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);

      return res.status(502).json({
        success: false,
        message: "AI service is temporarily unavailable.",
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    // Parse AI JSON response
    const cleanContent = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonStart = cleanContent.indexOf("{");
    const jsonEnd = cleanContent.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI returned invalid JSON.");
    }

    const requirements = JSON.parse(
      cleanContent.substring(jsonStart, jsonEnd + 1)
    );

    // Get all available vehicles from MongoDB
    const vehicles = await Vehicle.find({ available: true });

    // Normalize text values to avoid case and missing-value errors
    const normalize = (value) =>
      String(value ?? "").trim().toLowerCase();

    // Filter vehicles based on AI requirements
    const matchedVehicles = vehicles.filter((vehicle) => {
      const vehicleType = normalize(vehicle.type);
      const vehicleBrand = normalize(vehicle.brand);
      const vehicleFuel = normalize(vehicle.fuel);
      const vehicleTransmission = normalize(vehicle.transmission);

      // Vehicle type filter
      // Family car is not treated as a strict vehicle type.
      if (
        requirements.type &&
        !vehicleType.includes(normalize(requirements.type))
      ) {
        return false;
      }

      // Brand filter
      if (
        requirements.brand &&
        !vehicleBrand.includes(normalize(requirements.brand))
      ) {
        return false;
      }

      // Seat filter
      if (
        requirements.seats !== null &&
        requirements.seats !== undefined &&
        Number(vehicle.seats) < Number(requirements.seats)
      ) {
        return false;
      }

      // Maximum budget filter
      if (
        requirements.maxBudget !== null &&
        requirements.maxBudget !== undefined &&
        Number(vehicle.pricePerDay) > Number(requirements.maxBudget)
      ) {
        return false;
      }

      // Fuel filter
      if (
        requirements.fuel &&
        !vehicleFuel.includes(normalize(requirements.fuel))
      ) {
        return false;
      }

      // Transmission filter
      if (
        requirements.transmission &&
        !vehicleTransmission.includes(
          normalize(requirements.transmission)
        )
      ) {
        return false;
      }

      return true;
    });

    // Return matching vehicles and extracted requirements
    return res.json({
      success: true,
      requirements,
      total: matchedVehicles.length,
      vehicles: matchedVehicles,
    });
  } catch (error) {
    console.error("AI search error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your AI search.",
    });
  }
});

module.exports = router;