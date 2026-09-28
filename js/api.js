/* =========================================================
   API LAYER
   Every network call to the FastAPI backend goes through
   this file. No other JavaScript file should call fetch()
   directly against a hardcoded URL.

   TO GO LIVE:
     1. Set API_BASE_URL to your FastAPI server.
     2. Set USE_MOCK_DATA = false.
   Nothing else in the codebase needs to change.
   ========================================================= */

const API_BASE_URL = "http://localhost:8000";

// Toggle this to false once the FastAPI backend is running.
const USE_MOCK_DATA = false;

/** Generic fetch wrapper with consistent error handling. */
async function _apiGet(path) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`API error ${response.status} on ${path}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`[api.js] Request failed: ${path}`, err);
    throw err;
  }
}

async function getStatus() {
  if (USE_MOCK_DATA) return mockGetStatus();
  return _apiGet("/api/status");
}

async function getTelemetry() {
  if (USE_MOCK_DATA) return mockGetTelemetry();
  return _apiGet("/api/telemetry");
}

async function getSecurityStatus() {
  if (USE_MOCK_DATA) return mockGetSecurity();
  return _apiGet("/api/security");
}

async function getLatestExperiment() {
  if (USE_MOCK_DATA) return mockGetExperimentsLatest();
  return _apiGet("/api/experiments/latest");
}

async function getExperiments() {
  if (USE_MOCK_DATA) return mockGetExperiments();
  return _apiGet("/api/experiments");
}

async function getAnalytics() {
  if (USE_MOCK_DATA) return mockGetAnalytics();
  return _apiGet("/api/analytics");
}
