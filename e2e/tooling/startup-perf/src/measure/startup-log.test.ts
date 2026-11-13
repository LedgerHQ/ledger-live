import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStartupLogReader, parseStartupLog, STARTUP_LOG_MARKER } from "./startup-log.ts";
import type { Platform } from "./types.ts";

const LINES = [
  "[startup] Before js imports (x1): 3 ms",
  "[startup] JS start epoch 1762502400412 (x1): 4 ms",
  "[startup] App started (x2): 1650 ms",
  "[startup] App startup time: 1650 ms, 3 events",
];
const READ = {
  appStartupTime: 1650,
  events: {
    "Before js imports": { count: 1, time: 3 },
    "JS start epoch 1762502400412": { count: 1, time: 4 },
    "App started": { count: 2, time: 1650 },
  },
};

describe("parseStartupLog", () => {
  it("reads logcat's raw ReactNativeJS lines", () => {
    assert.deepEqual(parseStartupLog(LINES.join("\n")), READ);
    assert.deepEqual(parseStartupLog(LINES.join("\r\n") + "\r\n"), READ);
  });

  it("reads `log show`'s compact lines and skips its header, which quotes the marker", () => {
    const log = [
      'Filtering the log data using "processID == 4242 AND eventMessage CONTAINS "[startup] ""',
      "Timestamp               Ty Process[PID:TID]",
      ...LINES.map(
        line =>
          `2026-11-07 08:00:01.234 E  ledgerlivemobile[4242:1a2b] [com.facebook.react.log:javascript] ${line}`,
      ),
    ].join("\n");
    assert.deepEqual(parseStartupLog(log), READ);
  });

  it("waits for the App startup time line, written last", () => {
    assert.equal(parseStartupLog(LINES.slice(0, -1).join("\n")), null);
    assert.equal(parseStartupLog(""), null);
    assert.equal(parseStartupLog("Running main with [startup] in the name\n"), null);
  });

  it("takes the last set of lines when there are several", () => {
    const earlier = LINES.map(line => line.replaceAll("1650", "999"));
    assert.equal(parseStartupLog([...earlier, ...LINES].join("\n"))?.appStartupTime, 1650);
  });

  it("fails when an event line is missing", () => {
    assert.throws(
      () => parseStartupLog([LINES[0], LINES[2], LINES[3]].join("\n")),
      /2 startup event lines before/,
    );
  });
});

describe("readStartupLog", () => {
  const platformLogging = (logs: string[]) => {
    const asked: Array<[string, number, string]> = [];
    const platform = {
      async jsLog(device: string, pid: number, text: string) {
        asked.push([device, pid, text]);
        return logs.shift() ?? "";
      },
    } as unknown as Platform;
    return { platform, asked };
  };

  it("asks the platform for the process's marked lines until the last one comes", async () => {
    const { platform, asked } = platformLogging([LINES[0], LINES.join("\n")]);
    const read = await createStartupLogReader(platform)("emulator-5554", 4242, 5000);
    assert.deepEqual(read, READ);
    assert.deepEqual(asked, [
      ["emulator-5554", 4242, STARTUP_LOG_MARKER],
      ["emulator-5554", 4242, STARTUP_LOG_MARKER],
    ]);
  });

  it("gives up with null once the time is over", async () => {
    const { platform, asked } = platformLogging([]);
    assert.equal(await createStartupLogReader(platform)("emulator-5554", 4242, 0), null);
    assert.equal(asked.length, 1);
  });

  it("waits no longer than the time left, then reads once more", async () => {
    const { platform, asked } = platformLogging([]);
    const startedAt = Date.now();
    assert.equal(await createStartupLogReader(platform)("emulator-5554", 4242, 200), null);
    assert.ok(Date.now() - startedAt < 800, "slept a whole poll past the time left");
    assert.equal(asked.length, 2);
  });

  it("keeps the lines of a query that ends after the time is over", async () => {
    const slowPlatform = {
      async jsLog() {
        await new Promise(resolve => setTimeout(resolve, 100));
        return LINES.join("\n");
      },
    } as unknown as Platform;
    assert.deepEqual(await createStartupLogReader(slowPlatform)("emulator-5554", 4242, 10), READ);
  });
});
