
import { apiUrl } from './apiBase';

export async function fetchMLPrediction({
  area = "India",
  crop,
  year = 2023,
}) {
  const params = new URLSearchParams({
    area,
    crop,
    year: String(year),
  });

  const response = await fetch(
    `${apiUrl('/api/predict')}?${params.toString()}`
  );

  if (!response.ok) {
    let message = "Unable to retrieve ML prediction";

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function fetchMLPredictionOptions() {
  const response = await fetch(
    apiUrl('/api/predict/options')
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve available crops");
  }

  return response.json();
}
