// Agronomic crop database with succession rules, water demands, nutrient balance, and market data

export const CROPS = {
  maize: {
    id: "maize",
    name: "Maize (Corn)",
    nameMr: "मका",
    nameHi: "मक्का",
    category: "Cereal",
    waterDemandMm: 520,
    waterCategory: "Medium",
    nitrogenDemandKgHa: 120,
    nitrogenFixationKgHa: 0,
    rootDepth: "Deep (1.2m)",
    season: ["Kharif", "Rabi"],
    durationDays: 105,
    preferredSoils: ["Loam", "Clay Loam", "Black Cotton", "Alluvial"],
    tempRange: [18, 35],
    avgCostPerAcreInr: 16000,
    avgYieldQuintalPerAcre: 26,
    marketPricePerQuintalInr: 2250,
    benefits: "High biomass, suitable for silage, fast growth",
    risks: "Heavy nitrogen feeder, susceptible to Fall Armyworm",
    successionRecommendations: [
      {
        nextCropId: "soybean",
        suitability: "High",
        reason: "Soybean restores 45-60 kg/ha of nitrogen depleted by maize, breaking cereal rust cycles.",
        reasonMr: "सोयाबीन मक्याने घेतलेले नायट्रोजन भरून काढते आणि कीड-रोग चक्र तोडते.",
        reasonHi: "सोयाबीन मक्के द्वारा अवशोषित नाइट्रोजन की पूर्ति करता है और कीट चक्र तोड़ता है."
      },
      {
        nextCropId: "chickpea",
        suitability: "High",
        reason: "Chickpea (Gram) requires minimal moisture, utilizes residual phosphorus, and fixes organic nitrogen for winter.",
        reasonMr: "हरभरा जमिनीत शिल्लक ओलावा वापरतो व हिवाळ्यात नायट्रोजन वाढवतो.",
        reasonHi: "चना मिट्टी की अवशिष्ट नमी का उपयोग करता है और नाइट्रोजन बढ़ाता है."
      },
      {
        nextCropId: "mustard",
        suitability: "Medium",
        reason: "Mustard has brassica glucosinolates that act as natural biofumigants against maize soil-borne pathogens.",
        reasonMr: "मोहरी मक्याच्या बुरशीजन्य रोगांना नैसर्गिकरित्या रोखते.",
        reasonHi: "सरसों मक्के के फफूंद जनित रोगों को प्राकृतिक रूप से नियंत्रित करती है."
      }
    ],
    avoidAfter: ["maize", "sorghum"] // Avoid monoculture
  },

  soybean: {
    id: "soybean",
    name: "Soybean",
    nameMr: "सोयाबीन",
    nameHi: "सोयाबीन",
    category: "Legume",
    waterDemandMm: 450,
    waterCategory: "Medium",
    nitrogenDemandKgHa: 40,
    nitrogenFixationKgHa: 55, // Fixes atmospheric nitrogen!
    rootDepth: "Medium (0.8m)",
    season: ["Kharif"],
    durationDays: 95,
    preferredSoils: ["Black Cotton", "Loam", "Clay"],
    tempRange: [20, 32],
    avgCostPerAcreInr: 14000,
    avgYieldQuintalPerAcre: 11,
    marketPricePerQuintalInr: 4600,
    benefits: "Fixes atmospheric nitrogen through rhizobia, enriches topsoil organic matter",
    risks: "Sensitive to waterlogging during germination, pod borer",
    successionRecommendations: [
      {
        nextCropId: "wheat",
        suitability: "High",
        reason: "Wheat benefits enormously from 50+ kg/ha of biological nitrogen left in the root zone by soybean.",
        reasonMr: "सोयाबीननंतर गहू घेतल्यास गव्हाला मुबलक नैसर्गिक नत्र मिळते व उत्पादन वाढते.",
        reasonHi: "सोयाबीन के बाद गेहूं लगाने से गेहूं को प्राकृतिक नाइट्रोजन मिलती है और पैदावार बढ़ती है."
      },
      {
        nextCropId: "mustard",
        suitability: "High",
        reason: "Mustard requires low irrigation, making it ideal for winter following late-monsoon soybean harvest.",
        reasonMr: "सोयाबीन काढणीनंतर कमी पाण्यात मोहरीचे उत्तम पीक येते.",
        reasonHi: "सोयाबीन कटाई के बाद कम पानी में सरसों की बेहतरीन फसल मिलती है."
      },
      {
        nextCropId: "chickpea",
        suitability: "Medium",
        reason: "Double legume rotation should only be done if soil organic carbon is depleted and nitrogen needs a boost.",
        reasonMr: "जमिनीचा सेंद्रिय कर्ब वाढवण्यासाठी हरभरा उपयुक्त ठरतो.",
        reasonHi: "मिट्टी का जैविक कार्बन बढ़ाने के लिए चना उपयुक्त है."
      }
    ],
    avoidAfter: ["soybean", "groundnut"]
  },

  wheat: {
    id: "wheat",
    name: "Wheat",
    nameMr: "गहू",
    nameHi: "गेहूं",
    category: "Cereal",
    waterDemandMm: 400,
    waterCategory: "Medium",
    nitrogenDemandKgHa: 100,
    nitrogenFixationKgHa: 0,
    rootDepth: "Deep (1.0m)",
    season: ["Rabi"],
    durationDays: 115,
    preferredSoils: ["Alluvial", "Clay Loam", "Black Cotton"],
    tempRange: [12, 26],
    avgCostPerAcreInr: 15000,
    avgYieldQuintalPerAcre: 20,
    marketPricePerQuintalInr: 2425,
    benefits: "Reliable staple, excellent residue for soil mulch",
    risks: "Terminal heat stress in March/April, high irrigation requirement during crown root initiation",
    successionRecommendations: [
      {
        nextCropId: "moong",
        suitability: "High",
        reason: "Summer Moong (Green Gram, 60-day) acts as a catch-crop, capturing summer sunlight and depositing 35 kg N/ha.",
        reasonMr: "उन्हाळी मूग केवळ ६० दिवसांत येतो आणि पुढील खरीप पिकासाठी जमीन कसदार करतो.",
        reasonHi: "मूंग 60 दिन में तैयार होकर अगली खरीफ फसल के लिए मिट्टी को उपजाऊ बनाता है."
      },
      {
        nextCropId: "dhaincha",
        suitability: "High",
        reason: "Dhaincha (Sesbania) green manure grown before monsoon adds 80-100 kg organic N/ha and suppresses weeds.",
        reasonMr: "ताग किंवा ढेंचा हिरवळीचे खत जमिनीची सुपीकता दुप्पट करते.",
        reasonHi: "ढैंचा हरी खाद मिट्टी में 80-100 किलो जैविक नाइट्रोजन जोड़ती है."
      },
      {
        nextCropId: "maize",
        suitability: "Medium",
        reason: "Can follow wheat if organic compost or green manure was incorporated post-wheat.",
        reasonMr: "शेणखत किंवा ताग गाडल्यास मका उत्तम येतो.",
        reasonHi: "हरी खाद मिलाने के बाद मक्का लगाया जा सकता है."
      }
    ],
    avoidAfter: ["wheat", "barley"]
  },

  cotton: {
    id: "cotton",
    name: "Cotton",
    nameMr: "कापूस",
    nameHi: "कपास",
    category: "Cash / Fiber",
    waterDemandMm: 700,
    waterCategory: "High",
    nitrogenDemandKgHa: 130,
    nitrogenFixationKgHa: 0,
    rootDepth: "Deep Taproot (1.8m)",
    season: ["Kharif"],
    durationDays: 160,
    preferredSoils: ["Deep Black Cotton (Vertisol)", "Heavy Loam"],
    tempRange: [21, 38],
    avgCostPerAcreInr: 24000,
    avgYieldQuintalPerAcre: 10,
    marketPricePerQuintalInr: 7200,
    benefits: "High cash returns, deep taproot aerates deep subsoil layers",
    risks: "Pink bollworm resistance, severe nutrient mining, heavy pesticide requirement",
    successionRecommendations: [
      {
        nextCropId: "chickpea",
        suitability: "High",
        reason: "Chickpea breaks the nematode and bollworm insect pupae cycle in the soil and fixes nitrogen.",
        reasonMr: "हरभरा बोंडअळीचे चक्र तोडतो आणि कापसाने खचलेली जमीन सुधारतो.",
        reasonHi: "चना गुलाबी सुंडी के चक्र को तोड़ता है और मिट्टी की उर्वरा शक्ति लौटाता है."
      },
      {
        nextCropId: "moong",
        suitability: "High",
        reason: "Short duration pulse restores exhausted micronutrients and soil organic matter.",
        reasonMr: "मूग लागवडीमुळे जमिनीतील सूक्ष्म अन्नद्रव्ये परत मिळतात.",
        reasonHi: "मूंग की खेती से सूक्ष्म पोषक तत्वों की पुनः प्राप्ति होती है."
      },
      {
        nextCropId: "sorghum",
        suitability: "Low",
        reason: "Avoid heavy cereal without restorative legume interval.",
        reasonMr: "कापसानंतर लगेच ज्वारी टाळावी, आधी डाळवर्गीय पीक घ्यावे.",
        reasonHi: "कपास के तुरंत बाद ज्वार से बचें, पहले दलहनी फसल लें."
      }
    ],
    avoidAfter: ["cotton"] // Strict rule: Pink bollworm build up
  },

  chickpea: {
    id: "chickpea",
    name: "Chickpea (Gram / Chana)",
    nameMr: "हरभरा",
    nameHi: "चना",
    category: "Legume",
    waterDemandMm: 280,
    waterCategory: "Low",
    nitrogenDemandKgHa: 25,
    nitrogenFixationKgHa: 50,
    rootDepth: "Medium (0.9m)",
    season: ["Rabi"],
    durationDays: 100,
    preferredSoils: ["Black Cotton", "Loam", "Clay Loam"],
    tempRange: [10, 30],
    avgCostPerAcreInr: 12000,
    avgYieldQuintalPerAcre: 8.5,
    marketPricePerQuintalInr: 5400,
    benefits: "Drought hardy, low fertilizer requirement, excellent nitrogen fixer",
    risks: "Fusarium wilt in hot soils, pod borer during flowering",
    successionRecommendations: [
      {
        nextCropId: "millets",
        suitability: "High",
        reason: "Millets (Bajra/Jowar) thrive on the residual nitrogen with minimum monsoon rain risk.",
        reasonMr: "हरभऱ्यानंतर बाजरी किंवा ज्वारी घेतल्यास अत्यल्प पाण्यात दर्जेदार उत्पादन मिळते.",
        reasonHi: "चने के बाद बाजरा या ज्वार कम पानी और कम लागत में बेहतरीन पैदावार देते हैं."
      },
      {
        nextCropId: "maize",
        suitability: "High",
        reason: "Maize can fully exploit the biological nitrogen deposit left by chickpea roots.",
        reasonMr: "हरभऱ्याने तयार केलेल्या सेंद्रिय खताचा मक्याला मोठा फायदा होतो.",
        reasonHi: "चने द्वारा छोड़ी गई नाइट्रोजन का मक्का भरपूर लाभ उठाता है."
      },
      {
        nextCropId: "cotton",
        suitability: "Medium",
        reason: "Cotton after winter chickpea benefits from reduced soil pest pressure.",
        reasonMr: "कापसासाठी कीडमुक्त आणि नायट्रोजनयुक्त जमीन तयार होते.",
        reasonHi: "कपास के लिए रोगमुक्त और उपजाऊ जमीन तैयार होती है."
      }
    ],
    avoidAfter: ["chickpea", "pigeonpea"]
  },

  rice: {
    id: "rice",
    name: "Paddy (Rice)",
    nameMr: "भात / धान",
    nameHi: "धान / चावल",
    category: "Cereal",
    waterDemandMm: 1100,
    waterCategory: "High",
    nitrogenDemandKgHa: 110,
    nitrogenFixationKgHa: 0,
    rootDepth: "Shallow (0.4m)",
    season: ["Kharif"],
    durationDays: 130,
    preferredSoils: ["Clay", "Clayey Alluvial", "Puddled Soil"],
    tempRange: [22, 36],
    avgCostPerAcreInr: 21000,
    avgYieldQuintalPerAcre: 24,
    marketPricePerQuintalInr: 2300,
    benefits: "Staple food security, thrives in high rainfall zones",
    risks: "Extreme water consumption, methane emissions, puddling destroys soil structure (hardpan)",
    successionRecommendations: [
      {
        nextCropId: "mustard",
        suitability: "High",
        reason: "Mustard taproots pierce the compacted rice hardpan layer, recovering residual moisture.",
        reasonMr: "मोहरीची मुळे भाताच्या घट्ट झालेल्या जमिनीचा थर फोडून हवा खेळती करतात.",
        reasonHi: "सरसों की जड़ें धान से बनी कड़ी परत को तोड़कर मिट्टी को भुरभुरा बनाती हैं."
      },
      {
        nextCropId: "chickpea",
        suitability: "High",
        reason: "Relay cropping of chickpea into standing rice (Paira/Utera) saves tillage cost and utilizes moisture.",
        reasonMr: "भात कापणीपूर्वी हरभरा फेकून पेरल्यास (पायरा पद्धत) खर्च वाचतो.",
        reasonHi: "धान की कटाई के समय उतेरा पद्धति से चना बोने पर लागत घटती है."
      },
      {
        nextCropId: "wheat",
        suitability: "Medium",
        reason: "Common North India rotation, but requires zero-tillage to avoid late sowing penalties.",
        reasonMr: "झिरो-टिलेज तंत्रज्ञानाने गहू घेतल्यास इंधन व वेळ वाचतो.",
        reasonHi: "जीरो टिलेज से गेहूं बोने पर पराली जलाने की आवश्यकता नहीं पड़ती."
      }
    ],
    avoidAfter: ["rice"] // Avoid puddling soil repeatedly
  },

  mustard: {
    id: "mustard",
    name: "Mustard / Rapeseed",
    nameMr: "मोहरी / राई",
    nameHi: "सरसों",
    category: "Oilseed",
    waterDemandMm: 240,
    waterCategory: "Low",
    nitrogenDemandKgHa: 60,
    nitrogenFixationKgHa: 0,
    rootDepth: "Deep Taproot (1.1m)",
    season: ["Rabi"],
    durationDays: 110,
    preferredSoils: ["Loam", "Sandy Loam", "Alluvial"],
    tempRange: [10, 25],
    avgCostPerAcreInr: 10000,
    avgYieldQuintalPerAcre: 8,
    marketPricePerQuintalInr: 5650,
    benefits: "High oil value, drought resilient, pest repellent biofumigant effect",
    risks: "Aphid attack during cloudy weather, frost sensitive",
    successionRecommendations: [
      {
        nextCropId: "moong",
        suitability: "High",
        reason: "Summer Moong before Kharif season builds nitrogen reserves.",
        reasonMr: "मोहरीनंतर उन्हाळी मूग घेतल्यास जमिनीची ताकद वाढते.",
        reasonHi: "सरसों के बाद मूंग लगाने से जमीन की उर्वरता बढ़ती है."
      },
      {
        nextCropId: "maize",
        suitability: "High",
        reason: "Soil is cleansed of fungal nematodes by mustard root exudates, maximizing maize yield.",
        reasonMr: "मोहरीमुळे जमिनीतील बुरशी नष्ट होऊन पुढील मका निरोगी येतो.",
        reasonHi: "सरसों के प्रभाव से मिट्टी जनित फफूंद खत्म होती है जिससे मक्का स्वस्थ रहता है."
      }
    ],
    avoidAfter: ["mustard", "cabbage"]
  },

  millets: {
    id: "millets",
    name: "Pearl Millet (Bajra) / Sorghum (Jowar)",
    nameMr: "बाजरी / ज्वारी (मिलेट्स)",
    nameHi: "बाजरा / ज्वार (श्रीअन्न)",
    category: "Millet",
    waterDemandMm: 250,
    waterCategory: "Low",
    nitrogenDemandKgHa: 60,
    nitrogenFixationKgHa: 0,
    rootDepth: "Very Deep (1.6m)",
    season: ["Kharif", "Summer"],
    durationDays: 85,
    preferredSoils: ["Sandy", "Sandy Loam", "Shallow Red", "Black Cotton"],
    tempRange: [22, 42],
    avgCostPerAcreInr: 9000,
    avgYieldQuintalPerAcre: 14,
    marketPricePerQuintalInr: 2500,
    benefits: "Extreme climate resilience, withstands 42°C heat, minimal water footprint",
    risks: "Bird damage at dough stage, shoot fly in early growth",
    successionRecommendations: [
      {
        nextCropId: "chickpea",
        suitability: "High",
        reason: "Ideal follow-up crop in dryland farming with zero groundwater depletion.",
        reasonMr: "कोरडवाहू जमिनीत बाजरीनंतर हरभरा हे सर्वात खात्रीशीर पीक चक्र आहे.",
        reasonHi: "शुष्क क्षेत्रों में बाजरे के बाद चना सबसे सुरक्षित और टिकाऊ फसल चक्र है."
      },
      {
        nextCropId: "pigeonpea",
        suitability: "High",
        reason: "Intercropping or rotating with Pigeonpea (Tur) balances deep nutrient extraction.",
        reasonMr: "तूर लागवडीने जमिनीच्या खोलवर गेलेली पोषणमूल्ये पुन्हा संतुलित होतात.",
        reasonHi: "अरहर (तूर) के साथ चक्र से मिट्टी की उर्वरता का संतुलन बना रहता है."
      }
    ],
    avoidAfter: ["sorghum"]
  },

  pigeonpea: {
    id: "pigeonpea",
    name: "Pigeonpea (Tur / Arhar)",
    nameMr: "तूर / अरहर",
    nameHi: "अरहर / तूर दाल",
    category: "Legume",
    waterDemandMm: 550,
    waterCategory: "Medium",
    nitrogenDemandKgHa: 30,
    nitrogenFixationKgHa: 65,
    rootDepth: "Deep Taproot (2.0m)",
    season: ["Kharif"],
    durationDays: 175,
    preferredSoils: ["Deep Black", "Red Loam", "Well Drained Clay"],
    tempRange: [20, 36],
    avgCostPerAcreInr: 15000,
    avgYieldQuintalPerAcre: 8,
    marketPricePerQuintalInr: 7550,
    benefits: "Deep subsoil nutrient mining, massive leaf fall adds 2 tons/ha organic mulch",
    risks: "Pod borer, wilt disease, long maturity window",
    successionRecommendations: [
      {
        nextCropId: "wheat",
        suitability: "Medium",
        reason: "Can follow short-duration tur if harvested before late November.",
        reasonMr: "लवकर येणाऱ्या तुरीनंतर गव्हाची वेळेवर पेरणी शक्य होते.",
        reasonHi: "अगेती अरहर के बाद गेहूं की समय पर बुवाई की जा सकती है."
      },
      {
        nextCropId: "moong",
        suitability: "High",
        reason: "Summer pulse maintains pulse continuum in arid soils.",
        reasonMr: "उन्हाळ्यात मूग घेऊन सेंद्रिय कर्ब उत्तम राखता येतो.",
        reasonHi: "ग्रीष्मकालीन मूंग से मृदा स्वास्थ्य उत्कृष्ट रहता है."
      }
    ],
    avoidAfter: ["pigeonpea"]
  },

  moong: {
    id: "moong",
    name: "Green Gram (Moong Bean)",
    nameMr: "मूग",
    nameHi: "मूंग",
    category: "Legume",
    waterDemandMm: 220,
    waterCategory: "Low",
    nitrogenDemandKgHa: 20,
    nitrogenFixationKgHa: 40,
    rootDepth: "Shallow (0.5m)",
    season: ["Zaid / Summer", "Kharif"],
    durationDays: 62,
    preferredSoils: ["Loam", "Sandy Loam", "Alluvial", "Black Soil"],
    tempRange: [25, 40],
    avgCostPerAcreInr: 8500,
    avgYieldQuintalPerAcre: 6,
    marketPricePerQuintalInr: 8500,
    benefits: "Super quick 60-day crop, enriches soil between main harvest seasons, high market price",
    risks: "Yellow mosaic virus, shattering of pods if rain occurs at harvest",
    successionRecommendations: [
      {
        nextCropId: "rice",
        suitability: "High",
        reason: "Provides free green manure and nitrogen right before monsoon paddy transplanting.",
        reasonMr: "भात लागवडीपूर्वी मुगाची मुळे व अवशेष जमिनीत गाडल्यास रासायनिक खतांचा खर्च ५०% वाचतो.",
        reasonHi: "धान रोपाई से पहले मूंग के अवशेष मिट्टी में दबाने से 50% यूरिया की बचत होती है."
      },
      {
        nextCropId: "maize",
        suitability: "High",
        reason: "Maize sown after moong requires 35% less urea fertilizer.",
        reasonMr: "मुगानंतर मका घेतल्यास युरियाची मोठी बचत होते.",
        reasonHi: "मूंग के बाद मक्के में यूरिया की आवश्यकता 35% कम हो जाती है."
      }
    ],
    avoidAfter: ["moong", "urad"]
  },

  cloverCover: {
    id: "cloverCover",
    name: "Cover Crop (Clover / Sunnhemp / Dhaincha)",
    nameMr: "आच्छादन पीक (ताग / ढेंचा / क्लोव्हर)",
    nameHi: "कवर क्रॉप (सनहेम्प / ढैंचा / बरसीम)",
    category: "Cover Crop",
    waterDemandMm: 180,
    waterCategory: "Low",
    nitrogenDemandKgHa: 10,
    nitrogenFixationKgHa: 80,
    rootDepth: "Medium (0.8m)",
    season: ["Summer", "Zaid", "Pre-Monsoon"],
    durationDays: 45,
    preferredSoils: ["All Soil Types"],
    tempRange: [15, 40],
    avgCostPerAcreInr: 4500,
    avgYieldQuintalPerAcre: 0, // Green manure incorporated into soil
    marketPricePerQuintalInr: 0,
    benefits: "Eliminates soil erosion, suppresses 90% of weeds, deposits 80 kg N/ha into soil, doubles microbial biomass",
    risks: "Needs to be ploughed back into soil 10 days before primary sowing",
    successionRecommendations: [
      {
        nextCropId: "cotton",
        suitability: "High",
        reason: "Supplies sustained slow-release nitrogen, reducing costly chemical fertilizers by up to ₹4,000/acre.",
        reasonMr: "कापसाला सेंद्रिय खताचा नियमित पुरवठा होतो व रासायनिक खतांचा खर्च कमी होतो.",
        reasonHi: "कपास की फसल को धीरे-धीरे नाइट्रोजन मिलती है, जिससे रासायनिक खाद का खर्च घटता है."
      },
      {
        nextCropId: "maize",
        suitability: "High",
        reason: "Provides immediate organic boost for rapid early vegetative growth.",
        reasonMr: "मक्याच्या सुरुवातीच्या वाढीसाठी जमीन अत्यंत भुसभुशीत व सुपीक बनते.",
        reasonHi: "मक्के के प्रारंभिक विकास के लिए मिट्टी अत्यंत उपजाऊ बन जाती है."
      }
    ],
    avoidAfter: []
  }
};

