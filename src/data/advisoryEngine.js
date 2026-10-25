// Rule-based crop comparison using farmer-selected soil and previous crop.
// Weather is displayed as context but is not currently used in crop scoring.

import { CROPS } from './cropsData';

// 1. Soil Classification Database based on farmer flowchart (Brown, Black, Red/Rock)
export const SOIL_TYPES = {
  black: {
    id: "black",
    name: "Black Cotton Soil (Regur / Vertisol)",
    nameMr: "काळी कसदार जमीन (रेगूर / मध्यम ते भारी काळी)",
    nameHi: "काली कपास मिट्टी (रेगुर / भारी दोमट)",
    color: "#262b33",
    borderAccent: "border-slate-500",
    waterRetention: "High (65 - 75%)",
    drainage: "Moderate to Slow (Prone to cracking in dry heat)",
    phRange: "7.5 - 8.5 (Mildly Alkaline)",
    nativeNutrients: "High Calcium, Magnesium & Carbonates. Deficient in Nitrogen & Zinc.",
    bestCrops: ["cotton", "soybean", "chickpea", "wheat", "pigeonpea", "maize"],
    advisoryNote: "Excellent moisture retention preserves subsoil reserves for Rabi. Avoid excess irrigation during flowering.",
  },
  brown: {
    id: "brown",
    name: "Brown Alluvial / Loam Soil (Inceptisol)",
    nameMr: "तपकिरी पोयटा / गाळाची जमीन (मध्यम भुसभुशीत)",
    nameHi: "भूरी दोमट / जलोढ़ मिट्टी (उपजाऊ एवं भुरभुरी)",
    color: "#784b2c",
    borderAccent: "border-amber-600",
    waterRetention: "Medium (45 - 55%)",
    drainage: "Good to Excellent (Aerated root zone)",
    phRange: "6.5 - 7.5 (Optimal Neutral)",
    nativeNutrients: "Balanced macronutrients, moderate organic carbon. Responds quickly to fertilizers.",
    bestCrops: ["maize", "wheat", "soybean", "mustard", "moong", "rice"],
    advisoryNote: "Versatile soil with high fertilizer efficiency. Requires scheduled irrigation as moisture drains evenly.",
  },
  red_rock: {
    id: "red_rock",
    name: "Red / Rocky / Laterite Soil (Alfisol)",
    nameMr: "तांबडी मुरमाड / खडकाळ जमीन (हलकी ते उथळ)",
    nameHi: "लाल / पथरीली / मुरुमी मिट्टी (उथली एवं जल-निकासी युक्त)",
    color: "#993529",
    borderAccent: "border-rose-600",
    waterRetention: "Low (25 - 35%)",
    drainage: "Rapid (Risk of fast moisture depletion)",
    phRange: "5.5 - 6.8 (Slightly Acidic to Neutral)",
    nativeNutrients: "Rich in Iron & Aluminum oxides. Low Nitrogen, Phosphorus, and Organic Carbon.",
    bestCrops: ["millets", "pigeonpea", "chickpea", "moong", "mustard"],
    advisoryNote: "Drought-vulnerable subsoil. Highly suited for deep-taproot or hardy C4 crops (Millets, Tur, Gram).",
  }
};

