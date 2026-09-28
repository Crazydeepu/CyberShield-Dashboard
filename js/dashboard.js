/* =========================================================
   DASHBOARD.JS
   Renders the Overview page: top status cards, vehicle
   digital-twin panel, security metrics, latest experiment
   summary, and the active alert banner.
   ========================================================= */

const Dashboard = {
  overviewChart: null,
  activeMetric: "speed",
  telemetryHistory: { speed: [], throttle: [], steering: [], acceleration: [] },

  init() {
    this.seedHistory();
    this.buildOverviewChart();
    this.bindTabs();
  },

  seedHistory() {
    const hist = mockGetTelemetryHistory(60);
    this.telemetryHistory.speed = hist.map((h) => h.speed_kmh);
    this.telemetryHistory.throttle = hist.map((h) => h.applied_throttle);
    this.telemetryHistory.steering = hist.map((h) => h.applied_steering);
    this.telemetryHistory.acceleration = hist.map((h) => h.acceleration_ms2);
  },

  bindTabs() {
    document.querySelectorAll("#telemetryTabs .tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#telemetryTabs .tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeMetric = btn.dataset.metric;
        this.redrawOverviewChart();
      });
    });
  },

  buildOverviewChart() {
    const ctx = document.getElementById("overviewTelemetryChart");
    if (!ctx || typeof Chart === "undefined") return;
    this.overviewChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.telemetryHistory.speed.map((_, i) => i),
        datasets: [this._dataset(this.telemetryHistory.speed, getComputedStyle(document.documentElement).getPropertyValue("--cyan"))],
      },
      options: chartBaseOptions("km/h"),
    });
  },

  _dataset(data, color) {
    color = (color || "#22d3ee").trim();
    return {
      data,
      borderColor: color,
      backgroundColor: hexToRgba(color, 0.12),
      borderWidth: 2,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
    };
  },

  redrawOverviewChart() {
    if (!this.overviewChart) return;
    const map = {
      speed: { data: this.telemetryHistory.speed, color: "--cyan", unit: "km/h" },
      throttle: { data: this.telemetryHistory.throttle, color: "--green", unit: "" },
      steering: { data: this.telemetryHistory.steering, color: "--purple", unit: "" },
      acceleration: { data: this.telemetryHistory.acceleration, color: "--blue", unit: "m/s²" },
    };
    const chosen = map[this.activeMetric];
    const color = getComputedStyle(document.documentElement).getPropertyValue(chosen.color);
    this.overviewChart.data.labels = chosen.data.map((_, i) => i);
    this.overviewChart.data.datasets = [this._dataset(chosen.data, color)];
    this.overviewChart.options.scales.y.title.text = chosen.unit;
    this.overviewChart.update("none");
  },

  pushPoint(telemetry) {
    const push = (arr, v) => { arr.push(v); if (arr.length > 60) arr.shift(); };
    push(this.telemetryHistory.speed, telemetry.speed_kmh);
    push(this.telemetryHistory.throttle, telemetry.applied_throttle);
    push(this.telemetryHistory.steering, telemetry.applied_steering);
    push(this.telemetryHistory.acceleration, telemetry.acceleration_ms2);
    this.redrawOverviewChart();
  },

  renderStatusCards(status) {
    const el = document.getElementById("statusCards");
    if (!el) return;

    const attack = status.attack_active
      ? (status.attack_type || "ACTIVE")
      : "NONE";

    const vehicleName = status.vehicle_model || "PRISM Model 3";

    el.innerHTML = `
      ${statCardHTML(
      "Vehicle Status",
      status.connected ? "ONLINE" : "OFFLINE",
      status.connected ? "green" : "red",
      iconCar(),
      `${vehicleName} (CARLA)`
    )}

      ${statCardHTML(
      "Current Speed",
      `${Number(status.speed_kmh || 0).toFixed(1)} km/h`,
      "blue",
      iconSpeed()
    )}

      ${statCardHTML(
      "Cyber Status",
      status.cyber_status || "UNKNOWN",
      status.attack_active ? "red" : "green",
      iconShield()
    )}

      ${statCardHTML(
      "Active Attack",
      attack,
      status.attack_active ? "red" : "amber",
      iconBolt()
    )}

      ${statCardHTML(
      "Risk Level",
      status.risk_level || "UNKNOWN",
      riskTone(status.risk_level),
      iconGauge()
    )}
    `;
  },

  renderTwin(telemetry) {
    const setBar = (id, val) => {
      const bar = document.getElementById(id);
      if (bar) bar.style.width = `${Math.min(100, Math.abs(val) * 100)}%`;
    };
    setText("twinSpeed", `${telemetry.speed_kmh.toFixed(1)} km/h`);
    setText("twinThrottle", telemetry.applied_throttle.toFixed(2));
    setText("twinSteering", telemetry.applied_steering.toFixed(2));
    setText("twinBrake", telemetry.brake.toFixed(2));
    setBar("twinThrottleBar", telemetry.applied_throttle);
    setBar("twinSteeringBar", telemetry.applied_steering);
    setBar("twinBrakeBar", telemetry.brake);
  },

  renderSecurityMetrics(sec) {
    const el = document.getElementById("securityMetrics");
    if (!el) return;
    el.innerHTML = `
      ${metricBoxHTML("Throttle Difference", sec.throttle_difference.toFixed(2))}
      ${metricBoxHTML("Steering Difference", sec.steering_difference.toFixed(2))}
      ${metricBoxHTML("Anomaly Score", sec.anomaly_score.toFixed(2))}
      ${metricBoxHTML("Detection Status", sec.attack_active ? "ANOMALY" : "NORMAL", sec.attack_active ? "red" : "green")}
    `;
  },

  renderLatestExperiment(exp) {
    setText("latestExpId", exp.experiment_id);
    const table = document.getElementById("latestExperimentTable");
    if (!table) return;
    table.innerHTML = rowsHTML([
      ["Experiment Type", exp.experiment_type],
      ["Duration", `${exp.duration_s.toFixed(3)} s`],
      ["Samples", `${exp.samples} samples`],
      ["Average Speed", `${exp.average_speed_kmh.toFixed(3)} km/h`],
      ["Maximum Speed", `${exp.maximum_speed_kmh.toFixed(3)} km/h`],
      ["Average Acceleration", `${exp.average_acceleration_ms2.toFixed(3)} m/s²`],
      ["Risk Level", exp.risk_level],
      ["Safety Impact", exp.safety_impact],
    ]);
  },

  renderAlert(status, sec) {
    const card = document.getElementById("alertCard");
    const body = document.getElementById("alertBody");
    if (!card || !body) return;
    if (status.attack_active) {
      card.className = "card alert-card state-attack";
      body.innerHTML = `
        <div class="alert-icon">${iconWarning()}</div>
        <h3 class="alert-title">CYBERSECURITY ANOMALY DETECTED</h3>
        <p class="alert-sub">${sec.safety_impact}</p>
        <div class="alert-detail-row"><span>Attack</span><span>${status.attack_type || "UNKNOWN"}</span></div>
        <div class="alert-detail-row"><span>Risk</span><span>${status.risk_level}</span></div>
      `;
    } else {
      card.className = "card alert-card state-normal";
      body.innerHTML = `
        <div class="alert-icon">${iconCheck()}</div>
        <h3 class="alert-title">No active security alerts</h3>
        <p class="alert-sub">Vehicle is operating normally</p>
      `;
    }
  },
};

