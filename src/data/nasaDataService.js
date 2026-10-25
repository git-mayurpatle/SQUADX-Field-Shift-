
import { fetchNASAData } from "../services/nasaApi";

function validNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value, digits = 1) {
  return validNumber(value)
    ? Number(value.toFixed(digits))
    : null;
}

function readNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > -900
    ? number
    : null;
}

function convertDailyRecord(record) {
  const dateStr = String(record.date ?? "");
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);

  return {
    dateStr,
    label: `${day}/${month}`,
    tAvg: readNumber(record.T2M),
    tMax: readNumber(record.T2M_MAX),
    tMin: readNumber(record.T2M_MIN),
    precipitationMm: readNumber(record.PRECIPITATION_MM),
    solarRadiationMj: readNumber(record.ALLSKY_SFC_SW_DWN),
    humidityPercent: readNumber(record.RH2M)
  };
}

function calculateStats(records, period) {
  const temperatures = records
    .map((day) => day.tAvg)
    .filter(validNumber);

  const rainValues = records
    .map((day) => day.precipitationMm)
    .filter(validNumber);

  const averageTempC = temperatures.length
    ? round(
        temperatures.reduce((sum, value) => sum + value, 0) /
          temperatures.length
      )
    : null;

  const totalPrecipitationMm = rainValues.length === records.length
    ? round(rainValues.reduce((sum, value) => sum + value, 0))
    : null;

  const heatRecords = records.filter((day) =>
    validNumber(day.tMax)
  );

  const extremeHeatDaysCount =
    heatRecords.length === records.length
      ? heatRecords.filter((day) => day.tMax >= 37).length
      : null;

  let drySpell = 0;
  let maxDrySpell = 0;

  const completeRainfall = rainValues.length === records.length;

  if (completeRainfall) {
    for (const day of records) {
      if (day.precipitationMm < 1) {
        drySpell++;
        maxDrySpell = Math.max(maxDrySpell, drySpell);
      } else {
        drySpell = 0;
      }
    }
  }

  const longestDrySpellDays = completeRainfall
    ? maxDrySpell
    : null;

  const activeAlerts = [];
  let climateRiskScore = null;
  let climateRiskLevel = "Unavailable";

  const completeHeat = extremeHeatDaysCount !== null;

  if (completeRainfall && completeHeat) {
    let score = 20;

    if (maxDrySpell >= 14) {
      score += 35;
      activeAlerts.push({
        type: "drought",
        severity: "High",
        title: "Historical Dry Spell",
        desc: `${maxDrySpell} consecutive days with less than 1 mm rainfall.`
      });
    } else if (maxDrySpell >= 8) {
      score += 18;
      activeAlerts.push({
        type: "dry",
        severity: "Moderate",
        title: "Historical Dry Spell Watch",
        desc: `${maxDrySpell} consecutive days with less than 1 mm rainfall.`
      });
    }

    if (extremeHeatDaysCount >= 5) {
      score += 25;
      activeAlerts.push({
        type: "heat",
        severity: "High",
        title: "Historical Heat Exposure",
        desc: `${extremeHeatDaysCount} days had maximum temperature of at least 37°C.`
      });
    }

    climateRiskScore = Math.min(95, score);
    climateRiskLevel =
      climateRiskScore >= 60
        ? "High"
        : climateRiskScore >= 35
          ? "Moderate"
          : "Low";
  }

  return {
    source: "NASA POWER (historical observations)",
    period,
    totalPrecipitationMm,
    averageTempC,
    extremeHeatDaysCount,
    longestDrySpellDays,
    climateRiskScore,
    climateRiskLevel,
    activeAlerts,
    dailyRecords: records,
    isHistorical: true,
    isSimulated: false
  };
}

export async function fetchNasaPowerData(lat, lon) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error("Invalid location coordinates");
  }

  const response = await fetchNASAData(lat, lon);

  if (!Array.isArray(response.daily_data)) {
    throw new Error("NASA backend returned invalid daily data");
  }

  const records = response.daily_data
    .map(convertDailyRecord)
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  if (!records.length) {
    throw new Error("NASA returned no observations");
  }

  return {
    ...calculateStats(records, response.period),
    qualityWarnings: response.quality_warnings || []
  };
}
