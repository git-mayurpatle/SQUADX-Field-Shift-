import React, { lazy, Suspense, useState, useEffect } from 'react';
import LocationTracker from './components/LocationTracker';
import Header from './components/Header';
import Navigation from './components/Navigation';
import { PRESET_FIELDS } from './data/fieldsData';
import { fetchNasaPowerData } from './data/nasaDataService';
import { apiUrl } from './services/apiBase';

const Dashboard = lazy(() => import('./components/Dashboard'));
const SatelliteMap = lazy(() => import('./components/SatelliteMap'));
const FieldTwin3D = lazy(() => import('./components/FieldTwin3D'));
const ClimateRiskDashboard = lazy(() => import('./components/ClimateRiskDashboard'));
const CropRotationSimulator = lazy(() => import('./components/CropRotationSimulator'));
const SoilWaterHealth = lazy(() => import('./components/SoilWaterHealth'));
const ScenarioLab = lazy(() => import('./components/ScenarioLab'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const ProfitVsResilience = lazy(() => import('./components/ProfitVsResilience'));
const NasaChallengeDossier = lazy(() => import('./components/NasaChallengeDossier'));
const GitSyncModal = lazy(() => import('./components/GitSyncModal'));
const CropAdvisoryEngine = lazy(() => import('./components/CropAdvisoryEngine'));

const TRACKED_LOCATIONS_STORAGE_KEY = 'squadx-tracked-locations';
const MAX_SAVED_TRACKED_LOCATIONS = 10;

function createTrackedField(location) {
  const fieldTemplate = PRESET_FIELDS[0];
  return {
    ...fieldTemplate,
    id: location.id,
    name: location.name,
    location: location.location,
    regionName: 'GPS-tracked location',
    lat: location.lat,
    lon: location.lon,
    accuracy: location.accuracy ?? null,
    trackedAt: location.trackedAt,
    isGpsLocation: true,
    isDemoData: false,
    totalAreaAcres: null,
    elevationMeters: null,
    currentCrop: null,
    previousCrop: null,
    activeSeason: null,
    irrigationType: null,
    soilType: null,
    soilTexture: null,
    soilIndicators: Object.fromEntries(
      Object.entries(fieldTemplate.soilIndicators).map(([key, indicator]) => [
        key,
        { ...indicator, value: null, source: 'unavailable', label: 'Not measured', status: 'unknown' },
      ]),
    ),
    satelliteHealth: {
      ...fieldTemplate.satelliteHealth,
      currentNdvi: null,
      lastMonthNdvi: null,
      changePercent: null,
      vegetationStatus: 'Not measured',
      canopyCoveragePercent: null,
      stressZonesCount: null,
      stressNotes: 'Satellite vegetation data unavailable',
      historicalNdviTimeline: [],
    },
    plots: [],
    polygonBounds: [],
  };
}

function readTrackedLocations() {
  try {
    const stored = localStorage.getItem(TRACKED_LOCATIONS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error('Saved tracked locations must be a list');
    }

    return parsed
      .filter((item) =>
        item
        && typeof item.id === 'string'
        && typeof item.name === 'string'
        && typeof item.location === 'string'
        && Number.isFinite(item.lat)
        && Number.isFinite(item.lon),
      )
      .slice(0, MAX_SAVED_TRACKED_LOCATIONS);
  } catch (error) {
    console.warn('Unable to load saved tracked locations:', error);
    return [];
  }
}

export default function App() {
  const [currentLang, setCurrentLang] = useState('en');
  const [locationState, setLocationState] = useState(() => {
    const trackedLocations = readTrackedLocations();
    return {
      trackedLocations,
      activeField: trackedLocations[0] ? createTrackedField(trackedLocations[0]) : null,
    };
  });
  const { trackedLocations, activeField } = locationState;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasVisitedFieldTwin, setHasVisitedFieldTwin] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);

  const [nasaData, setNasaData] = useState(null);
  const [isLoadingNasa, setIsLoadingNasa] = useState(false);
  const [satelliteFarmData, setSatelliteFarmData] = useState({
    fieldId: null,
    geometry: null,
    areaAcres: null,
    timeline: [],
    loading: false,
    error: ""
  });
  const [soilWaterData, setSoilWaterData] = useState({
    fieldId: null,
    requestKey: "",
    geometry: null,
    data: null,
    loading: false,
    error: ""
  });
  const [soilScreeningInputs, setSoilScreeningInputs] = useState({});

  const handleTabChange = (tab) => {
    if (tab === 'fieldTwin3D') {
      setHasVisitedFieldTwin(true);
    }
    setActiveTab(tab);
  };

  const updateSoilScreeningInput = (key, value) => {
    setSoilScreeningInputs((current) => ({
      ...current,
      [activeField.id]: {
        ...current[activeField.id],
        [key]: value,
      },
    }));
  };

  const activeSoilGeometry = satelliteFarmData.fieldId === activeField?.id
    ? satelliteFarmData.geometry
    : null;
  const soilWaterRequestKey = !activeField
    ? ''
    : activeSoilGeometry
      ? `${activeField.id}|polygon|${JSON.stringify(activeSoilGeometry)}`
      : `${activeField.id}|point|${activeField.lat},${activeField.lon}`;
  const hasSoilWaterRequest = Boolean(activeSoilGeometry)
    || (Number.isFinite(activeField?.lat) && Number.isFinite(activeField?.lon));
  const soilWaterLoading = hasSoilWaterRequest
    && soilWaterData.requestKey !== soilWaterRequestKey;
  const currentSoilWaterData = { ...soilWaterData, loading: soilWaterLoading };

  useEffect(() => {
    const geometry = activeSoilGeometry;
    const hasCoordinates = Number.isFinite(activeField?.lat) && Number.isFinite(activeField?.lon);
    if (!activeField) return;
    if (!geometry && !hasCoordinates) return;

    const controller = new AbortController();

    async function loadSoilWater() {
      try {
        const response = await fetch(apiUrl('/api/soil-water'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geometry
            ? { geometry }
            : { latitude: activeField.lat, longitude: activeField.lon }),
          signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Soil and water data unavailable");
        setSoilWaterData({
          fieldId: activeField.id,
          requestKey: soilWaterRequestKey,
          geometry,
          data: result,
          loading: false,
          error: ""
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setSoilWaterData({
            fieldId: activeField.id,
            requestKey: soilWaterRequestKey,
            geometry,
            data: null,
            loading: false,
            error: error.message
          });
        }
      }
    }

    loadSoilWater();
    return () => controller.abort();
  }, [activeField, activeSoilGeometry, soilWaterRequestKey]);

  // Load NASA data whenever the selected coordinates change.
  useEffect(() => {
    if (!activeField) return;
    let isMounted = true;

    const loadNasa = async () => {
      setIsLoadingNasa(true);
      setNasaData(null);

      try {
        const data = await fetchNasaPowerData(
          activeField.lat,
          activeField.lon,
          90
        );

        if (isMounted) {
          setNasaData(data);
        }
      } catch (err) {
        console.error('NASA data load error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingNasa(false);
        }
      }
    };

    loadNasa();

    return () => {
      isMounted = false;
    };
  }, [activeField]);

  const refreshNasaData = async () => {
    setIsLoadingNasa(true);

    try {
      const data = await fetchNasaPowerData(
        activeField.lat,
        activeField.lon,
        90
      );

      setNasaData(data);
    } catch (err) {
      console.error('Failed to refresh NASA data:', err);
    } finally {
      setIsLoadingNasa(false);
    }
  };

  // Receive GPS coordinates and nearby place name
  // from LocationTracker.jsx.
  const handleLocationDetected = (coords) => {
    const info = coords.locationInfo || {};

    const locationParts = [
      info.place,
      info.district,
      info.state,
      info.country
    ].filter(Boolean);

    const locationName = locationParts.length
      ? [...new Set(locationParts)].join(', ')
      : 'GPS Location';

    const id = `tracked-${coords.latitude.toFixed(4)}-${coords.longitude.toFixed(4)}`;
    const trackedLocation = {
      id,
      name: locationName,
      location: locationName,
      lat: coords.latitude,
      lon: coords.longitude,
      accuracy: coords.accuracy ?? null,
      trackedAt: new Date().toISOString(),
    };
    const nextTrackedLocations = [
      trackedLocation,
      ...trackedLocations.filter((item) => item.id !== id),
    ].slice(0, MAX_SAVED_TRACKED_LOCATIONS);

    try {
      localStorage.setItem(TRACKED_LOCATIONS_STORAGE_KEY, JSON.stringify(nextTrackedLocations));
    } catch (error) {
      console.error('Unable to save tracked location history:', error);
    }

    setLocationState({
      trackedLocations: nextTrackedLocations,
      activeField: createTrackedField(trackedLocation),
    });
  };

  const availableFields = [
    ...trackedLocations.map(createTrackedField),
    ...PRESET_FIELDS,
  ];
  const handleActiveFieldChange = (field) => {
    setLocationState((current) => ({ ...current, activeField: field }));
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Temporary ML Prediction Connection Test */}

      {/* 1. Header Bar */}
      <Header
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        activeField={activeField}
        setActiveField={handleActiveFieldChange}
        presetFields={availableFields}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onOpenGitSync={() => setIsGitModalOpen(true)}
        nasaStatus={
          isLoadingNasa
            ? 'Syncing NASA...'
            : nasaData
              ? 'NASA Data Loaded'
              : 'NASA Data Unavailable'
        }
      />

      {/* 2. Top Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentLang={currentLang}
      />

      {/* 3. Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16">

        {/* GPS Location Detection and NASA API */}
        <LocationTracker
          onLocationDetected={handleLocationDetected}
        />

        {!activeField ? (
          <div className="glass-panel rounded-xl border border-amber-500/30 p-5 text-sm text-slate-200">
            <h2 className="text-lg font-semibold text-amber-300">Track a location to get started</h2>
            <p className="mt-2 text-slate-300">
              No previously tracked location is saved in this browser. Detect your current location above,
              choose a saved tracked location, or select a clearly labeled demo field. Farm-specific
              recommendations are hidden until a location is selected.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Tracked locations are saved only in this browser on this device.
            </p>
          </div>
        ) : <Suspense fallback={<div className="py-12 text-center text-sm text-slate-400">Loading section…</div>}>
          {activeTab === 'dashboard' && (
            <Dashboard
              activeField={activeField}
              setActiveTab={handleTabChange}
              nasaData={nasaData}
              satelliteFarmData={satelliteFarmData}
              soilWaterData={currentSoilWaterData}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'advisory' && (
            <CropAdvisoryEngine
              activeField={activeField}
              nasaData={nasaData}
              soilWaterData={currentSoilWaterData}
              currentLang={currentLang}
              audioEnabled={audioEnabled}
            />
          )}

          {activeTab === 'satellite' && (
            <SatelliteMap
              key={activeField.id}
              activeField={activeField}
              savedFarmData={satelliteFarmData}
              onFarmDataChange={setSatelliteFarmData}
              currentLang={currentLang}
            />
          )}

          {(activeTab === 'fieldTwin3D' || hasVisitedFieldTwin) && (
            <div hidden={activeTab !== 'fieldTwin3D'}>
              <FieldTwin3D
                key={activeField.id}
                activeField={activeField}
                satelliteData={satelliteFarmData.fieldId === activeField.id ? satelliteFarmData : null}
                soilWaterData={currentSoilWaterData.fieldId === activeField.id ? currentSoilWaterData.data : null}
                nasaData={nasaData}
                isActive={activeTab === 'fieldTwin3D'}
              />
            </div>
          )}

          {activeTab === 'climateRisk' && (
            <ClimateRiskDashboard
              nasaData={nasaData}
              onRefreshNasa={refreshNasaData}
              isLoadingNasa={isLoadingNasa}
              activeField={activeField}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'rotation' && (
            <CropRotationSimulator
              activeField={activeField}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'soilWater' && (
            <SoilWaterHealth
              activeField={activeField}
              soilWaterData={currentSoilWaterData}
              soilScreeningInputs={soilScreeningInputs[activeField.id] || {}}
              onSoilScreeningInputChange={updateSoilScreeningInput}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioLab
              activeField={activeField}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'aiAdvisor' && (
            <AIAssistant
              activeField={activeField}
              currentLang={currentLang}
              audioEnabled={audioEnabled}
            />
          )}

          {activeTab === 'profit' && (
            <ProfitVsResilience
              activeField={activeField}
              currentLang={currentLang}
            />
          )}

          {activeTab === 'gitSync' && (
            <NasaChallengeDossier
              activeField={activeField}
              nasaData={nasaData}
              onOpenGitModal={() => setIsGitModalOpen(true)}
            />
          )}
        </Suspense>}

      </main>

      {/* 4. Git Sync Modal */}
      {isGitModalOpen && (
        <Suspense fallback={null}>
          <GitSyncModal
            isOpen={isGitModalOpen}
            onClose={() => setIsGitModalOpen(false)}
            activeField={activeField}
            nasaData={nasaData}
          />
        </Suspense>
      )}

      {/* 5. Modern Footer */}
      <footer className="border-t border-slate-900 bg-[#05080f] py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-['Outfit']">
              SQUADX
            </span>
            <span>•</span>
            <span>
              NASA Space Apps Challenge Agro-Intelligence Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://github.com/rupeshpatil14042006-cpu/NASA.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              GitHub: rupeshpatil14042006-cpu/NASA
            </a>
            <span>•</span>
            <span>NASA POWER & Earthdata Integration</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
