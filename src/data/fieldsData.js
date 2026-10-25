// Comprehensive farm field database with GPS bounds, multi-source soil parameters, and shift farming plots

export const PRESET_FIELDS = [
  {
    id: "field-nashik",
    isDemoData: true,
    name: "Nashik Valley Agri-Cluster",
    location: "Nashik, Maharashtra, India",
    regionName: "Western Ghats Agricultural Belt",
    lat: 20.0112,
    lon: 73.8124,
    totalAreaAcres: 8.5,
    elevationMeters: 584,
    currentCrop: "soybean",
    previousCrop: "wheat",
    activeSeason: "Kharif 2026",
    irrigationType: "Drip Irrigation + Farm Pond",
    soilType: "Medium Black Loam (Vertisol-Inceptisol)",
    soilTexture: "Clay Loam (34% clay, 42% silt, 24% sand)",
    soilIndicators: {
      ph: { value: 7.2, source: "measured", label: "Neutral to mildly alkaline (Optimal)", status: "good" },
      organicCarbonPercent: { value: 0.68, source: "measured", label: "Moderate (Target > 0.8%)", status: "warning" },
      availableNitrogenKgHa: { value: 195, source: "measured", label: "Low (Requires legume fixation)", status: "warning" },
      availablePhosphorusKgHa: { value: 24, source: "measured", label: "Medium (Good for legumes)", status: "good" },
      availablePotassiumKgHa: { value: 310, source: "measured", label: "High (Natural basalt soil)", status: "good" },
      electricalConductivityDsM: { value: 0.42, source: "measured", label: "Normal (Non-saline)", status: "good" },
      satelliteSoilMoistureIndex: { value: 0.48, source: "estimated", label: "Remotely Estimated by NASA SMAP/GPM", status: "good" },
      erosionRiskLevel: { value: "Low", source: "estimated", label: "Estimated by Landsat slope analysis", status: "good" },
      compactionRisk: { value: "Moderate", source: "user", label: "Farmer survey reported hard layer at 25cm", status: "warning" }
    },
    satelliteHealth: {
      currentNdvi: 0.72,
      lastMonthNdvi: 0.58,
      changePercent: "+24.1%",
      vegetationStatus: "Vigorous Vegetative Stage",
      canopyCoveragePercent: 78,
      stressZonesCount: 1, // Only 1 localized stress zone on eastern boundary
      stressNotes: "Mild nitrogen deficiency identified in Zone E-2 via Landsat-8 Band 4/5 analysis.",
      historicalNdviTimeline: [
        { date: "May 2025", ndvi: 0.18, phase: "Post-Harvest Bare Soil" },
        { date: "Jul 2025", ndvi: 0.45, phase: "Early Germination" },
        { date: "Sep 2025", ndvi: 0.76, phase: "Peak Vegetative Canopy" },
        { date: "Nov 2025", ndvi: 0.62, phase: "Maturity & Pod Fill" },
        { date: "Jan 2026", ndvi: 0.28, phase: "Winter Sowing Transition" },
        { date: "Mar 2026", ndvi: 0.69, phase: "Current Active Vegetative Growth" }
      ]
    },
    // Multi-plot breakdown for Shift Farming
    plots: [
      {
        id: "plot-1",
        name: "Plot A - North Terrace",
        acres: 3.5,
        slope: "2% (Flat)",
        soilQuality: "High Organic Matter",
        waterAccess: "Drip Line Connected",
        lastYearCrop: "soybean",
        recommendedNext: "wheat",
        soilPh: 7.2
      },
      {
        id: "plot-2",
        name: "Plot B - Central Contour",
        acres: 3.0,
        slope: "5% (Mild Slope)",
        soilQuality: "Moderate Nitrogen Depletion",
        waterAccess: "Micro-Sprinkler",
        lastYearCrop: "maize",
        recommendedNext: "chickpea",
        soilPh: 7.0
      },
      {
        id: "plot-3",
        name: "Plot C - Southern Basin",
        acres: 2.0,
        slope: "1% (Depression / Water Gathering)",
        soilQuality: "Heavy Clay, High Moisture",
        waterAccess: "Furrow / Pond overflow",
        lastYearCrop: "cotton",
        recommendedNext: "moong",
        soilPh: 7.5
      }
    ],
    polygonBounds: [
      [20.0135, 73.8080],
      [20.0142, 73.8160],
      [20.0090, 73.8168],
      [20.0082, 73.8088]
    ]
  },

  {
    id: "field-vidarbha",
    isDemoData: true,
    name: "Vidarbha Cotton-Pulses Farm",
    location: "Amravati / Wardha, Maharashtra, India",
    regionName: "Deccan Plateau Rainfed Belt",
    lat: 20.9374,
    lon: 77.7796,
    totalAreaAcres: 12.0,
    elevationMeters: 342,
    currentCrop: "cotton",
    previousCrop: "soybean",
    activeSeason: "Kharif 2026",
    irrigationType: "Rainfed + Borewell Supplemental",
    soilType: "Deep Black Cotton Soil (Chromic Vertisol)",
    soilTexture: "Heavy Clay (52% clay, 31% silt, 17% sand)",
    soilIndicators: {
      ph: { value: 7.8, source: "measured", label: "Mildly alkaline (Typical black soil)", status: "good" },
      organicCarbonPercent: { value: 0.44, source: "measured", label: "Critical Low (Requires stubble retention & cover crops)", status: "danger" },
      availableNitrogenKgHa: { value: 160, source: "measured", label: "Very Low (Exhausted by continuous cotton)", status: "danger" },
      availablePhosphorusKgHa: { value: 14, source: "measured", label: "Low fixation due to high clay content", status: "warning" },
      availablePotassiumKgHa: { value: 420, source: "measured", label: "Very High (Abundant reserve)", status: "good" },
      electricalConductivityDsM: { value: 0.35, source: "measured", label: "Normal (Good drainage required)", status: "good" },
      satelliteSoilMoistureIndex: { value: 0.31, source: "estimated", label: "Dry subsoil moisture flagged by NASA POWER", status: "warning" },
      erosionRiskLevel: { value: "Moderate", source: "estimated", label: "Deep cracking during dry spells enhances runoff erosion", status: "warning" },
      compactionRisk: { value: "High", source: "user", label: "Heavy tractor compaction recorded", status: "danger" }
    },
    satelliteHealth: {
      currentNdvi: 0.54,
      lastMonthNdvi: 0.61,
      changePercent: "-11.5%",
      vegetationStatus: "Moderate Stress / Moisture Deficit",
      canopyCoveragePercent: 55,
      stressZonesCount: 3,
      stressNotes: "MODIS & Landsat thermal anomaly indicates elevated canopy temperature due to delayed monsoon rainfall.",
      historicalNdviTimeline: [
        { date: "May 2025", ndvi: 0.14, phase: "Deep Cracking Fallow" },
        { date: "Jul 2025", ndvi: 0.38, phase: "Sowing Emergence" },
        { date: "Sep 2025", ndvi: 0.62, phase: "Square & Boll Formation" },
        { date: "Nov 2025", ndvi: 0.58, phase: "First Picking Period" },
        { date: "Jan 2026", ndvi: 0.35, phase: "Bollworm & Senescence Phase" },
        { date: "Mar 2026", ndvi: 0.54, phase: "Supplemental Pulse Vegetative" }
      ]
    },
    plots: [
      {
        id: "plot-v1",
        name: "Block 1 - East Well Zone",
        acres: 5.0,
        slope: "1%",
        soilQuality: "Good Depth, Borewell Access",
        waterAccess: "Flood / Furrow with Borewell",
        lastYearCrop: "cotton",
        recommendedNext: "chickpea",
        soilPh: 7.7
      },
      {
        id: "plot-v2",
        name: "Block 2 - West Rainfed Ridge",
        acres: 4.5,
        slope: "4%",
        soilQuality: "Shallow Depth, Rapid Drying",
        waterAccess: "Rainfed Only",
        lastYearCrop: "soybean",
        recommendedNext: "millets",
        soilPh: 7.5
      },
      {
        id: "plot-v3",
        name: "Block 3 - Stream Buffer",
        acres: 2.5,
        slope: "2%",
        soilQuality: "High Moisture Retention",
        waterAccess: "Seasonal Stream Sump",
        lastYearCrop: "pigeonpea",
        recommendedNext: "cloverCover",
        soilPh: 7.9
      }
    ],
    polygonBounds: [
      [20.9410, 77.7730],
      [20.9425, 77.7865],
      [20.9330, 77.7850],
      [20.9320, 77.7725]
    ]
  },

  {
    id: "field-punjab",
    isDemoData: true,
    name: "Punjab Indus Alluvial Farm",
    location: "Ludhiana, Punjab, India",
    regionName: "Indo-Gangetic Fertile Plains",
    lat: 30.9010,
    lon: 75.8573,
    totalAreaAcres: 16.0,
    elevationMeters: 247,
    currentCrop: "wheat",
    previousCrop: "rice",
    activeSeason: "Rabi 2026",
    irrigationType: "Submersible Tube-Well & Canal",
    soilType: "Deep Alluvial Loam (Inceptisol-Entisol)",
    soilTexture: "Sandy Clay Loam (26% clay, 38% silt, 36% sand)",
    soilIndicators: {
      ph: { value: 8.1, source: "measured", label: "Slightly alkaline with localized saline patches", status: "warning" },
      organicCarbonPercent: { value: 0.52, source: "measured", label: "Sub-optimal due to historical paddy stubble burning", status: "warning" },
      availableNitrogenKgHa: { value: 240, source: "measured", label: "Medium (Supported by synthetic inputs)", status: "good" },
      availablePhosphorusKgHa: { value: 38, source: "measured", label: "High (Residual fertilizer buildup)", status: "good" },
      availablePotassiumKgHa: { value: 260, source: "measured", label: "Adequate", status: "good" },
      electricalConductivityDsM: { value: 0.88, source: "measured", label: "Elevated EC (Groundwater salinity warning)", status: "warning" },
      satelliteSoilMoistureIndex: { value: 0.74, source: "estimated", label: "High surface moisture from canal network", status: "good" },
      erosionRiskLevel: { value: "Very Low", source: "estimated", label: "Level terrain (<1% slope)", status: "good" },
      compactionRisk: { value: "Severe", source: "user", label: "Puddled paddy hardpan at 18cm depth confirmed", status: "danger" }
    },
    satelliteHealth: {
      currentNdvi: 0.81,
      lastMonthNdvi: 0.75,
      changePercent: "+8.0%",
      vegetationStatus: "Dense Healthy Wheat Canopy",
      canopyCoveragePercent: 89,
      stressZonesCount: 0,
      stressNotes: "Uniform greenness index; satellite alerts to watch for late-season terminal heat waves.",
      historicalNdviTimeline: [
        { date: "May 2025", ndvi: 0.12, phase: "Hot Pre-Monsoon Fallow" },
        { date: "Jul 2025", ndvi: 0.52, phase: "Paddy Flooding & Transplant" },
        { date: "Sep 2025", ndvi: 0.84, phase: "Paddy Grain Fill Peak" },
        { date: "Nov 2025", ndvi: 0.22, phase: "Harvest & Stubble Mulch" },
        { date: "Jan 2026", ndvi: 0.65, phase: "Wheat Tillering Stage" },
        { date: "Mar 2026", ndvi: 0.81, phase: "Wheat Earhead Flowering Stage" }
      ]
    },
    plots: [
      {
        id: "plot-p1",
        name: "Plot 1 - Canal Head",
        acres: 6.0,
        slope: "0.5%",
        soilQuality: "Deep Silt, High Yield",
        waterAccess: "Canal Gravity Flow",
        lastYearCrop: "rice",
        recommendedNext: "mustard",
        soilPh: 8.0
      },
      {
        id: "plot-p2",
        name: "Plot 2 - Center Tube-well",
        acres: 6.0,
        slope: "0.5%",
        soilQuality: "Alluvial Loam, Hardpan Alert",
        waterAccess: "Borewell",
        lastYearCrop: "wheat",
        recommendedNext: "moong",
        soilPh: 8.2
      },
      {
        id: "plot-p3",
        name: "Plot 3 - Diversification Strip",
        acres: 4.0,
        slope: "0.8%",
        soilQuality: "Transitioning to Organic Management",
        waterAccess: "Drip Line Installed",
        lastYearCrop: "maize",
        recommendedNext: "cloverCover",
        soilPh: 7.8
      }
    ],
    polygonBounds: [
      [30.9055, 75.8510],
      [30.9065, 75.8640],
      [30.8960, 75.8630],
      [30.8950, 75.8500]
    ]
  }
];
