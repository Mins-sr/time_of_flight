import {
  CUBE_DISTANCES_METERS,
  CUBE_SIZE_METERS,
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

highlightActiveNavigation();
bindInputs();
render();

window.addEventListener("resize", render);

function bindInputs() {
  elements.distance?.addEventListener("input", (event) => {
    state.distanceMeters = Number(event.target.value);
    render();
  });

  elements.frequency?.addEventListener("input", (event) => {
    state.frequencyMegahertz = Number(event.target.value);
    render();
  });

  elements.htofDistance?.addEventListener("input", (event) => {
    state.htofDistanceMeters = Number(event.target.value);
    render();
  });
}

function render() {
  renderNumbers();
  renderPhaseTable();

  if (elements.waveCanvas !== null) {
    renderWaveCanvas(elements.waveCanvas);
  }

  if (elements.sensorCanvas !== null) {
    renderSensorCanvas(elements.sensorCanvas);
  }

  if (elements.htofCanvas !== null) {
    renderHtofCanvas(elements.htofCanvas);
  }
}

function renderNumbers() {
  const period = periodNanoseconds(state.frequencyMegahertz);
  const roundTrip = roundTripNanoseconds(state.distanceMeters);
  const phase = phaseDegrees(state.distanceMeters, state.frequencyMegahertz);
  const recovered = distanceFromPhaseDegrees(phase, state.frequencyMegahertz);
  const range = unambiguousRangeMeters(state.frequencyMegahertz);
  const htof = htofExample(state.htofDistanceMeters, state.gatePeriodNanoseconds);

  setText(elements.distanceValue, `${state.distanceMeters.toFixed(2)} m`);
  setText(elements.frequencyValue, `${state.frequencyMegahertz.toFixed(1)} MHz`);
  setText(elements.htofDistanceValue, `${state.htofDistanceMeters.toFixed(2)} m`);
  setText(elements.periodValue, `${period.toFixed(3)} ns`);
  setText(elements.roundTripValue, `${roundTrip.toFixed(3)} ns`);
  setText(elements.phaseValue, `${phase.toFixed(1)} deg`);
  setText(elements.recoveredValue, `${recovered.toFixed(3)} m`);
  setText(elements.rangeValue, `${range.toFixed(2)} m`);
  setText(elements.formulaLine, `D = ${phase.toFixed(1)} / 360 x ${range.toFixed(2)} = ${recovered.toFixed(3)} m`);
  setText(
    elements.htofLine,
    `D = (${htof.gateIndex} + ${htof.fineRatio.toFixed(2)}) x ${htof.gateWidthMeters.toFixed(2)} = ${htof.distanceMeters.toFixed(2)} m`
  );
  setText(elements.htofGate, `gate ${htof.gateIndex}`);
  setText(elements.htofRatio, `${htof.fineRatio.toFixed(2)}`);
}

function renderPhaseTable() {
  if (elements.tableBody === null) {
    return;
  }

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
  const { context, width, height } = prepareCanvas(canvas);
  const phase = phaseDegrees(state.distanceMeters, state.frequencyMegahertz);
  const shift = (phase / 360) * width;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height);
  drawWave(context, width, height, 0, "#2563eb", "送信");
  drawWave(context, width, height, shift, "#ef4444", "戻り");

  context.strokeStyle = "#0f172a";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(22, height - 42);
  context.lineTo(22 + shift, height - 42);
  context.stroke();
  drawArrowHead(context, 22 + shift, height - 42, 0);

  context.fillStyle = "#0f172a";
  context.font = "700 14px system-ui, sans-serif";
  context.fillText(`位相差 ${phase.toFixed(1)} deg`, 28, height - 54);
  context.fillText(`1周期 = ${periodNanoseconds(state.frequencyMegahertz).toFixed(1)} ns = 360 deg`, 28, 30);
}

