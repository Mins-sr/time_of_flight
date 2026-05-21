import {
  CUBE_DISTANCES_METERS,
  CUBE_SIZE_METERS,
  LIGHT_SPEED_METERS_PER_NANOSECOND,
  SENSOR_HEIGHT,
  SENSOR_WIDTH,
  distanceFromPhaseDegrees,
  htofExample,
  periodNanoseconds,
  phaseDegrees,
  roundTripNanoseconds,
  tableRows,
  unambiguousRangeMeters
} from "./itof.js";

const state = {
  distanceMeters: 3,
  frequencyMegahertz: 10,
  htofDistanceMeters: 3.25,
  gatePeriodNanoseconds: 6.666666666666667
};

const elements = {
  distance: document.querySelector("#distance"),
  frequency: document.querySelector("#frequency"),
  htofDistance: document.querySelector("#htof-distance"),
  distanceValue: document.querySelector("#distance-value"),
  frequencyValue: document.querySelector("#frequency-value"),
  htofDistanceValue: document.querySelector("#htof-distance-value"),
  periodValue: document.querySelector("#period-value"),
  roundTripValue: document.querySelector("#round-trip-value"),
  phaseValue: document.querySelector("#phase-value"),
  recoveredValue: document.querySelector("#recovered-value"),
  rangeValue: document.querySelector("#range-value"),
  formulaLine: document.querySelector("#formula-line"),
  htofLine: document.querySelector("#htof-line"),
  htofGate: document.querySelector("#htof-gate"),
  htofRatio: document.querySelector("#htof-ratio"),
  tableBody: document.querySelector("#phase-table tbody"),
  waveCanvas: document.querySelector("#wave-canvas"),
  sensorCanvas: document.querySelector("#sensor-canvas"),
  htofCanvas: document.querySelector("#htof-canvas")
};

elements.distance.addEventListener("input", (event) => {
  state.distanceMeters = Number(event.target.value);
  render();
});

elements.frequency.addEventListener("input", (event) => {
  state.frequencyMegahertz = Number(event.target.value);
  render();
});

elements.htofDistance.addEventListener("input", (event) => {
  state.htofDistanceMeters = Number(event.target.value);
  render();
});

render();

function render() {
  renderNumbers();
  renderPhaseTable();
  renderWaveCanvas(elements.waveCanvas);
  renderSensorCanvas(elements.sensorCanvas);
  renderHtofCanvas(elements.htofCanvas);
}

function renderNumbers() {
  const period = periodNanoseconds(state.frequencyMegahertz);
  const roundTrip = roundTripNanoseconds(state.distanceMeters);
  const phase = phaseDegrees(state.distanceMeters, state.frequencyMegahertz);
  const recovered = distanceFromPhaseDegrees(phase, state.frequencyMegahertz);
  const range = unambiguousRangeMeters(state.frequencyMegahertz);
  const htof = htofExample(state.htofDistanceMeters, state.gatePeriodNanoseconds);

  elements.distanceValue.textContent = `${state.distanceMeters.toFixed(2)} m`;
  elements.frequencyValue.textContent = `${state.frequencyMegahertz.toFixed(1)} MHz`;
  elements.htofDistanceValue.textContent = `${state.htofDistanceMeters.toFixed(2)} m`;
  elements.periodValue.textContent = `${period.toFixed(3)} ns`;
  elements.roundTripValue.textContent = `${roundTrip.toFixed(3)} ns`;
  elements.phaseValue.textContent = `${phase.toFixed(1)} deg`;
  elements.recoveredValue.textContent = `${recovered.toFixed(3)} m`;
  elements.rangeValue.textContent = `${range.toFixed(2)} m`;
  elements.formulaLine.textContent = `D = ${phase.toFixed(1)} / 360 x ${range.toFixed(2)} = ${recovered.toFixed(3)} m`;
  elements.htofLine.textContent = `D = (${htof.gateIndex} + ${htof.fineRatio.toFixed(2)}) x ${htof.gateWidthMeters.toFixed(2)} = ${htof.distanceMeters.toFixed(2)} m`;
  elements.htofGate.textContent = `gate ${htof.gateIndex}`;
  elements.htofRatio.textContent = `${htof.fineRatio.toFixed(2)}`;
}

function renderPhaseTable() {
  const rows = tableRows(state.frequencyMegahertz);

  elements.tableBody.replaceChildren(
    ...rows.map((row) => {
      const tr = document.createElement("tr");
      const values = [
        `${row.distanceMeters} m`,
        `${row.roundTripNanoseconds.toFixed(3)} ns`,
        `${row.phaseDegrees.toFixed(1)} deg`,
        `${row.recoveredDistanceMeters.toFixed(3)} m`
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        tr.append(cell);
      }

      return tr;
    })
  );
}

