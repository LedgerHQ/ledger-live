import assert from "node:assert/strict";
import { test } from "node:test";

import { PLATFORMS, isoWeek, resolveDevices } from "./resolve.mjs";

const DEVICES = ["flex", "nanoGen5", "nanoS", "nanoSP", "nanoX", "stax"];
// No Bluetooth, so they can't pair with an iPhone.
const NOT_ON_IOS = ["nanoS", "nanoSP"];

const utc = isoDate => new Date(`${isoDate}T00:00:00Z`);
const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000);

test("isoWeek matches date +%V across year boundaries", () => {
  for (const [isoDate, week] of [
    ["2024-12-30", 1],
    ["2026-10-21", 43],
    ["2026-12-31", 53],
    ["2027-01-04", 1],
  ]) {
    assert.equal(isoWeek(utc(isoDate)), week, isoDate);
  }
});

test("a { evenWeek, oddWeek } entry follows the ISO week parity", () => {
  const rotation = {
    wednesday: {
      desktop: { evenWeek: "flex", oddWeek: "nanoGen5" },
      ios: "nanoX",
      android: "stax",
    },
  };
  assert.equal(resolveDevices(utc("2026-10-28"), rotation).desktop, "flex");
  assert.equal(resolveDevices(utc("2026-10-21"), rotation).desktop, "nanoGen5");
});

test("a day without a rotation entry fails", () => {
  assert.throws(() => resolveDevices(utc("2026-10-24")), /No nightly rotation for saturday/);
});

// Monday of an odd (43) and an even (44) ISO week.
for (const monday of ["2026-10-19", "2026-10-26"]) {
  test(`rotation rules hold for the week of ${monday}`, () => {
    const used = new Set();
    for (let i = 0; i < 5; i++) {
      const devices = resolveDevices(addDays(utc(monday), i));
      const values = PLATFORMS.map(platform => devices[platform]);
      assert.equal(new Set(values).size, PLATFORMS.length, `day ${i}: ${values} must differ`);
      assert.ok(!NOT_ON_IOS.includes(devices.ios), `day ${i}: ${devices.ios} on iOS`);
      values.forEach(device => used.add(device));
    }
    assert.deepEqual([...used].sort(), DEVICES);
  });
}
