import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { PLATFORMS, isoWeek, loadRotation, resolveDevices } from "./resolve.mjs";

const DEVICES = new Set(["nanoS", "nanoSP", "nanoX", "stax", "flex", "nanoGen5"]);
// No Bluetooth, so they can't pair with an iPhone.
const NOT_ON_IOS = new Set(["nanoS", "nanoSP"]);

const utc = isoDate => new Date(`${isoDate}T00:00:00Z`);

// Monday to Friday of the ISO week starting on `monday`.
const workWeek = monday =>
  Array.from({ length: 5 }, (_, i) => new Date(utc(monday).getTime() + i * 86_400_000));

describe("isoWeek", () => {
  for (const [isoDate, week] of [
    ["2026-01-01", 1],
    ["2026-02-18", 8],
    ["2026-10-21", 43],
    ["2026-12-31", 53],
    ["2027-01-03", 53],
    ["2027-01-04", 1],
    ["2024-12-30", 1],
    ["2021-01-03", 53],
  ]) {
    test(`${isoDate} is week ${week}`, () => {
      assert.equal(isoWeek(utc(isoDate)), week);
    });
  }
});

describe("resolveDevices", () => {
  const rotation = {
    weekdays: {
      wednesday: {
        desktop: { evenWeek: "flex", oddWeek: "nanoGen5" },
        ios: "nanoX",
        android: { evenWeek: "nanoGen5", oddWeek: "flex" },
      },
    },
    fallback: { desktop: "nanoSP", ios: "stax", android: "nanoX" },
  };

  test("picks the week-parity device", () => {
    assert.deepEqual(resolveDevices(utc("2026-10-28"), rotation), {
      desktop: "flex",
      ios: "nanoX",
      android: "nanoGen5",
    });
    assert.deepEqual(resolveDevices(utc("2026-10-21"), rotation), {
      desktop: "nanoGen5",
      ios: "nanoX",
      android: "flex",
    });
  });

  test("uses the fallback on a day without an entry", () => {
    assert.deepEqual(resolveDevices(utc("2026-10-24"), rotation), rotation.fallback);
  });
});

describe("rotation.json", () => {
  const rotation = loadRotation();

  test("defines every weekday", () => {
    assert.deepEqual(Object.keys(rotation.weekdays), [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
  });

  // Weeks 43 (odd) and 44 (even) of 2026.
  for (const monday of ["2026-10-19", "2026-10-26"]) {
    describe(`week of ${monday}`, () => {
      const days = workWeek(monday).map(date => [date, resolveDevices(date, rotation)]);

      for (const [date, devices] of days) {
        const label = date.toISOString().slice(0, 10);

        test(`${label}: every platform gets a known device`, () => {
          for (const platform of PLATFORMS) {
            assert.ok(DEVICES.has(devices[platform]), `${platform}: ${devices[platform]}`);
          }
        });

        test(`${label}: the three platforms use different devices`, () => {
          assert.equal(new Set(Object.values(devices)).size, PLATFORMS.length);
        });

        test(`${label}: iOS gets a Bluetooth device`, () => {
          assert.ok(!NOT_ON_IOS.has(devices.ios), devices.ios);
        });
      }

      test("all six devices run during the week", () => {
        const used = new Set(days.flatMap(([, devices]) => Object.values(devices)));
        assert.deepEqual([...used].sort(), [...DEVICES].sort());
      });
    });
  }
});
