import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStartupLogReader, parseStartupLog, STARTUP_LOG_MARKER } from "./startup-log.ts";
import type { Platform } from "./types.ts";

const PAYLOAD =
  '{"t":1650,"e":[["Before js imports",3,1],["JS start epoch 1762502400412",4,1],["App started",1650,2]]}';
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
    assert.deepEqual(parseStartupLog(`startup-perf ${PAYLOAD}\n`), READ);
  });

  it("reads `log show`'s compact lines and skips its header, which quotes the marker", () => {
    const log = [
      'Filtering the log data using "processID == 4242 AND eventMessage CONTAINS "startup-perf ""',
      "Timestamp               Ty Process[PID:TID]",
      `2026-11-07 08:00:01.234 E  ledgerlivemobile[4242:1a2b] [com.facebook.react.log:javascript] startup-perf ${PAYLOAD}`,
    ].join("\n");
    assert.deepEqual(parseStartupLog(log), READ);
  });

  it("takes the last line when there are several", () => {
    const earlier = PAYLOAD.replace('"t":1650', '"t":999');
    assert.equal(
      parseStartupLog(`startup-perf ${earlier}\nstartup-perf ${PAYLOAD}`)?.appStartupTime,
      1650,
    );
  });

  it("is null without a line", () => {
    assert.equal(parseStartupLog(""), null);
    assert.equal(parseStartupLog("Running main with startup-perf in the name\n"), null);
  });

  it("fails on a line that is not the app's payload", () => {
    assert.throws(() => parseStartupLog('startup-perf {"t":"1650","e":[]}'), /unexpected/);
    assert.throws(() => parseStartupLog('startup-perf {"t":1650,"e":[["App started",1]]}'));
    assert.throws(() => parseStartupLog('startup-perf {"t":1650,"e":[["App st'), SyntaxError);
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

  it("asks the platform for the process's marked lines until the line comes", async () => {
    const { platform, asked } = platformLogging(["", `startup-perf ${PAYLOAD}`]);
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
});
