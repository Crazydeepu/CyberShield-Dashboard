/* =========================================================
   MOCK DATA
   Mirrors the EXACT structure of the future FastAPI responses.
   Toggle USE_MOCK_DATA (in api.js) to false once the backend
   is live — no other file needs to change.
   ========================================================= */

/**
 * Simple pseudo-random walk generator so mock telemetry looks
 * alive across polling cycles instead of static/random noise.
 */
const MockState = {
  t: 0,
  speed: 42.6,
  throttle: 0.32,
  steering: 0.05,
  brake: 0.0,
  attackActive: false,
  attackType: null,
};

function _walk(value, delta, min, max) {
  let v = value + (Math.random() - 0.5) * delta;
  return Math.max(min, Math.min(max, v));
}

function _advanceMockState() {
  MockState.t += 1;
  MockState.speed = _walk(MockState.speed, 4, 0, 95);
  MockState.throttle = _walk(MockState.throttle, 0.05, 0, 1);
  MockState.steering = _walk(MockState.steering, 0.04, -1, 1);
  MockState.brake = Math.random() > 0.92 ? _walk(MockState.brake, 0.3, 0, 1) : MockState.brake * 0.8;
}

function mockGetStatus() {
  _advanceMockState();
  return {
    vehicle_id: "Tesla_Model3",
    connected: true,
    speed_kmh: Number(MockState.speed.toFixed(1)),
    cyber_status: MockState.attackActive ? "ANOMALY DETECTED" : "NORMAL",
    attack_active: MockState.attackActive,
    attack_type: MockState.attackType,
    risk_level: MockState.attackActive ? "HIGH" : "LOW",
  };
}

function mockGetTelemetry() {
  const reqSteer = Number((MockState.steering).toFixed(3));
  const appliedSteer = MockState.attackActive
    ? Number((reqSteer + 0.8).toFixed(3))
    : reqSteer;
  return {
    timestamp: new Date().toISOString(),
    speed_kmh: Number(MockState.speed.toFixed(1)),
    acceleration_ms2: Number(((Math.random() - 0.5) * 4 + 1.5).toFixed(2)),
    requested_throttle: Number(MockState.throttle.toFixed(2)),
    applied_throttle: Number(MockState.throttle.toFixed(2)),
    requested_steering: reqSteer,
    applied_steering: appliedSteer,
    brake: Number(MockState.brake.toFixed(2)),
    manual_mode: true,
  };
}

function mockGetSecurity() {
  const throttleDiff = MockState.attackActive ? 0.42 : Number((Math.random() * 0.05).toFixed(2));
  const steeringDiff = MockState.attackActive ? 0.85 : Number((Math.random() * 0.04).toFixed(2));
  return {
    cyber_status: MockState.attackActive ? "ANOMALY DETECTED" : "NORMAL",
    attack_active: MockState.attackActive,
    attack_type: MockState.attackType,
    risk_level: MockState.attackActive ? "HIGH" : "LOW",
    throttle_difference: throttleDiff,
    steering_difference: steeringDiff,
    anomaly_score: MockState.attackActive ? 0.87 : Number((Math.random() * 0.15).toFixed(2)),
    safety_impact: MockState.attackActive
      ? "Potential unintended lateral vehicle deviation"
      : "No active cyberattack",
  };
}

const MOCK_EXPERIMENTS = [
  {
    experiment_id: "EXP_001",
    experiment_type: "BASELINE",
    samples: 3120,
    duration_s: 120.0,
    average_speed_kmh: 38.2,
    maximum_speed_kmh: 61.4,
    average_acceleration_ms2: 1.12,
    risk_level: "LOW",
    safety_impact: "No active cyberattack",
  },
  {
    experiment_id: "EXP_002",
    experiment_type: "THROTTLE INJECTION",
    samples: 2890,
    duration_s: 88.6,
    average_speed_kmh: 47.5,
    maximum_speed_kmh: 92.1,
    average_acceleration_ms2: 3.87,
    risk_level: "MEDIUM",
    safety_impact: "Unexpected acceleration beyond driver command",
  },
  {
    experiment_id: "EXP_003",
    experiment_type: "STEERING INJECTION",
    samples: 2379,
    duration_s: 93.254,
    average_speed_kmh: 5.943,
    maximum_speed_kmh: 38.130,
    average_acceleration_ms2: 2.503,
    risk_level: "HIGH",
    safety_impact: "Potential unintended lateral vehicle deviation",
  },
  {
    experiment_id: "EXP_004",
    experiment_type: "BRAKE SPOOFING",
    samples: 1985,
    duration_s: 64.2,
    average_speed_kmh: 29.7,
    maximum_speed_kmh: 55.0,
    average_acceleration_ms2: -4.21,
    risk_level: "HIGH",
    safety_impact: "Unintended hard braking at highway speed",
  },
  {
    experiment_id: "EXP_005",
    experiment_type: "GPS SPOOFING",
    samples: 4102,
    duration_s: 140.8,
    average_speed_kmh: 41.0,
    maximum_speed_kmh: 63.9,
    average_acceleration_ms2: 0.98,
    risk_level: "MEDIUM",
    safety_impact: "Route deviation from spoofed positioning data",
  },
  {
    experiment_id: "EXP_006",
    experiment_type: "BASELINE",
    samples: 2650,
    duration_s: 100.0,
    average_speed_kmh: 35.9,
    maximum_speed_kmh: 58.2,
    average_acceleration_ms2: 1.05,
    risk_level: "LOW",
    safety_impact: "No active cyberattack",
  },
];

function mockGetExperimentsLatest() {
  return MOCK_EXPERIMENTS[MOCK_EXPERIMENTS.length - 1];
}

function mockGetExperiments() {
  return MOCK_EXPERIMENTS;
}

function mockGetAnalytics() {
  return {
    normal_vs_attack_speed: { normal: 37.4, attack: 24.1 },
    normal_vs_attack_acceleration: { normal: 1.08, attack: 3.4 },
    attack_duration_avg_s: 96.7,
    max_throttle_difference: 0.42,
    max_steering_difference: 0.85,
    experiments_by_attack_type: {
      BASELINE: 2,
      "THROTTLE INJECTION": 1,
      "STEERING INJECTION": 1,
      "BRAKE SPOOFING": 1,
      "GPS SPOOFING": 1,
    },
    experiment_command_diff: MOCK_EXPERIMENTS.map((e) => ({
      id: e.experiment_id,
      diff: e.risk_level === "HIGH" ? 0.7 + Math.random() * 0.2 : e.risk_level === "MEDIUM" ? 0.3 + Math.random() * 0.2 : Math.random() * 0.1,
    })),
  };
}

/** Rolling telemetry history buffer used to seed charts on load. */
function mockGetTelemetryHistory(points = 60) {
  const history = [];
  let speed = 30, accel = 1, throttle = 0.3, steering = 0.05;
  for (let i = 0; i < points; i++) {
    speed = _walk(speed, 5, 5, 90);
    accel = _walk(accel, 1.2, -3, 5);
    throttle = _walk(throttle, 0.08, 0, 1);
    steering = _walk(steering, 0.06, -1, 1);
    history.push({
      t: i,
      speed_kmh: Number(speed.toFixed(1)),
      acceleration_ms2: Number(accel.toFixed(2)),
      requested_throttle: Number(throttle.toFixed(2)),
      applied_throttle: Number(throttle.toFixed(2)),
      requested_steering: Number(steering.toFixed(3)),
      applied_steering: Number(steering.toFixed(3)),
    });
  }
  return history;
}