function renderWaveCanvas(canvas) {
  const context = prepareCanvas(canvas);
  const width = canvas.width;
  const height = canvas.height;
  const phase = phaseDegrees(state.distanceMeters, state.frequencyMegahertz);
  const shift = (phase / 360) * width;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height);
  drawWave(context, width, height, 0, "#1f7ae0", "sent");
  drawWave(context, width, height, shift, "#ef4444", "returned");

  context.strokeStyle = "#111827";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(20, height - 42);
  context.lineTo(20 + shift, height - 42);
  context.stroke();
  drawArrowHead(context, 20 + shift, height - 42, 0);

  context.fillStyle = "#111827";
  context.font = "700 14px system-ui, sans-serif";
  context.fillText(`phase shift ${phase.toFixed(1)} deg`, 26, height - 52);
  context.fillText(`one cycle = ${periodNanoseconds(state.frequencyMegahertz).toFixed(1)} ns = 360 deg`, 26, 28);
}

function renderSensorCanvas(canvas) {
  const context = prepareCanvas(canvas);
  const width = canvas.width;
  const height = canvas.height;
  const centerY = height * 0.55;
  const cubeColors = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#db2777"];

  context.fillStyle = "#101827";
  context.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 16) {
    for (let x = 0; x < width; x += 16) {
      context.fillStyle = (x + y) % 32 === 0 ? "#182235" : "#151d2d";
      context.fillRect(x, y, 16, 16);
    }
  }

  context.fillStyle = "#e5e7eb";
  context.font = "700 15px system-ui, sans-serif";
  context.fillText(`${SENSOR_WIDTH} x ${SENSOR_HEIGHT} pixels`, 18, 30);
  context.fillText(`cube size ${Math.round(CUBE_SIZE_METERS * 100)} cm`, 18, 52);

  CUBE_DISTANCES_METERS.forEach((distance, index) => {
    const x = 56 + index * ((width - 112) / (CUBE_DISTANCES_METERS.length - 1));
    const apparentSize = Math.max(9, 76 / distance);
    context.fillStyle = cubeColors[index];
    roundRect(context, x - apparentSize / 2, centerY - apparentSize / 2, apparentSize, apparentSize, 4);
    context.fill();
    context.fillStyle = "#f8fafc";
    context.font = "700 12px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(`${distance}m`, x, centerY + apparentSize / 2 + 18);
  });

  context.textAlign = "left";
}

function renderHtofCanvas(canvas) {
  const context = prepareCanvas(canvas);
  const width = canvas.width;
  const height = canvas.height;
  const htof = htofExample(state.htofDistanceMeters, state.gatePeriodNanoseconds);
  const maxDistance = 8;
  const laneY = height * 0.54;
  const margin = 36;
  const usableWidth = width - margin * 2;
  const xForDistance = (distance) => margin + (distance / maxDistance) * usableWidth;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);

  for (let gate = 0; gate <= maxDistance; gate += 1) {
    const x = xForDistance(gate);
    context.strokeStyle = gate === htof.gateIndex ? "#ef4444" : "#cbd5e1";
    context.lineWidth = gate === htof.gateIndex ? 3 : 1;
    context.beginPath();
    context.moveTo(x, laneY - 58);
    context.lineTo(x, laneY + 58);
    context.stroke();
    context.fillStyle = "#475569";
    context.font = "700 11px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(`${gate}m`, x, laneY + 78);
  }

  context.strokeStyle = "#111827";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(margin, laneY);
  context.lineTo(width - margin, laneY);
  context.stroke();

  const objectX = xForDistance(state.htofDistanceMeters);
  context.fillStyle = "#f97316";
  roundRect(context, objectX - 12, laneY - 36, 24, 72, 5);
  context.fill();

  context.strokeStyle = "#1f7ae0";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(xForDistance(htof.gateIndex), laneY - 48);
  context.lineTo(objectX, laneY - 48);
  context.stroke();

  context.fillStyle = "#111827";
  context.font = "700 14px system-ui, sans-serif";
  context.textAlign = "left";
  context.fillText(`coarse gate = ${htof.gateIndex}`, 18, 28);
  context.fillText(`fine ratio = N3 / (N2 + N3) = ${htof.fineRatio.toFixed(2)}`, 18, 50);
  context.fillText(`${state.htofDistanceMeters.toFixed(2)} m`, objectX + 16, laneY - 14);
  context.textAlign = "left";
}

function prepareCanvas(canvas) {
  const pixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width * pixelRatio);
  const height = Math.round(rect.height * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
  return canvas.getContext("2d");
}

function drawGrid(context, width, height) {
  context.strokeStyle = "#d7dde8";
  context.lineWidth = 1;

  for (let x = 0; x <= width; x += width / 10) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  context.strokeStyle = "#aab4c3";
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();
}

function drawWave(context, width, height, shift, color, label) {
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.beginPath();

  for (let x = 0; x <= width; x += 2) {
    const y = height / 2 + Math.sin(((x - shift) / width) * Math.PI * 2) * 58;
    if (x === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.stroke();
  context.fillStyle = color;
  context.font = "700 13px system-ui, sans-serif";
  context.fillText(label, Math.max(24, shift + 24), label === "sent" ? 58 : 82);
}

function drawArrowHead(context, x, y, angle) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = "#111827";
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-10, -5);
  context.lineTo(-10, 5);
  context.closePath();
  context.fill();
  context.restore();
}

function roundRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

window.addEventListener("resize", render);