// 2. Agricultural Produce Market Committee (APMC) Mandis Directory
export const REGIONAL_MANDIS = [
  {
    id: "mandi-lasalgaon",
    name: "Lasalgaon APMC",
    district: "Nashik, Maharashtra",
    lat: 20.1477,
    lon: 74.2255,
    specialty: "Asia's largest onion & grain hub",
    phone: "+91 2550 266024",
    tradingDays: "Mon - Sat (08:00 AM - 05:00 PM)",
    cropPrices: {
      maize: { min: 2150, modal: 2320, max: 2450, arrivalQuintals: 3400, demand: "High" },
      soybean: { min: 4500, modal: 4780, max: 4950, arrivalQuintals: 5200, demand: "Surging" },
      wheat: { min: 2350, modal: 2480, max: 2600, arrivalQuintals: 2800, demand: "Stable" },
      cotton: { min: 6900, modal: 7350, max: 7600, arrivalQuintals: 1800, demand: "High" },
      chickpea: { min: 5200, modal: 5550, max: 5800, arrivalQuintals: 4100, demand: "Surging" },
      mustard: { min: 5400, modal: 5720, max: 5950, arrivalQuintals: 1500, demand: "Stable" },
      millets: { min: 2300, modal: 2540, max: 2700, arrivalQuintals: 2100, demand: "Moderate" },
      pigeonpea: { min: 7300, modal: 7750, max: 8100, arrivalQuintals: 3100, demand: "High" },
      moong: { min: 8200, modal: 8650, max: 9100, arrivalQuintals: 1200, demand: "Surging" }
    }
  },
  {
    id: "mandi-jalna",
    name: "Jalna Krishi Utpanna Bajar Samiti",
    district: "Jalna, Marathwada",
    lat: 19.8410,
    lon: 75.8864,
    specialty: "Central Marathwada Pulse & Soybean Seed Capital",
    phone: "+91 2482 232115",
    tradingDays: "Mon - Sat (09:00 AM - 06:00 PM)",
    cropPrices: {
      soybean: { min: 4600, modal: 4850, max: 5050, arrivalQuintals: 8500, demand: "Surging" },
      cotton: { min: 7100, modal: 7500, max: 7800, arrivalQuintals: 4600, demand: "High" },
      chickpea: { min: 5350, modal: 5650, max: 5900, arrivalQuintals: 6200, demand: "Surging" },
      pigeonpea: { min: 7450, modal: 7900, max: 8300, arrivalQuintals: 4800, demand: "Surging" },
      maize: { min: 2200, modal: 2360, max: 2480, arrivalQuintals: 3900, demand: "Stable" },
      millets: { min: 2350, modal: 2580, max: 2750, arrivalQuintals: 3100, demand: "High" },
      wheat: { min: 2380, modal: 2500, max: 2620, arrivalQuintals: 2200, demand: "Stable" },
      moong: { min: 8300, modal: 8750, max: 9200, arrivalQuintals: 1900, demand: "Surging" },
      mustard: { min: 5300, modal: 5600, max: 5850, arrivalQuintals: 900, demand: "Moderate" }
    }
  },
  {
    id: "mandi-sambhajinagar",
    name: "Chhatrapati Sambhajinagar APMC (Jadhavwadi)",
    district: "Chhatrapati Sambhajinagar",
    lat: 19.9010,
    lon: 75.3522,
    specialty: "Major wholesale grain and fiber exchange",
    phone: "+91 240 2381412",
    tradingDays: "Daily (07:30 AM - 04:30 PM)",
    cropPrices: {
      cotton: { min: 7050, modal: 7420, max: 7750, arrivalQuintals: 5800, demand: "High" },
      soybean: { min: 4550, modal: 4800, max: 4980, arrivalQuintals: 6200, demand: "Surging" },
      maize: { min: 2180, modal: 2340, max: 2460, arrivalQuintals: 5100, demand: "High" },
      chickpea: { min: 5250, modal: 5580, max: 5850, arrivalQuintals: 3700, demand: "Stable" },
      wheat: { min: 2360, modal: 2490, max: 2610, arrivalQuintals: 3200, demand: "Stable" },
      pigeonpea: { min: 7350, modal: 7800, max: 8200, arrivalQuintals: 2900, demand: "Surging" },
      millets: { min: 2320, modal: 2560, max: 2720, arrivalQuintals: 2800, demand: "High" },
      moong: { min: 8150, modal: 8600, max: 9050, arrivalQuintals: 1400, demand: "Surging" },
      mustard: { min: 5350, modal: 5680, max: 5900, arrivalQuintals: 800, demand: "Moderate" }
    }
  },
  {
    id: "mandi-pune",
    name: "Pune APMC (Gultekdi Market Yard)",
    district: "Pune, Western Maharashtra",
    lat: 18.4965,
    lon: 73.8647,
    specialty: "Highest consumption terminal market in Western India",
    phone: "+91 20 2426 1234",
    tradingDays: "Mon - Sun (06:00 AM - 03:00 PM)",
    cropPrices: {
      soybean: { min: 4700, modal: 4950, max: 5150, arrivalQuintals: 7100, demand: "Surging" },
      wheat: { min: 2450, modal: 2620, max: 2800, arrivalQuintals: 8200, demand: "High" },
      chickpea: { min: 5450, modal: 5780, max: 6100, arrivalQuintals: 5400, demand: "Surging" },
      maize: { min: 2250, modal: 2420, max: 2580, arrivalQuintals: 4600, demand: "High" },
      pigeonpea: { min: 7600, modal: 8100, max: 8550, arrivalQuintals: 4200, demand: "High" },
      moong: { min: 8400, modal: 8900, max: 9400, arrivalQuintals: 2300, demand: "Surging" },
      cotton: { min: 7200, modal: 7550, max: 7900, arrivalQuintals: 1600, demand: "Stable" },
      millets: { min: 2400, modal: 2680, max: 2880, arrivalQuintals: 3600, demand: "High" },
      mustard: { min: 5500, modal: 5850, max: 6100, arrivalQuintals: 1800, demand: "High" }
    }
  },
  {
    id: "mandi-akola",
    name: "Akola Krushi Utpanna Bajar Samiti",
    district: "Akola, Vidarbha",
    lat: 20.7002,
    lon: 77.0082,
    specialty: "Premier Vidarbha Cotton & Pulse Exchange",
    phone: "+91 724 2434522",
    tradingDays: "Mon - Sat (09:30 AM - 06:00 PM)",
    cropPrices: {
      cotton: { min: 7150, modal: 7580, max: 7920, arrivalQuintals: 9200, demand: "Surging" },
      soybean: { min: 4650, modal: 4890, max: 5100, arrivalQuintals: 8900, demand: "High" },
      pigeonpea: { min: 7550, modal: 8050, max: 8450, arrivalQuintals: 6400, demand: "Surging" },
      chickpea: { min: 5380, modal: 5700, max: 5980, arrivalQuintals: 5100, demand: "High" },
      wheat: { min: 2340, modal: 2470, max: 2590, arrivalQuintals: 2600, demand: "Stable" },
      maize: { min: 2150, modal: 2310, max: 2430, arrivalQuintals: 2400, demand: "Moderate" },
      millets: { min: 2310, modal: 2520, max: 2680, arrivalQuintals: 1900, demand: "Moderate" },
      moong: { min: 8250, modal: 8700, max: 9150, arrivalQuintals: 1700, demand: "High" },
      mustard: { min: 5250, modal: 5550, max: 5800, arrivalQuintals: 700, demand: "Moderate" }
    }
  },
  {
    id: "mandi-solapur",
    name: "Solapur Siddheshwar APMC",
    district: "Solapur, Southern Maharashtra",
    lat: 17.6599,
    lon: 75.9064,
    specialty: "Jowar (Millet) & Pulse Capital of South Maharashtra",
    phone: "+91 217 2744510",
    tradingDays: "Mon - Sat (08:00 AM - 05:00 PM)",
    cropPrices: {
      millets: { min: 2480, modal: 2750, max: 3050, arrivalQuintals: 6700, demand: "Surging" },
      pigeonpea: { min: 7500, modal: 7950, max: 8350, arrivalQuintals: 5500, demand: "High" },
      chickpea: { min: 5320, modal: 5640, max: 5920, arrivalQuintals: 4800, demand: "High" },
      soybean: { min: 4580, modal: 4820, max: 5020, arrivalQuintals: 3900, demand: "Stable" },
      wheat: { min: 2390, modal: 2510, max: 2640, arrivalQuintals: 2900, demand: "Stable" },
      maize: { min: 2190, modal: 2350, max: 2470, arrivalQuintals: 3200, demand: "Stable" },
      cotton: { min: 6980, modal: 7380, max: 7680, arrivalQuintals: 2100, demand: "Moderate" },
      moong: { min: 8200, modal: 8650, max: 9100, arrivalQuintals: 1500, demand: "Surging" },
      mustard: { min: 5320, modal: 5620, max: 5870, arrivalQuintals: 650, demand: "Moderate" }
    }
  }
];

