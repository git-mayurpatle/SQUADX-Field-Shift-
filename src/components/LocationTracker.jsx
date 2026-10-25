
import { useState } from "react";

import {
  detectLocation,
  fetchNASAData,
  fetchLocationName
} from "../services/nasaApi";

export default function LocationTracker({ onLocationDetected }) {
  const [location, setLocation] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [climate, setClimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDetectLocation() {
    setLoading(true);
    setError("");
    setClimate(null);
    setLocationInfo(null);

    try {
      // 1. Detect GPS coordinates
      const coords = await detectLocation();

      setLocation(coords);

      // 2. Fetch nearby place name
      let placeInfo = null;

      try {
        placeInfo = await fetchLocationName(
          coords.latitude,
          coords.longitude
        );

        setLocationInfo(placeInfo);
      } catch (geocodeError) {
        console.warn(
          "Unable to retrieve location name:",
          geocodeError
        );
      }

      // 3. Update active location in App.jsx
      onLocationDetected?.({
        ...coords,
        locationInfo: placeInfo
      });

      // 4. Fetch NASA climate observations
      const nasaResult = await fetchNASAData(
        coords.latitude,
        coords.longitude
      );

      setClimate(nasaResult);

    } catch (err) {
      console.error("Location tracking error:", err);

      setError(
        err.message || "Unable to detect location"
      );
    } finally {
      setLoading(false);
    }
  }

  const locationName = locationInfo
    ? [
        locationInfo.place,
        locationInfo.district,
        locationInfo.state,
        locationInfo.country
      ]
        .filter(Boolean)
        .filter((value, index, array) =>
          array.indexOf(value) === index
        )
        .join(", ")
    : "";

  return (
    <div className="mb-6 rounded-xl border border-emerald-900 bg-slate-900 p-5 text-white">

      <h2 className="mb-4 text-xl font-bold text-emerald-400">
        Global Location Tracking
      </h2>

      <button
        onClick={handleDetectLocation}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading
          ? "Fetching location and NASA data..."
          : "Detect My Location"}
      </button>

      {location && (
        <div className="mt-4 space-y-2">
          <p>
            <strong>Latitude:</strong>{" "}
            {location.latitude.toFixed(4)}
          </p>

          <p>
            <strong>Longitude:</strong>{" "}
            {location.longitude.toFixed(4)}
          </p>

          <p>
            <strong>Nearby Location:</strong>{" "}
            {locationName || "Location name unavailable"}
          </p>
        </div>
      )}

      {climate && (
        <div className="mt-5 rounded-lg bg-slate-800 p-4">
          <h3 className="mb-3 font-bold text-emerald-300">
            NASA Environmental Data
          </h3>

          <p>
            Temperature:{" "}
            {climate.summary?.avg_temperature_c ?? "N/A"} °C
          </p>

          <p>
            Rainfall:{" "}
            {climate.summary?.total_rainfall_mm ?? "N/A"} mm
          </p>

          <p>
            Humidity:{" "}
            {climate.summary?.avg_humidity_percent ?? "N/A"}%
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Period: {climate.period?.start ?? "N/A"} to{" "}
            {climate.period?.end ?? "N/A"}
          </p>
          {climate.quality_warnings?.map((warning) => (
            <p key={warning} role="status" className="mt-2 text-sm text-amber-300">
              {warning}
            </p>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-400">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Temperature and humidity: NASA POWER. Rainfall: Open-Meteo.
        Location names: © OpenStreetMap contributors.
      </p>
    </div>
  );
}
