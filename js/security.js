/* =========================================================
   SECURITY.JS
   Drives the "Security & Attacks" page: command-integrity
   comparison, anomaly detection panel, and the security
   status cards.
   ========================================================= */

const Security = {
  chart: null,
  history: { req: [], app: [], labels: [] },

  init() {
    const seed = mockGetTelemetryHistory(60);
    seed.forEach((p, i) => {
      this.history.req.push(p.requested_steering);
      this.history.app.push(p.applied_steering);
      this.history.labels.push(i);
    });
    this.buildChart();
  },

  buildChart() {
    if (typeof Chart === "undefined") return;
    this.chart = new Chart(document.getElementById("chartCommandIntegrity"), {
      type: "line",
      data: {
        labels: this.history.labels,
        datasets: [
          lineSet(this.history.req, "#8ea0bd", "Requested", true),
          lineSet(this.history.app, "#f0475f", "Applied"),
        ],
      },
      options: withLegend(chartBaseOptions("steering")),
    });
  },

  renderStatCards(status) {
    const el = document.getElementById("securityStatCards");
    if (!el) return;
    const attack = status.attack_active ? (status.attack_type || "ACTIVE") : "NONE";
    el.innerHTML = `
      ${statCardHTML("Cyber Status", status.cyber_status, status.attack_active ? "red" : "green", iconShield())}
      ${statCardHTML("Active Attack", status.attack_active ? "YES" : "NO", status.attack_active ? "red" : "green", iconBolt())}
      ${statCardHTML("Attack Type", attack, status.attack_active ? "red" : "amber", iconWarning())}
      ${statCardHTML("Risk Level", status.risk_level, riskTone(status.risk_level), iconGauge())}
    `;
  },

  renderCommandTable(telemetry, sec) {
    const table = document.getElementById("commandIntegrityTable");
    if (!table) return;
    table.innerHTML = rowsHTML([
      ["Requested Steering", telemetry.requested_steering.toFixed(2)],
      ["Applied Steering", telemetry.applied_steering.toFixed(2)],
      ["Command Difference", sec.steering_difference.toFixed(2)],
      ["Detection Threshold", "0.20"],
      ["Safety Impact", sec.safety_impact],
    ]);
  },

  renderAlert(status, sec) {
    const card = document.getElementById("securityAlertCard");
    const body = document.getElementById("securityAlertBody");
    if (!card || !body) return;
    if (status.attack_active) {
      card.className = "card alert-card state-attack";
      body.innerHTML = `
        <div class="alert-icon">${iconWarning()}</div>
        <h3 class="alert-title">CYBERSECURITY ANOMALY DETECTED</h3>
        <p class="alert-sub">${sec.safety_impact}</p>
        <div class="alert-detail-row"><span>Attack</span><span>${status.attack_type || "UNKNOWN"}</span></div>
        <div class="alert-detail-row"><span>Anomaly Score</span><span>${sec.anomaly_score.toFixed(2)}</span></div>
      `;
    } else {
      card.className = "card alert-card state-normal";
      body.innerHTML = `
        <div class="alert-icon">${iconCheck()}</div>
        <h3 class="alert-title">No anomalies detected</h3>
        <p class="alert-sub">Command integrity within normal thresholds</p>
      `;
    }
  },

  pushPoint(telemetry) {
    const push = (arr, v) => { arr.push(v); if (arr.length > 60) arr.shift(); };
    push(this.history.req, telemetry.requested_steering);
    push(this.history.app, telemetry.applied_steering);
    this.history.labels = this.history.req.map((_, i) => i);
    if (!this.chart) return;
    this.chart.data.labels = this.history.labels;
    this.chart.data.datasets[0].data = this.history.req;
    this.chart.data.datasets[1].data = this.history.app;
    this.chart.update("none");
  },
};