// Preset Crop Rotation Simulation Plans for comparison
export const SIMULATION_PLANS = {
  baseline: {
    id: "baseline",
    name: "Plan 1: Continuous Monoculture (Current Baseline)",
    nameMr: "योजना १: पारंपारिक एकसुरी पीक पद्धत (सद्यस्थिती)",
    nameHi: "योजना 1: पारंपरिक एकल फसल पद्धति (वर्तमान)",
    description: "Repeated cereal or cash monoculture without legume break. High chemical reliance, declining soil organic carbon.",
    sequence: [
      { season: "Year 1 Kharif", cropId: "maize" },
      { season: "Year 1 Rabi", cropId: "wheat" },
      { season: "Year 2 Kharif", cropId: "maize" },
      { season: "Year 2 Rabi", cropId: "wheat" }
    ],
    totalWaterDemandMm: 1840,
    chemicalNitrogenKgAcre: 220,
    organicNitrogenCreditKgAcre: 0,
    soilRecoveryScore: 38,
    climateRiskLevel: "High",
    climateRiskScore: 78, // Higher means more vulnerable
    soilErosionRisk: "Severe (topsoil exposed during summer)",
    netCostPerAcreInr: 62000,
    grossRevenuePerAcreInr: 107000,
    netProfitPerAcreInr: 45000,
    sustainabilityRating: "Poor (High soil degradation risk)"
  },

  optionA: {
    id: "optionA",
    name: "Plan 2: Crop Diversification & Cereal-Legume Rotation",
    nameMr: "योजना २: पीक विविधीकरण व कडधान्य फेरपालट",
    nameHi: "योजना 2: फसल विविधीकरण और दलहन चक्र",
    description: "Alternating cereal, oilseed, and legume pulses. Breaks pest lifecycles, cuts urea usage by 35%, and balances groundwater use.",
    sequence: [
      { season: "Year 1 Kharif", cropId: "maize" },
      { season: "Year 1 Rabi", cropId: "chickpea" },
      { season: "Year 2 Kharif", cropId: "soybean" },
      { season: "Year 2 Rabi", cropId: "wheat" }
    ],
    totalWaterDemandMm: 1450,
    chemicalNitrogenKgAcre: 135,
    organicNitrogenCreditKgAcre: 105,
    soilRecoveryScore: 74,
    climateRiskLevel: "Moderate",
    climateRiskScore: 42,
    soilErosionRisk: "Low (continuous root binding)",
    netCostPerAcreInr: 57000,
    grossRevenuePerAcreInr: 121000,
    netProfitPerAcreInr: 64000,
    sustainabilityRating: "Strong (Balanced profit and resource protection)"
  },

  optionB: {
    id: "optionB",
    name: "Plan 3: Regenerative Soil Health & Climate-Resilient Rotation",
    nameMr: "योजना ३: पुनरुत्पादक जमीन सुधारणा व हवामान-सक्षम पद्धत",
    nameHi: "योजना 3: पुनर्योजी मृदा सुधार और जलवायु-अनुकूल पद्धति",
    description: "Maximizes soil carbon, cover crops, and deep-root millets. Drastically reduces irrigation need and builds long-term drought resilience.",
    sequence: [
      { season: "Year 1 Kharif", cropId: "millets" },
      { season: "Year 1 Rabi", cropId: "mustard" },
      { season: "Year 1 Summer", cropId: "cloverCover" },
      { season: "Year 2 Kharif", cropId: "soybean" },
      { season: "Year 2 Rabi", cropId: "chickpea" }
    ],
    totalWaterDemandMm: 1080,
    chemicalNitrogenKgAcre: 65,
    organicNitrogenCreditKgAcre: 185,
    soilRecoveryScore: 92,
    climateRiskLevel: "Low",
    climateRiskScore: 22,
    soilErosionRisk: "Negligible (Active green cover & stubble retention)",
    netCostPerAcreInr: 44000,
    grossRevenuePerAcreInr: 114000,
    netProfitPerAcreInr: 70000,
    sustainabilityRating: "Exceptional (Zero groundwater overdraft, maximum carbon buildup)"
  }
};
