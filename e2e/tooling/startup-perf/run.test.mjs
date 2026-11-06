import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { debugBase } from "./analyze.mjs";
import {
  hierarchyTexts,
  parseBlockingDialog,
  parseEvents,
  parsePerformance,
  parseProcessStart,
  parseScreenState,
  parseStatPid,
} from "./run.mjs";

const FIELDS_BEFORE_START_TIME = "S 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18";
const PROCESS_START_OUTPUT = [
  "epoch 1700000000.123456",
  "1000.50 3000.00",
  `4321 (com.ledger.live) ${FIELDS_BEFORE_START_TIME} 99000 0 0`,
  "",
].join("\n");
const NO_PROCESS_OUTPUT = "1000.50 3000.00\ncat: /proc//stat: No such file or directory\n";

describe("parseProcessStart", () => {
  it("subtracts the process age from the time of the read", () => {
    assert.equal(parseProcessStart(PROCESS_START_OUTPUT, 2_000_000), 2_000_000 - 10_500);
  });
  it("reads past a process name that holds a parenthesis", () => {
    const output = PROCESS_START_OUTPUT.replace("(com.ledger.live)", "(a) b)");
    assert.equal(parseProcessStart(output, 2_000_000), 2_000_000 - 10_500);
  });
  it("is null when the app has no process", () => {
    assert.equal(parseProcessStart(NO_PROCESS_OUTPUT, 2_000_000), null);
  });
});

describe("parseStatPid", () => {
  it("reads the pid of the stat line", () => {
    assert.equal(parseStatPid(PROCESS_START_OUTPUT), 4321);
  });
  it("is null when the app has no process", () => {
    assert.equal(parseStatPid(NO_PROCESS_OUTPUT), null);
  });
});

describe("parseScreenState", () => {
  it("reads an awake screen with the app in focus", () => {
    const dumpsys =
      "  mWakefulness=Awake\n  mCurrentFocus=Window{8d1c2f u0 com.ledger.live/com.ledger.live.MainActivity}\n";
    assert.deepEqual(parseScreenState(dumpsys), {
      wakefulness: "Awake",
      focus: "com.ledger.live/com.ledger.live.MainActivity",
      keyguard: false,
    });
  });
  it("sees the keyguard through the notification shade", () => {
    const dumpsys = "  mWakefulness=Awake\n  mCurrentFocus=Window{51a u0 NotificationShade}\n";
    assert.equal(parseScreenState(dumpsys).keyguard, true);
  });
  it("reads a screen that is off and has no focused window", () => {
    assert.deepEqual(parseScreenState("  mWakefulness=Asleep\n"), {
      wakefulness: "Asleep",
      focus: null,
      keyguard: false,
    });
  });
});

describe("parseBlockingDialog", () => {
  it("names the package of an ANR dialog", () => {
    const dumpsys =
      "  mCurrentFocus=Window{3e1 u0 Application Not Responding: com.android.systemui}\n";
    assert.equal(parseBlockingDialog(dumpsys), "com.android.systemui");
  });
  it("names the package of a crash dialog", () => {
    const dumpsys = "  mCurrentFocus=Window{3e1 u0 Application Error: com.google.android.gms}\n";
    assert.equal(parseBlockingDialog(dumpsys), "com.google.android.gms");
  });
  it("is null when the app has the focus", () => {
    const dumpsys = "  mCurrentFocus=Window{8d1 u0 com.ledger.live/com.ledger.live.MainActivity}\n";
    assert.equal(parseBlockingDialog(dumpsys), null);
  });
});

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
  it("gives analyze.mjs the events it reads the Debug value's start from", () => {
    const { appStartupTime, events } = parsePerformance(PERFORMANCE_SCREEN);
    const launch = { platform: "android", appStartupTime, events };
    assert.equal(debugBase({ ...launch, processStartAppClockAt: 1_700_000_000_000 }), "process");
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
