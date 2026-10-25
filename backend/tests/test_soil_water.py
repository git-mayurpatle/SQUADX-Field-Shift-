import unittest
from datetime import date
from unittest.mock import patch

from fastapi import HTTPException

from services import soil_water


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class SoilWaterRequestTests(unittest.TestCase):
    @patch("services.soil_water.fetch_water_history", return_value={"rainfallTotalMm": 12})
    @patch("services.soil_water.fetch_terrain", return_value={"elevationMeters": 100})
    @patch("services.soil_water.fetch_soilgrid", return_value={"properties": {"ph": {"value": 6.5}}})
    def test_gps_request_returns_modeled_sources(self, fetch_soilgrid, fetch_terrain, fetch_water):
        request = soil_water.FarmGeometryRequest(latitude=19.99, longitude=73.78)

        result = soil_water.soil_water_for_boundary(request)

        self.assertEqual(result["soil"]["properties"]["ph"]["value"], 6.5)
        self.assertEqual(result["terrain"]["elevationMeters"], 100)
        self.assertEqual(result["water"]["rainfallTotalMm"], 12)
        fetch_soilgrid.assert_called_once()
        fetch_terrain.assert_called_once_with(None, (73.78, 19.99))
        fetch_water.assert_called_once_with((73.78, 19.99))

    @patch("services.soil_water.fetch_water_history", return_value={})
    @patch("services.soil_water.fetch_terrain", return_value={})
    @patch("services.soil_water.fetch_soilgrid", return_value={})
    @patch("services.soil_water.get_polygon_details", return_value=((73.7, 19.9), (73.69, 19.89, 73.71, 19.91)))
    def test_polygon_request_passes_boundary_to_data_sources(
        self, get_polygon_details, fetch_soilgrid, fetch_terrain, fetch_water
    ):
        geometry = {"type": "Polygon", "coordinates": []}

        soil_water.soil_water_for_boundary(soil_water.FarmGeometryRequest(geometry=geometry))

        get_polygon_details.assert_called_once_with(geometry)
        fetch_soilgrid.assert_called_once_with(geometry, (73.69, 19.89, 73.71, 19.91), (73.7, 19.9))
        fetch_terrain.assert_called_once_with(geometry, (73.7, 19.9))
        fetch_water.assert_called_once_with((73.7, 19.9))

    def test_gps_request_rejects_missing_or_out_of_range_coordinates(self):
        with self.assertRaises(HTTPException) as missing:
            soil_water.soil_water_for_boundary(soil_water.FarmGeometryRequest())
        self.assertEqual(missing.exception.status_code, 400)

        with self.assertRaises(HTTPException) as invalid:
            soil_water.soil_water_for_boundary(
                soil_water.FarmGeometryRequest(latitude=91, longitude=73.78)
            )
        self.assertEqual(invalid.exception.status_code, 400)


class CropWaterDemandTests(unittest.TestCase):
    def setUp(self):
        self.request = soil_water.CropDemandRequest(
            latitude=19.99,
            longitude=73.78,
            cropId="maize",
            plantingDate=date(2025, 1, 1),
        )

    @patch(
        "services.soil_water.requests.get",
        return_value=FakeResponse({
            "daily": {
                "time": ["2025-01-01", "2025-01-02", "2025-01-03"],
                "et0_fao_evapotranspiration": [5.0, None, 3.0],
                "precipitation_sum": [0, 2, 1],
            }
        }),
    )
    def test_forecast_uses_et0_times_crop_coefficient_and_handles_missing_days(self, get):
        result = soil_water.crop_water_demand(self.request)

        self.assertEqual(result["cropId"], "maize")
        self.assertEqual(result["etcCoveredDays"], 2)
        self.assertEqual(result["etcTotalMm"], 2.4)
        self.assertEqual(result["forecast"][0]["etcMm"], 1.5)
        self.assertIsNone(result["forecast"][1]["etcMm"])
        self.assertIn("not net irrigation demand", " ".join(result["assumptions"]))
        self.assertEqual(get.call_args.kwargs["params"]["forecast_days"], 7)

    @patch(
        "services.soil_water.requests.get",
        return_value=FakeResponse({
            "daily": {
                "time": ["2025-01-01", "2025-01-02"],
                "et0_fao_evapotranspiration": [5.0, 4.0],
                "precipitation_sum": [0, 0],
            }
        }),
    )
    def test_forecast_marks_crop_not_yet_planted(self, _get):
        request = self.request.model_copy(update={"plantingDate": date(2025, 1, 3)})

        result = soil_water.crop_water_demand(request)

        self.assertEqual(result["forecast"][0]["stage"], "not planted")
        self.assertIsNone(result["forecast"][0]["etcMm"])

    def test_invalid_crop_and_coordinates_are_rejected(self):
        with self.assertRaises(HTTPException) as unknown_crop:
            soil_water.crop_water_demand(self.request.model_copy(update={"cropId": "unknown"}))
        self.assertEqual(unknown_crop.exception.status_code, 400)

        with self.assertRaises(HTTPException) as invalid_location:
            soil_water.crop_water_demand(self.request.model_copy(update={"latitude": 91}))
        self.assertEqual(invalid_location.exception.status_code, 400)

    @patch("services.soil_water.requests.get", return_value=FakeResponse({"daily": {"time": [], "et0_fao_evapotranspiration": []}}))
    def test_incomplete_weather_forecast_returns_gateway_error(self, _get):
        with self.assertRaises(HTTPException) as incomplete:
            soil_water.crop_water_demand(self.request)
        self.assertEqual(incomplete.exception.status_code, 502)


if __name__ == "__main__":
    unittest.main()
