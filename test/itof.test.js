import assert from "node:assert/strict";
import test from "node:test";

import {
  CUBE_DISTANCES_METERS,
  LIGHT_SPEED_METERS_PER_SECOND,
  distanceFromPhaseDegrees,
  gateWidthMeters,
  hybridDistanceMeters,
  phaseDegrees,
  periodNanoseconds,
  roundTripNanoseconds,
  tableRows
} from "../src/itof.js";

test("the learning world uses the requested physical constants", () => {
  assert.equal(LIGHT_SPEED_METERS_PER_SECOND, 300_000_000);
  assert.deepEqual(CUBE_DISTANCES_METERS, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("10 MHz modulation has a 100 ns period", () => {
  assert.equal(periodNanoseconds(10), 100);
});

test("1 m maps to 6.667 ns round trip and 24 degrees at 10 MHz", () => {
  assert.equal(roundTripNanoseconds(1), 6.666666666666667);
  assert.equal(phaseDegrees(1, 10), 24);
  assert.equal(distanceFromPhaseDegrees(24, 10), 1);
});

test("the 1 m through 8 m examples form the expected phase table", () => {
  assert.deepEqual(
    tableRows(10).map((row) => ({
      distanceMeters: row.distanceMeters,
      roundTripNanoseconds: Number(row.roundTripNanoseconds.toFixed(3)),
      phaseDegrees: Number(row.phaseDegrees.toFixed(0))
    })),
    [
      { distanceMeters: 1, roundTripNanoseconds: 6.667, phaseDegrees: 24 },
      { distanceMeters: 2, roundTripNanoseconds: 13.333, phaseDegrees: 48 },
      { distanceMeters: 3, roundTripNanoseconds: 20, phaseDegrees: 72 },
      { distanceMeters: 4, roundTripNanoseconds: 26.667, phaseDegrees: 96 },
      { distanceMeters: 5, roundTripNanoseconds: 33.333, phaseDegrees: 120 },
      { distanceMeters: 6, roundTripNanoseconds: 40, phaseDegrees: 144 },
      { distanceMeters: 7, roundTripNanoseconds: 46.667, phaseDegrees: 168 },
      { distanceMeters: 8, roundTripNanoseconds: 53.333, phaseDegrees: 192 }
    ]
  );
});

test("hTOF gate math supports the 3.25 m worked example", () => {
  const widthMeters = gateWidthMeters(6.666666666666667);

  assert.ok(Math.abs(widthMeters - 1) < 1e-12);
  assert.equal(hybridDistanceMeters({ gateIndex: 3, fineRatio: 0.25, gateWidthMeters: widthMeters }), 3.25);
});

test("invalid physical inputs are rejected", () => {
  assert.throws(() => periodNanoseconds(0), RangeError);
  assert.throws(() => roundTripNanoseconds(-1), RangeError);
  assert.throws(() => distanceFromPhaseDegrees(361, 10), RangeError);
  assert.throws(() => hybridDistanceMeters({ gateIndex: -1, fineRatio: 0.25, gateWidthMeters: 1 }), RangeError);
  assert.throws(() => hybridDistanceMeters({ gateIndex: 1, fineRatio: 1.2, gateWidthMeters: 1 }), RangeError);
});
