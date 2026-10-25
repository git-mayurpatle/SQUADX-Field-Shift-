import { apiUrl } from './apiBase';

export function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  });
}

export async function fetchNASAData(latitude, longitude) {
  const url = new URL(apiUrl('/api/nasa'), window.location.origin);

  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch NASA data");
  }

  return response.json();
}

export async function fetchLocationName(latitude, longitude) {
  const url = new URL(apiUrl('/api/location'), window.location.origin);

  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to identify location name");
  }

  return response.json();
}