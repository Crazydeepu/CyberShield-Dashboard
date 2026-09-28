/* =========================================================
   EXPERIMENTS.JS
   Drives the Experiments page (card grid), the History page
   (full table), and the Analytics page (aggregate charts).
   Experiment rows come from GET /api/experiments and require
   no HTML changes as new experiments are added.
   ========================================================= */

const Experiments = {
  charts: {},

  async loadExperimentsPage() {
    const grid = document.getElementById("experimentsGrid");
    if (!grid) return;
    try {
      const experiments = await getExperiments();
      grid.innerHTML = experiments.map(expCardHTML).join("");
    } catch (e) {
      grid.innerHTML = `<p class="stat-sub">Unable to load experiments &mdash; DATABASE UNAVAILABLE</p>`;
    }
  },

  async loadHistoryPage() {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;
    try {
      const experiments = await getExperiments();
      tbody.innerHTML = experiments.map((e) => `
        <tr>
          <td>${e.experiment_id}</td>
          <td>${e.experiment_type}</td>
          <td>${e.duration_s.toFixed(1)} s</td>
          <td>${e.samples}</td>
          <td>${e.maximum_speed_kmh.toFixed(1)} km/h</td>
          <td><span class="risk-pill ${e.risk_level}">${e.risk_level}</span></td>
        </tr>`).join("");
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6">DATABASE UNAVAILABLE</td></tr>`;
    }
  },

  async loadAnalyticsPage() {
    if (typeof Chart === "undefined") return;
    let a;
    try {
      a = await getAnalytics();
    } catch (e) {
      const el = document.getElementById("analyticsStatCards");
      if (el) el.innerHTML = `<p class="stat-sub">DATABASE UNAVAILABLE</p>`;
      return;
    }

    const statEl = document.getElementById("analyticsStatCards");
    if (statEl) {
      statEl.innerHTML = `
        ${statCardHTML("Avg Attack Duration", `${a.attack_duration_avg_s.toFixed(1)} s`, "purple", iconGauge())}
        ${statCardHTML("Max Throttle Diff", a.max_throttle_difference.toFixed(2), "amber", iconBolt())}
        ${statCardHTML("Max Steering Diff", a.max_steering_difference.toFixed(2), "red", iconWarning())}
      `;
    }

    this._bar("chartAnalyticsSpeed", ["Normal", "Attack"], [a.normal_vs_attack_speed.normal, a.normal_vs_attack_speed.attack], ["#2dd4a7", "#f0475f"], "km/h");
    this._bar("chartAnalyticsAccel", ["Normal", "Attack"], [a.normal_vs_attack_acceleration.normal, a.normal_vs_attack_acceleration.attack], ["#2dd4a7", "#f0475f"], "m/s²");

    const types = Object.keys(a.experiments_by_attack_type);
    const counts = Object.values(a.experiments_by_attack_type);
    this._bar("chartAttackTypes", types, counts, types.map((_, i) => ["#22d3ee", "#3b82f6", "#a276ff", "#f5a623", "#f0475f"][i % 5]), "count");

    this._bar(
      "chartCommandDiff",
      a.experiment_command_diff.map((d) => d.id),
      a.experiment_command_diff.map((d) => Number(d.diff.toFixed(2))),
      a.experiment_command_diff.map((d) => (d.diff > 0.6 ? "#f0475f" : d.diff > 0.25 ? "#f5a623" : "#2dd4a7")),
      "diff"
    );
  },

  _bar(canvasId, labels, data, colors, unit) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.charts[canvasId]) this.charts[canvasId].destroy();
    this.charts[canvasId] = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 6, maxBarThickness: 46 }] },
      options: chartBaseOptions(unit),
    });
  },
};

function expCardHTML(e) {
  return `
    <div class="exp-card">
      <div class="exp-card-head">
        <span class="exp-card-id">${e.experiment_id}</span>
        <span class="risk-pill ${e.risk_level}">${e.risk_level}</span>
      </div>
      <div class="exp-card-type">${e.experiment_type}</div>
      <div class="exp-card-body">
        <div><span>Samples</span><b>${e.samples}</b></div>
        <div><span>Duration</span><b>${e.duration_s.toFixed(1)} s</b></div>
        <div><span>Avg Speed</span><b>${e.average_speed_kmh.toFixed(1)} km/h</b></div>
        <div><span>Max Speed</span><b>${e.maximum_speed_kmh.toFixed(1)} km/h</b></div>
        <div><span>Avg Accel</span><b>${e.average_acceleration_ms2.toFixed(2)} m/s²</b></div>
      </div>
      <div class="exp-card-impact">${e.safety_impact}</div>
    </div>`;
}