// 3. Haversine Distance Formula
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 4. Gridded historical weather summary for display as context.

export function analyzeHistoricalWeather(nasaData) {
  const days = Array.isArray(nasaData?.dailyRecords)
    ? nasaData.dailyRecords
    : [];

  if (days.length === 0) {
    return {
      rainfallTotalMm: null,
      rainfallCoverageDays: 0,
      avgTempC: null,
      temperatureCoverageDays: 0,
      maxTemperatureCoverageDays: 0,
      maxTempC: null,
      extremeHeatDays: null,
      longestDrySpellDays: null,
      moistureStatus: "Not measured",
      moistureScore: null,
      summaryText:
        "Gridded historical weather data are unavailable. Rainfall, temperature and field soil moisture cannot be determined.",
      daysCount: 0,
      period: null,
      hasWeatherData: false
    };
  }

  const validValue = (value) =>
    value !== null &&
    value !== undefined &&
    !(typeof value === "string" && value.trim() === "") &&
    Number.isFinite(Number(value));

  const rainfallValues = days
    .map((day) => day?.precipitationMm)
    .filter((value) => validValue(value) && Number(value) >= 0)
    .map(Number);

  const temperatureValues = days
    .map((day) => day?.tAvg)
    .filter(validValue)
    .map(Number);

  const maxTemperatureValues = days
    .map((day) => day?.tMax)
    .filter(validValue)
    .map(Number);

  const completeRainfall = rainfallValues.length === days.length;
  const totalRain = completeRainfall
    ? rainfallValues.reduce((sum, value) => sum + value, 0)
    : null;

  const avgTemp = temperatureValues.length
    ? temperatureValues.reduce((sum, value) => sum + value, 0) /
      temperatureValues.length
    : null;

  const maxTemp = maxTemperatureValues.length
    ? Math.max(...maxTemperatureValues)
    : null;

  const heatDays = maxTemperatureValues.length
    ? maxTemperatureValues.filter((value) => value >= 37).length
    : null;

  let drySpell = 0;
  let maxDry = 0;

  days.forEach((day) => {
    const rain = day?.precipitationMm;

    if (!validValue(rain) || Number(rain) < 0) {
      drySpell = 0;
    } else if (Number(rain) < 1) {
      drySpell++;
      maxDry = Math.max(maxDry, drySpell);
    } else {
      drySpell = 0;
    }
  });

  return {
    rainfallTotalMm: totalRain === null ? null : Math.round(totalRain),
    rainfallCoverageDays: rainfallValues.length,
    avgTempC:
      avgTemp === null ? null : Math.round(avgTemp * 10) / 10,
    temperatureCoverageDays: temperatureValues.length,
    maxTemperatureCoverageDays: maxTemperatureValues.length,
    maxTempC:
      maxTemp === null ? null : Math.round(maxTemp * 10) / 10,
    extremeHeatDays: heatDays,
    longestDrySpellDays: completeRainfall ? maxDry : null,
    moistureStatus: "Not measured",
    moistureScore: null,
    summaryText: [
      `Gridded historical weather covers ${days.length} days`,
      nasaData.period?.start && nasaData.period?.end
        ? `(${nasaData.period.start} to ${nasaData.period.end})`
        : "",
      `Rainfall coverage: ${rainfallValues.length}/${days.length} days`,
      `average temperature coverage: ${temperatureValues.length}/${days.length} days`,
      `maximum temperature coverage: ${maxTemperatureValues.length}/${days.length} days`,
      "These are retrospective grid estimates, not farm-station observations or a forecast.",
      "Field soil moisture has not been measured."
    ].filter(Boolean).join(" "),
    daysCount: days.length,
    period: nasaData.period ?? null,
    hasWeatherData: true
  };
}