function renderSensorCanvas(canvas) {
  const { context, width, height } = prepareCanvas(canvas);
  const centerY = height * 0.56;
  const cubeColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#2563eb", "#7c3aed", "#db2777"];

  context.fillStyle = "#0f172a";
  context.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 16) {
    for (let x = 0; x < width; x += 16) {
      context.fillStyle = (x + y) % 32 === 0 ? "#172033" : "#121a2b";
      context.fillRect(x, y, 16, 16);
    }
  }

  context.fillStyle = "#e5e7eb";
  context.font = "800 15px system-ui, sans-serif";
  context.fillText(`${SENSOR_WIDTH} x ${SENSOR_HEIGHT} pixels`, 18, 30);
  context.fillText(`積み木 ${Math.round(CUBE_SIZE_METERS * 100)} cm`, 18, 53);

  CUBE_DISTANCES_METERS.forEach((distance, index) => {
    const x = 58 + index * ((width - 116) / (CUBE_DISTANCES_METERS.length - 1));
    const apparentSize = Math.max(10, 80 / distance);
    context.fillStyle = cubeColors[index];
    roundRect(context, x - apparentSize / 2, centerY - apparentSize / 2, apparentSize, apparentSize, 4);
    context.fill();
    context.fillStyle = "#f8fafc";
    context.font = "800 12px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(`${distance}m`, x, centerY + apparentSize / 2 + 18);
  });

  context.textAlign = "left";
}

function renderHtofCanvas(canvas) {
  const { context, width, height } = prepareCanvas(canvas);
  const htof = htofExample(state.htofDistanceMeters, state.gatePeriodNanoseconds);
  const maxDistance = 8;
  const laneY = height * 0.55;
  const margin = 42;
  const usableWidth = width - margin * 2;
  const xForDistance = (distance) => margin + (distance / maxDistance) * usableWidth;

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, width, height);

  for (let gate = 0; gate <= maxDistance; gate += 1) {
    const x = xForDistance(gate);
    context.strokeStyle = gate === htof.gateIndex ? "#ef4444" : "#cbd5e1";
    context.lineWidth = gate === htof.gateIndex ? 3 : 1;
    context.beginPath();
    context.moveTo(x, laneY - 66);
    context.lineTo(x, laneY + 66);
    context.stroke();
    context.fillStyle = "#475569";
    context.font = "800 11px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(`${gate}m`, x, laneY + 86);
  }

  context.strokeStyle = "#0f172a";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(margin, laneY);
  context.lineTo(width - margin, laneY);
  context.stroke();

  const objectX = xForDistance(state.htofDistanceMeters);
  context.fillStyle = "#f97316";
  roundRect(context, objectX - 13, laneY - 40, 26, 80, 5);
  context.fill();

  context.strokeStyle = "#2563eb";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(xForDistance(htof.gateIndex), laneY - 52);
  context.lineTo(objectX, laneY - 52);
  context.stroke();

  context.fillStyle = "#0f172a";
  context.font = "800 14px system-ui, sans-serif";
  context.textAlign = "left";
  context.fillText(`粗いゲート = ${htof.gateIndex}`, 18, 30);
  context.fillText(`細かい割合 = N3 / (N2 + N3) = ${htof.fineRatio.toFixed(2)}`, 18, 54);
  context.fillText(`${state.htofDistanceMeters.toFixed(2)} m`, Math.min(objectX + 16, width - 82), laneY - 15);
}

function prepareCanvas(canvas) {
  const pixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const backingWidth = Math.round(width * pixelRatio);
  const backingHeight = Math.round(height * pixelRatio);

  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  return { context, width, height };
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
    const y = height / 2 + Math.sin(((x - shift) / width) * Math.PI * 2) * Math.min(64, height * 0.2);
    if (x === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.stroke();
  context.fillStyle = color;
  context.font = "800 13px system-ui, sans-serif";
  context.fillText(label, Math.max(24, Math.min(shift + 24, width - 92)), label === "送信" ? 58 : 84);
}

function drawArrowHead(context, x, y, angle) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = "#0f172a";
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

function setText(element, value) {
  if (element !== null) {
    element.textContent = value;
  }
}

function highlightActiveNavigation() {
  const activePage = document.body.dataset.page;
  const navLinks = document.querySelectorAll(".main-nav a");

  for (const link of navLinks) {
    const url = new URL(link.href);
    const path = url.pathname.split("/").at(-1) || "index.html";
    const page = path.replace(".html", "") === "index" ? "overview" : path.replace(".html", "");

    if (page === activePage) {
      link.setAttribute("aria-current", "page");
    }
  }
}
