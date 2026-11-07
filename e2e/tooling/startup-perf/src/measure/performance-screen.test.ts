import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { debugBase } from "../analysis/analyze.ts";
import { hierarchyTexts, parseEvents, parsePerformance } from "./performance-screen.ts";
import type { Sample } from "../types.ts";

describe("hierarchyTexts", () => {
  it("lists the visible strings in screen order, trimmed and without repeats", () => {
    const hierarchy = {
      attributes: { text: "" },
      children: [
        { attributes: { text: "Performance" } },
        { attributes: { text: "App startup time", accessibilityText: "App startup time" } },
        { attributes: { text: " 1234 ms " } },
        { children: [{ attributes: { hintText: "", value: "Before js imports (x1)" } }] },
      ],
    };
    const stdout = `Running on emulator-5554\n${JSON.stringify(hierarchy)}\n`;
    assert.deepEqual(hierarchyTexts(stdout), [
      "Performance",
      "App startup time",
      "1234 ms",
      "Before js imports (x1)",
    ]);
  });
  it("is empty when Maestro prints no hierarchy", () => {
    assert.deepEqual(hierarchyTexts("Error: device offline"), []);
    assert.deepEqual(hierarchyTexts("{ not json }"), []);
  });
});

const PERFORMANCE_SCREEN = [
  "Performance",
  "App startup time",
  "1234 ms",
  "Before js imports (x1)",
  "800 ms",
  "JS start epoch 1700000000800 (x1)",
  "801 ms",
  "App started (x1)",
  "1100 ms",
  "Splash screen faded (x1)",
  "1234 ms",
];

describe("parsePerformance", () => {
  it("reads App startup time and the startup events", () => {
    assert.deepEqual(parsePerformance(PERFORMANCE_SCREEN), {
      appStartupTime: 1234,
      events: {
        "Before js imports": { count: 1, time: 800 },
        "JS start epoch 1700000000800": { count: 1, time: 801 },
        "App started": { count: 1, time: 1100 },
        "Splash screen faded": { count: 1, time: 1234 },
      },
    });
  });
  it("is null before the screen shows a positive App startup time", () => {
    assert.equal(parsePerformance(["Performance"]), null);
    assert.equal(parsePerformance(["App startup time", "0 ms"]), null);
    assert.equal(parsePerformance(["App startup time", "-5 ms"]), null);
  });
  it("gives analyze.ts the events it reads the Debug value's start from", () => {
    const read = parsePerformance(PERFORMANCE_SCREEN);
    assert.ok(read);
    const { appStartupTime, events } = read;
    const launch: Sample = {
      platform: "android",
      scenario: "no-accounts",
      phase: 0,
      round: 0,
      side: "A",
      device: "emulator-5554",
      warmup: false,
      startedAt: "2026-11-06T00:00:00.000Z",
      ok: true,
      appStartupTime,
      events,
      processStartAppClockAt: 1_700_000_000_000,
    };
    assert.equal(debugBase(launch), "process");
  });
});

describe("parseEvents", () => {
  it("reads rows whose name and time are one accessibility text", () => {
    assert.deepEqual(
      parseEvents(["App started (x2), 1100 ms", "Splash screen faded (x1), 1234 ms"]),
      {
        "App started": { count: 2, time: 1100 },
        "Splash screen faded": { count: 1, time: 1234 },
      },
    );
  });
});