// 5. Core Algorithmic Recommendation Engine (Check Algorithms & Data Set)
export function runAdvisoryAlgorithm({
  lat,
  lon,
  soilTypeId = "black",
  previousCropId = "maize",
  weatherAnalysis
}) {
  const soil = SOIL_TYPES[soilTypeId] || SOIL_TYPES.black;
  const candidateCrops = Object.values(CROPS).filter(
    (c) => c.id !== "cloverCover" // Exclude non-cash cover crop from primary recommendation
  );

  const scoredCrops = candidateCrops.map((crop) => {
    let score = 50; // base score
    const breakdown = {
      weatherFit: 0,
      soilFit: 0,
      rotationBonus: 0
    };

    // A. Weather & Water Demand Match
    // Keep short-window weather as context until crop-stage thresholds are validated.

    // B. Soil Compatibility Match
    if (soil.bestCrops.includes(crop.id)) {
      score += 26;
      breakdown.soilFit = 26;
    } else if (soil.id === "black" && crop.id === "rice") {
      score += 10;
      breakdown.soilFit = 10;
    } else if (soil.id === "red_rock" && (crop.id === "cotton" || crop.id === "maize")) {
      score += 8; // heavy feeder penalty on shallow rocky soil
      breakdown.soilFit = 8;
    } else {
      score += 16;
      breakdown.soilFit = 16;
    }

    // C. Crop Succession & Rotation Rules
    let rotationNote = "";
    if (crop.id === previousCropId) {
      // Monoculture penalty
      score -= 28;
      breakdown.rotationBonus = -28;
      rotationNote = `Avoid repeating ${crop.name} continuously due to insect and soil-borne pest buildup.`;
    } else {
      // Check if candidate crop is explicitly recommended after previous crop
      const prevCropData = CROPS[previousCropId];
      const matchInSuccession = prevCropData?.successionRecommendations?.find(
        (r) => r.nextCropId === crop.id
      );

      if (matchInSuccession) {
        if (matchInSuccession.suitability === "High") {
          score += 28;
          breakdown.rotationBonus = 28;
          rotationNote = `The crop catalog marks this as a high rotation fit after ${prevCropData.name}; local pest, soil, and season conditions are not assessed.`;
        } else {
          score += 15;
          breakdown.rotationBonus = 15;
          rotationNote = `The crop catalog marks this as a moderate rotation fit after ${prevCropData.name}; local pest, soil, and season conditions are not assessed.`;
        }
      } else {
        // General Cereal <-> Legume alternation check
        const isPrevLegume = prevCropData?.category === "Legume";
        const isCurrLegume = crop.category === "Legume";

        if (isPrevLegume && !isCurrLegume) {
          score += 22;
          breakdown.rotationBonus = 22;
          rotationNote = "A legume in the rotation may contribute nitrogen, but any carryover depends on crop growth and residue management.";
        } else if (!isPrevLegume && isCurrLegume) {
          score += 24;
          breakdown.rotationBonus = 24;
          rotationNote = "A legume can contribute nitrogen under suitable conditions; this rule does not estimate soil nitrogen or carryover.";
        } else {
          score += 10;
          breakdown.rotationBonus = 10;
          rotationNote = `Standard rotation sequence with diversified nutrient uptake.`;
        }
      }
    }

    // Rule-based fit only; static catalog prices do not affect crop ranking.
    const resilienceScore =
      (crop.waterCategory === "Low" ? 40 : crop.waterCategory === "Medium" ? 25 : 10) +
      (soil.bestCrops.includes(crop.id) ? 35 : 15) +
      (crop.category === "Millet" || crop.category === "Legume" ? 25 : 10);

    return {
      crop,
      totalScore: Math.max(0, score),
      resilienceScore,
      breakdown,
      rotationNote
    };
  });

  // Sort candidates by total score
  const sortedByScore = [...scoredCrops].sort((a, b) => b.totalScore - a.totalScore);

  // P-1 is the highest soil-and-rotation rule score, not a yield prediction.
  const p1Candidate = sortedByScore[0];

  // P-2 is a heuristic resilience alternative, not a climate forecast.
  const remainingForP2 = sortedByScore.filter((sc) => sc.crop.id !== p1Candidate.crop.id);
  remainingForP2.sort((a, b) => b.resilienceScore - a.resilienceScore);
  const p2Candidate = remainingForP2[0] || sortedByScore[1];

  // Build full profiles for P-1 and P-2
  const p1 = buildCropStrategicProfile(p1Candidate, "P-1", soil, previousCropId, lat, lon);
  const p2 = buildCropStrategicProfile(p2Candidate, "P-2", soil, previousCropId, lat, lon);
  const rankedCrops = sortedByScore.map((item) => ({
    ...item,
    rank: sortedByScore.findIndex(
      (candidate) => candidate.totalScore === item.totalScore
    ) + 1
  }));

  return {
    soil,
    previousCrop: CROPS[previousCropId] || CROPS.maize,
    weatherAnalysis,
    rankedCrops,
    p1,
    p2
  };
}

