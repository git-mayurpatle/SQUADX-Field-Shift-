# SQUADX

NASA Earth Observation and agricultural advisory application.

## Run locally

1. From the repository root, create and activate a Python virtual environment (Run this only if the project doesn't already have a .venv folder):
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
   If PowerShell blocks activation, run:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\.venv\Scripts\Activate.ps1
   ```
2. Install the backend Python dependencies:
   ```powershell
   cd backend
   python -m pip install -r requirements.txt
   ```
3. Start the API from `backend/`:
   ```powershell
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
4. Start the frontend from the repository root with:
   ```powershell
   cd ..
   npm install
   npm run dev
   ```

For local development, the frontend defaults to `http://127.0.0.1:8000` for its API.

## Deploy a shareable demo (Vercel + Railway)

Deploy the frontend and API as separate services. `vercel.json` supplies the
Vite single-page-app rewrite, and `backend/railway.json` supplies the API
start command and health check.

### 1. Deploy the API to Railway

1. Create a Railway project from this repository and set the service's **Root
   Directory** to `/backend`.
2. Ensure the service deploy includes `backend/models/` and
   `backend/datasets/raw/`; the yield prediction endpoints need their model
   artifact and dataset.
3. Deploy the service and generate a public domain. Check that
   `https://YOUR-API-DOMAIN/api/health` returns `{"status":"ok"}`.
4. Set the Railway service variable `FRONTEND_ORIGINS` to the exact Vercel
   origin, for example `https://your-app.vercel.app` (no path or trailing
   slash). Multiple origins can be comma-separated.

### 2. Deploy the frontend to Vercel

1. Import the same repository into Vercel with the repository root as the
   project root. Use `npm run build` as the build command and `dist` as the
   output directory.
2. Set the Vercel environment variable `VITE_API_BASE_URL` to the Railway
   public origin, for example `https://your-api.up.railway.app` (no `/api`
   suffix).
3. Redeploy after setting environment variables.

Share the Vercel HTTPS URL. The API base URL is included in the public
frontend bundle, so it must be a URL—not a secret. Do not put private API keys
or credentials in `VITE_*` variables.

Tracked GPS locations are stored in each user's browser and are not shared
between users. Third-party API availability, rate limits, and hosting resource
limits can affect live data and model endpoints.
