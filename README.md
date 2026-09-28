# CYBERSHIELD-DT
### Automotive Cybersecurity Digital Twin — Dashboard

A monitoring and visualization frontend for a CARLA-based automotive
cybersecurity digital twin. Built with **plain HTML5, CSS3, and vanilla
JavaScript only** — no frameworks, no build step.

```
CARLA → CyberShield Python → MongoDB Atlas → FastAPI REST API → this dashboard
```

The dashboard never talks to MongoDB or CARLA directly. It only calls a
FastAPI REST API over HTTP.

---

## Running it locally

No build tools required.

```bash
cd cybershield-dashboard
python3 -m http.server 5500
```

Then open `http://localhost:5500` in a browser. (Opening `index.html`
directly with `file://` also works, since everything is self-contained
except the Chart.js CDN script.)

---

## Folder structure

```
cybershield-dashboard/
│
├── index.html            Page shell + all six dashboard sections
├── css/
│   └── style.css         Theme variables, glassmorphism, layout, responsive rules
│
├── js/
│   ├── mockData.js        Mock responses shaped exactly like the future API
│   ├── api.js              ALL fetch() calls to FastAPI live here
│   ├── app.js               Navigation, polling loop, clock, error banners
│   ├── dashboard.js      Overview page (status cards, digital twin, alerts)
│   ├── telemetry.js        Live Telemetry page charts
│   ├── security.js          Security & Attacks page
│   └── experiments.js    Experiments, History and Analytics pages
│
├── assets/images/         Placeholder for future static assets
└── README.md
```

---

## Connecting to the real FastAPI backend

Everything is wired so this is a **two-line change**, in `js/api.js`:

```js
const API_BASE_URL = "http://your-backend-host:8000"; // was localhost:8000
const USE_MOCK_DATA = false;                           // was true
```

No other file needs to change. Every page module (`dashboard.js`,
`telemetry.js`, `security.js`, `experiments.js`) only ever calls the
functions exported from `api.js` (`getStatus()`, `getTelemetry()`,
`getSecurityStatus()`, `getLatestExperiment()`, `getExperiments()`,
`getAnalytics()`) — never `fetch()` directly.

### Expected FastAPI endpoints

| Method | Path                      | Used by                          |
|--------|---------------------------|-----------------------------------|
| GET    | `/api/status`             | Overview, Security & Attacks      |
| GET    | `/api/telemetry`          | Overview, Live Telemetry, Security |
| GET    | `/api/security`           | Overview, Security & Attacks      |
| GET    | `/api/experiments/latest` | Overview                          |
| GET    | `/api/experiments`        | Experiments, History              |
| GET    | `/api/analytics`          | Analytics                         |

Response shapes are documented as JSDoc-style comments above each mock
function in `js/mockData.js` and match the contract in the original
project brief exactly (`vehicle_id`, `speed_kmh`, `cyber_status`,
`attack_active`, `throttle_difference`, `steering_difference`,
`anomaly_score`, `experiment_id`, etc.).

Enable CORS on the FastAPI side for the origin the dashboard is served
from, e.g.:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

---

## Live updates

The dashboard polls `/api/status`, `/api/telemetry`, and `/api/security`
every second (`setInterval` in `js/app.js`). Polling is isolated in one
place so it can be swapped for a WebSocket push later without touching
any page-rendering code.

## Error states

- If a poll fails, the header's **API** indicator turns red and a
  banner reads `API OFFLINE` (or `DATABASE UNAVAILABLE` while in mock
  mode, to preview the same UI state).
- The dashboard never throws an unhandled error to the user — failures
  are caught, logged to the console, and reflected in the UI instead.

## What's intentionally not implemented here

- No CARLA video/camera stream (the "Vehicle State" panel is a clearly
  labeled placeholder, structured so a stream can be dropped in later).
- No direct MongoDB access from the browser — by design, only FastAPI
  is a fetch target.
- No CARLA control — this is a read-only monitoring surface.