/* ---------- shared small helpers used across page modules ---------- */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function riskTone(level) {
  if (level === "HIGH") return "red";
  if (level === "MEDIUM") return "amber";
  return "green";
}

function hexToRgba(hex, alpha) {
  hex = hex.trim().replace("#", "");
  if (hex.length !== 6) return `rgba(34,211,238,${alpha})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function chartBaseOptions(unit = "") {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0b1220",
        borderColor: "rgba(148,175,214,0.2)",
        borderWidth: 1,
        titleColor: "#8ea0bd",
        bodyColor: "#eaf0fb",
        padding: 10,
      },
    },
    scales: {
      x: { grid: { color: "rgba(148,175,214,0.06)" }, ticks: { color: "#5c6c86", maxTicksLimit: 8 } },
      y: {
        grid: { color: "rgba(148,175,214,0.06)" },
        ticks: { color: "#5c6c86" },
        title: { display: !!unit, text: unit, color: "#5c6c86" },
      },
    },
  };
}

function statCardHTML(label, value, tone, icon, sub) {
  return `
    <div class="stat-card tone-${tone}">
      <div class="stat-icon">${icon}</div>
      <div>
        <p class="stat-label">${label}</p>
        <p class="stat-value tone-${tone}">${value}</p>
        ${sub ? `<p class="stat-sub">${sub}</p>` : ""}
      </div>
    </div>`;
}

function metricBoxHTML(label, value, tone) {
  return `
    <div class="metric-box">
      <span>${label}</span>
      <b style="${tone ? `color:var(--${tone})` : ""}">${value}</b>
    </div>`;
}

function rowsHTML(pairs) {
  return pairs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
}

/* ---------- inline icon set (no external image dependency) ---------- */
function iconCar() { return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7.5" cy="16.5" r="1.4" fill="currentColor"/><circle cx="16.5" cy="16.5" r="1.4" fill="currentColor"/></svg>`; }
function iconSpeed() { return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 12L16 8M4 14a8 8 0 1116 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`; }
function iconShield() { return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2l8 3v6c0 5.2-3.4 9.8-8 11-4.6-1.2-8-5.8-8-11V5l8-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
function iconBolt() { return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`; }
function iconGauge() { return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 15a8 8 0 1116 0" stroke="currentColor" stroke-width="1.6"/><path d="M12 15l3-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`; }
function iconWarning() { return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M12 3L2 20h20L12 3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`; }
function iconCheck() { return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M12 2l8 3v6c0 5.2-3.4 9.8-8 11-4.6-1.2-8-5.8-8-11V5l8-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
