/* =========================================================
   TELEMETRY.JS
   Drives the dedicated "Live Telemetry" page: top stat cards
   plus four charts (speed, acceleration, and the two
   requested-vs-applied command-integrity charts).
   ========================================================= */

const Telemetry = {
  charts: {},
  history: { speed: [], accel: [], reqThrottle: [], appThrottle: [], reqSteer: [], appSteer: [] },

  init() {
    const seed = mockGetTelemetryHistory(60);
    seed.forEach((p) => {
      this.history.speed.push(p.speed_kmh);
      this.history.accel.push(p.acceleration_ms2);
      this.history.reqThrottle.push(p.requested_throttle);
      this.history.appThrottle.push(p.applied_throttle);
      this.history.reqSteer.push(p.requested_steering);
      this.history.appSteer.push(p.applied_steering);
    });
    this.buildCharts();
  },

  buildCharts() {
    if (typeof Chart === "undefined") return;
    const labels = this.history.speed.map((_, i) => i);

    this.charts.speed = new Chart(document.getElementById("chartSpeed"), {
      type: "line",
      data: { labels, datasets: [lineSet(this.history.speed, "#22d3ee", "Speed")] },
      options: chartBaseOptions("km/h"),
    });

    this.charts.accel = new Chart(document.getElementById("chartAcceleration"), {
      type: "line",
      data: { labels, datasets: [lineSet(this.history.accel, "#3b82f6", "Acceleration")] },
      options: chartBaseOptions("m/s²"),
    });

    this.charts.throttle = new Chart(document.getElementById("chartThrottle"), {
      type: "line",
      data: {
        labels,
        datasets: [
          lineSet(this.history.reqThrottle, "#8ea0bd", "Requested", true),
          lineSet(this.history.appThrottle, "#2dd4a7", "Applied"),
        ],
      },
      options: withLegend(chartBaseOptions("")),
    });

    this.charts.steering = new Chart(document.getElementById("chartSteering"), {
      type: "line",
      data: {
        labels,
        datasets: [
          lineSet(this.history.reqSteer, "#8ea0bd", "Requested", true),
          lineSet(this.history.appSteer, "#a276ff", "Applied"),
        ],
      },
      options: withLegend(chartBaseOptions("")),
    });
  },

  renderStatCards(telemetry) {
    const el = document.getElementById("telemetryStatCards");
    if (!el) return;
    el.innerHTML = `
      ${statCardHTML("Speed", `${telemetry.speed_kmh.toFixed(1)} km/h`, "blue", iconSpeed())}
      ${statCardHTML("Acceleration", `${telemetry.acceleration_ms2.toFixed(2)} m/s²`, "purple", iconGauge())}
      ${statCardHTML("Throttle", telemetry.applied_throttle.toFixed(2), "green", iconBolt())}
      ${statCardHTML("Steering", telemetry.applied_steering.toFixed(2), "purple", iconGauge())}
      ${statCardHTML("Brake", telemetry.brake.toFixed(2), "red", iconWarning())}
    `;
  },

  pushPoint(telemetry) {
    const push = (arr, v) => { arr.push(v); if (arr.length > 60) arr.shift(); };
    push(this.history.speed, telemetry.speed_kmh);
    push(this.history.accel, telemetry.acceleration_ms2);
    push(this.history.reqThrottle, telemetry.requested_throttle);
    push(this.history.appThrottle, telemetry.applied_throttle);
    push(this.history.reqSteer, telemetry.requested_steering);
    push(this.history.appSteer, telemetry.applied_steering);

    if (!this.charts.speed) return;
    const labels = this.history.speed.map((_, i) => i);
    this.charts.speed.data.labels = labels;
    this.charts.speed.data.datasets[0].data = this.history.speed;
    this.charts.speed.update("none");

    this.charts.accel.data.labels = labels;
    this.charts.accel.data.datasets[0].data = this.history.accel;
    this.charts.accel.update("none");

    this.charts.throttle.data.labels = labels;
    this.charts.throttle.data.datasets[0].data = this.history.reqThrottle;
    this.charts.throttle.data.datasets[1].data = this.history.appThrottle;
    this.charts.throttle.update("none");

    this.charts.steering.data.labels = labels;
    this.charts.steering.data.datasets[0].data = this.history.reqSteer;
    this.charts.steering.data.datasets[1].data = this.history.appSteer;
    this.charts.steering.update("none");
  },
};

function lineSet(data, color, label, dashed) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: hexToRgba(color, 0.1),
    borderWidth: 2,
    borderDash: dashed ? [5, 4] : [],
    fill: !dashed,
    tension: 0.35,
    pointRadius: 0,
    pointHoverRadius: 4,
  };
}

function withLegend(opts) {
  opts.plugins.legend = { display: true, labels: { color: "#8ea0bd", boxWidth: 10, font: { size: 11 } } };
  return opts;
}
