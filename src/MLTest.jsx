
import { useState } from "react";
import { fetchMLPrediction } from "./services/mlPredictionApi";

export default function MLTest() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function testPrediction() {
    setError("");
    setResult(null);

    try {
      const data = await fetchMLPrediction({
        area: "India",
        crop: "Maize (corn)",
        year: 2023,
      });

      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>ML Prediction Connection Test</h2>

      <button onClick={testPrediction}>
        Test ML Prediction
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
