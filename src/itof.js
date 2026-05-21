export const LIGHT_SPEED_METERS_PER_SECOND = 300_000_000;
export const LIGHT_SPEED_METERS_PER_NANOSECOND = 0.3;
export const SENSOR_WIDTH = 640;
export const SENSOR_HEIGHT = 480;
export const CUBE_SIZE_METERS = 0.2;
export const CUBE_DISTANCES_METERS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);

export function periodNanoseconds(frequencyMegahertz) {
  assertPositiveFinite(frequencyMegahertz, "frequencyMegahertz");
  return 1_000 / frequencyMegahertz;
}

export function roundTripNanoseconds(distanceMeters) {
  assertNonNegativeFinite(distanceMeters, "distanceMeters");
  return (2 * distanceMeters) / LIGHT_SPEED_METERS_PER_NANOSECOND;
}

export function phaseDegrees(distanceMeters, frequencyMegahertz) {
  const period = periodNanoseconds(frequencyMegahertz);
  const rawPhase = (360 * roundTripNanoseconds(distanceMeters)) / period;

  return normalizePhaseDegrees(rawPhase);
}

export function distanceFromPhaseDegrees(phase, frequencyMegahertz) {
  assertPhase(phase);
  return (phase / 360) * unambiguousRangeMeters(frequencyMegahertz);
}

export function unambiguousRangeMeters(frequencyMegahertz) {
  assertPositiveFinite(frequencyMegahertz, "frequencyMegahertz");
  const frequencyHertz = frequencyMegahertz * 1_000_000;
  return LIGHT_SPEED_METERS_PER_SECOND / (2 * frequencyHertz);
}

export function gateWidthMeters(gatePeriodNanoseconds) {
  assertPositiveFinite(gatePeriodNanoseconds, "gatePeriodNanoseconds");
  return (LIGHT_SPEED_METERS_PER_NANOSECOND * gatePeriodNanoseconds) / 2;
}

export function hybridDistanceMeters({ gateIndex, fineRatio, gateWidthMeters: widthMeters }) {
  assertNonNegativeInteger(gateIndex, "gateIndex");
  assertUnitInterval(fineRatio, "fineRatio");
  assertPositiveFinite(widthMeters, "gateWidthMeters");
  return (gateIndex + fineRatio) * widthMeters;
}

export function tableRows(frequencyMegahertz) {
  return CUBE_DISTANCES_METERS.map((distanceMeters) => {
    const phase = phaseDegrees(distanceMeters, frequencyMegahertz);
    return Object.freeze({
      distanceMeters,
      roundTripNanoseconds: roundTripNanoseconds(distanceMeters),
      phaseDegrees: phase,
      recoveredDistanceMeters: distanceFromPhaseDegrees(phase, frequencyMegahertz)
    });
  });
}

export function htofExample(distanceMeters, gatePeriodNanoseconds) {
  assertNonNegativeFinite(distanceMeters, "distanceMeters");
  const widthMeters = gateWidthMeters(gatePeriodNanoseconds);
  const gateIndex = Math.floor(distanceMeters / widthMeters);
  const fineRatio = (distanceMeters - gateIndex * widthMeters) / widthMeters;

  return Object.freeze({
    gateIndex,
    fineRatio,
    gateWidthMeters: widthMeters,
    distanceMeters: hybridDistanceMeters({
      gateIndex,
      fineRatio,
      gateWidthMeters: widthMeters
    })
  });
}

function normalizePhaseDegrees(phase) {
  return ((phase % 360) + 360) % 360;
}

function assertPhase(value) {
  if (!Number.isFinite(value) || value < 0 || value >= 360) {
    throw new RangeError("phase must be greater than or equal to 0 and less than 360 degrees.");
  }
}

function assertPositiveFinite(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number.`);
  }
}

function assertNonNegativeFinite(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number.`);
  }
}

function assertNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
}

function assertUnitInterval(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1.`);
  }
}
