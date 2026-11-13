import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { debugBase } from "../analysis/analyze.ts";
import {
  createPerformanceReader,
  hierarchyTexts,
  parseEvents,
  parsePerformance,
} from "./performance-screen.ts";
import type { Maestro, Platform } from "./types.ts";
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

describe("createPerformanceReader", () => {
  const VISIBLE_ROWS = 6;
  const unused = async (): Promise<never> => {
    throw new Error("not used by the reader");
  };

  /**
   * A Performance screen with `events` in order, 6 rows on screen. The read flow opens it at the
   * top, scrollToEnd stops at `endStop`, and each scrollDown moves by the next of `scrollSteps`.
   */
  function fakeScreen({
    events,
    endStop,
    scrollSteps,
  }: {
    events: string[];
    endStop: number;
    scrollSteps: number[];
  }) {
    let top = 0;
    const lastTop = Math.max(0, events.length - VISIBLE_ROWS);
    const steps = [...scrollSteps];
    let scrolls = 0;
    const visibleTexts = () => [
      ...(top === 0 ? ["Performance", "App startup time", "1234 ms"] : []),
      ...events
        .slice(top, top + VISIBLE_ROWS)
        .flatMap((name, i) => [`${name} (x1)`, `${(top + i) * 100} ms`]),
    ];
    const maestro: Maestro = {
      calls: [],
      async invoke({ command }) {
        if (command === "test") top = 0;
        const hierarchy = { children: visibleTexts().map(text => ({ attributes: { text } })) };
        return {
          failed: false,
          stdout: command === "hierarchy" ? JSON.stringify(hierarchy) : "",
          stderr: "",
        };
      },
    };
    const platform: Platform = {
      install: unused,
      stop: unused,
      stopDriver: async () => {},
      launch: unused,
      ensureScreenOn: unused,
      blockingDialog: async () => null,
      clearDialogs: unused,
      pause: unused,
      resume: unused,
      processStart: unused,
      pid: unused,
      jsLog: unused,
      scrollDown: async () => {
        scrolls++;
        top = Math.min(lastTop, top + (steps.shift() ?? VISIBLE_ROWS / 2));
      },
      scrollToEnd: async () => {
        top = Math.min(lastTop, endStop);
      },
      diagnostics: unused,
      load: unused,
    };
    const read = createPerformanceReader({ platform, maestro });
    return {
      read: () => read("emulator-5554", { quick: true, debugFile: "unused.txt" }),
      scrolls: () => scrolls,
    };
  }

  const EVENTS = [
    "Before js imports",
    ...Array.from({ length: 12 }, (_, i) => `Step ${i + 1}`),
    "App started",
    "Splash screen faded",
  ];

  it("reads the final events past a scroll that did not move", async () => {
    const screen = fakeScreen({ events: EVENTS, endStop: 4, scrollSteps: [0, 4, 4] });
    const { appStartupTime, events } = await screen.read();
    assert.equal(appStartupTime, 1234);
    assert.ok("Before js imports" in events && "Splash screen faded" in events);
  });

  it("rejects a launch whose final events never show, after two scrolls with nothing new", async () => {
    const screen = fakeScreen({ events: EVENTS.slice(0, -1), endStop: 99, scrollSteps: [] });
    await assert.rejects(screen.read(), /Splash screen faded not logged when the screen opened/);
    assert.equal(screen.scrolls(), 2);
  });
});
