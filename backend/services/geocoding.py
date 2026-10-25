
import requests

GEOCODING_URL = "https://nominatim.openstreetmap.org/reverse"

def reverse_geocode(lat, lon):
    response = requests.get(
        GEOCODING_URL,
        params={
            "lat": lat,
            "lon": lon,
            "format": "jsonv2",
            "addressdetails": 1,
            "zoom": 13
        },
        headers={
            "User-Agent": "FieldShiftDevelopment/1.0 (local testing)"
        },
        timeout=20
    )

    response.raise_for_status()
    address = response.json().get("address", {})

    place = (
        address.get("village")
        or address.get("town")
        or address.get("city")
        or address.get("municipality")
        or address.get("county")
    )

    return {
        "place": place,
        "district": address.get("state_district")
                    or address.get("county"),
        "state": address.get("state"),
        "country": address.get("country")
    }