// 6. Strategic Profile Builder with Fertilizer Schedule, Economics & Mandis
function buildCropStrategicProfile(scoredItem, priorityBadge, soil, previousCropId, lat, lon) {
  const { crop, totalScore, resilienceScore, rotationNote } = scoredItem;

  // A. Fertilizer Protocol ("Suggest crop <---> fertilizer")
  const fertilizerSchedule = generateFertilizerSchedule(crop, soil, previousCropId);

  // B. Pricing & Production Economics ("prizing")
  const economics = calculateCropEconomics(crop);

  // C. Nearby Mandis & Selling Market Access ("* market [selling market]")
  const nearbyMandis = getNearestMandis(crop.id, lat, lon);

  return {
    priority: priorityBadge,
    title: priorityBadge === "P-1"
      ? "Highest Soil-and-Rotation Rule Score"
      : "Resilience-Heuristic Alternative",
    badgeColor: priorityBadge === "P-1" ? "emerald" : "cyan",
    crop,
    totalScore,
    resilienceScore,
    rotationNote,
    fertilizerSchedule,
    economics,
    nearbyMandis
  };
}

// 7. Fertilizer Protocol Generator
export function generateFertilizerSchedule(crop, soil, previousCropId) {
  const prevCrop = CROPS[previousCropId];
  const isPrevLegume = prevCrop?.category === "Legume";

  return {
    legumeCreditNote: isPrevLegume
      ? `A preceding ${prevCrop.name} may leave some nitrogen, but the amount varies. Do not reduce fertilizer without soil-test or local agronomic guidance.`
      : null,
    soilAdvisory: soil.advisoryNote,
    steps: [
      {
        phase: "Before sowing",
        phaseMr: "पेरणीपूर्वी",
        phaseHi: "बुवाई से पहले",
        timing: "Before each season",
        items: [
          {
            name: `Soil-test-based plan for ${crop.name}`,
            quantity: "Dose not calculated",
            purpose: `This tool has no laboratory soil test or verified crop-specific nutrient recommendation for ${soil.name}.`
          }
        ]
      },
      {
        phase: "During crop growth",
        phaseMr: "पिकाच्या वाढीदरम्यान",
        phaseHi: "फसल की बढ़वार के दौरान",
        timing: "Use local crop-stage guidance",
        items: [
          {
            name: "Locally recommended nutrient management",
            quantity: "No product or dose provided",
            purpose: "Confirm the crop variety, growth stage, soil test, and local extension guidance before applying fertilizer."
          }
        ]
      }
    ]
  };
}

