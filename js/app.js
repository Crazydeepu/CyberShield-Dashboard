/* =========================================================
   APP.JS
   Application bootstrap: page navigation (SPA-style, no
   reload), the polling loop that keeps the dashboard live,
   the header clock, and global connection/error handling.
   ========================================================= */

const App = {
  currentPage: "overview",
  pollHandle: null,
  apiHealthy: true,

  init() {
    this.bindNav();
    this.startClock();
    Dashboard.init();
    Telemetry.init();
    Security.init();
    this.loadAll();
    this.startPolling();
  },

  bindNav() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => this.goToPage(btn.dataset.page));
    });
  },

  goToPage(page) {
    this.currentPage = page;
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");

    // Lazily load data for pages that aren't part of the 1s poll loop.
    if (page === "experiments") Experiments.loadExperimentsPage();
    if (page === "history") Experiments.loadHistoryPage();
    if (page === "analytics") Experiments.loadAnalyticsPage();
  },

  startClock() {
    const update = () => {
      const now = new Date();
      setText("dtDate", now.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }));
      setText("dtTime", now.toLocaleTimeString());
    };
    update();
    setInterval(update, 1000);
  },

  startPolling() {
    // Polling interval kept separate from chart-update rate so it can
    // later be swapped for a WebSocket push without touching page code.
    this.pollHandle = setInterval(() => this.loadAll(), 1000);
  },

  async loadAll() {
    try {
      const [status, telemetry, security] = await Promise.all([
        getStatus(),
        getTelemetry(),
        getSecurityStatus(),
      ]);
      this.setApiHealthy(true);

      // Overview page
      Dashboard.renderStatusCards(status);
      Dashboard.renderTwin(telemetry);
      Dashboard.renderSecurityMetrics(security);
      Dashboard.renderAlert(status, security);
      Dashboard.pushPoint(telemetry);

      // Latest experiment (lighter polling — only needed occasionally,
      // but kept simple here; safe to call every tick against mock data).
      getLatestExperiment().then((exp) => Dashboard.renderLatestExperiment(exp)).catch(() => {});

      // Live Telemetry page
      Telemetry.renderStatCards(telemetry);
      Telemetry.pushPoint(telemetry);

      // Security & Attacks page
      Security.renderStatCards(status);
      Security.renderCommandTable(telemetry, security);
      Security.renderAlert(status, security);
      Security.pushPoint(telemetry);

      // Sidebar vehicle status
      const sv = document.getElementById("sidebarVehicleStatus");
      if (sv) sv.innerHTML = status.connected
        ? `<span class="dot dot-green"></span> ONLINE`
        : `<span class="dot dot-red"></span> OFFLINE`;

    } catch (err) {
      console.error("[app.js] Dashboard refresh failed:", err);
      this.setApiHealthy(false);
    }
  },

  setApiHealthy(healthy) {
    this.apiHealthy = healthy;
    const banner = document.getElementById("globalBanner");
    const apiPill = document.getElementById("conn-api");
    if (!banner || !apiPill) return;

    if (healthy) {
      banner.classList.add("hidden");
      apiPill.innerHTML = `<span class="dot dot-blue"></span> API Online`;
    } else {
      banner.classList.remove("hidden");
      banner.textContent = USE_MOCK_DATA
        ? "DATABASE UNAVAILABLE — showing last known mock state"
        : "API OFFLINE — unable to reach FastAPI backend";
      apiPill.innerHTML = `<span class="dot dot-red"></span> API Offline`;
    }
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