// 8. Production Economics & Pricing Calculator ("prizing")
export function calculateCropEconomics(crop) {
  // Demo-only reference assumptions; these are not farm-specific estimates.
  const baseCost = crop.avgCostPerAcreInr || 15000;
  const seedCost = Math.round(baseCost * 0.16);
  const fertilizerCost = Math.round(baseCost * 0.22);
  const laborLandPrepCost = Math.round(baseCost * 0.25);
  const irrigationProtectionCost = Math.round(baseCost * 0.17);
  const harvestCost = Math.round(baseCost * 0.20);
  const totalCost = seedCost + fertilizerCost + laborLandPrepCost + irrigationProtectionCost + harvestCost;

  const yieldQuintal = crop.avgYieldQuintalPerAcre || 10;
  const marketPricePerQuintal = crop.marketPricePerQuintalInr || 3200;
  const grossRevenue = Math.round(yieldQuintal * marketPricePerQuintal);
  const netProfit = grossRevenue - totalCost;
  const roiPercent = Math.round((netProfit / totalCost) * 100);

  return {
    totalCost,
    grossRevenue,
    netProfit,
    roiPercent,
    yieldQuintal,
    marketPricePerQuintal,
    breakdown: [
      { item: "Certified Hybrid / High-Yield Seed", amount: seedCost, pct: "16%" },
      { item: "Fertilizers, Bio-stimulants & Manure", amount: fertilizerCost, pct: "22%" },
      { item: "Land Preparation, Deep Tillage & Sowing Labor", amount: laborLandPrepCost, pct: "25%" },
      { item: "Supplemental Irrigation & Crop Protection", amount: irrigationProtectionCost, pct: "17%" },
      { item: "Harvesting, Threshing & Bagging", amount: harvestCost, pct: "20%" }
    ]
  };
}

// 9. Nearby Mandis & Selling Market Access ("* market [selling market]")
export function getNearestMandis(cropId, lat = 19.8762, lon = 75.3433) {
  const mandisWithDistance = REGIONAL_MANDIS.map((mandi) => {
    const distanceKm = calculateDistanceKm(lat, lon, mandi.lat, mandi.lon);
    const cropQuote = mandi.cropPrices[cropId] || null;

    // Illustrative transport assumption; actual routes and rates are unknown.
    // Estimated transit & logistics cost: Approx ₹0.85 per quintal per km
    const transportPerQuintal = Math.max(40, Math.round(distanceKm * 0.85));

    return {
      ...mandi,
      distanceKm,
      cropQuote,
      transportPerQuintal,
      netRealizationPerQuintal: cropQuote
        ? cropQuote.modal - transportPerQuintal
        : null
    };
  });

  // Sort by nearest distance first
  mandisWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  // Return top 3 closest mandis
  return mandisWithDistance.slice(0, 3);
}
