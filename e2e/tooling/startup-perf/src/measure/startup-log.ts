// Reads a launch's startup from the device log: as soon as the startup is over, the app writes a
// line per startup event, then the App startup time (writeStartupToDeviceLog.ts, from #24576 on):
//   [startup] App started (x2): 1650 ms
//   [startup] App startup time: 1650 ms, 13 events
import { sleep } from "./exec.ts";
import type { PerformanceRead } from "./performance-screen.ts";
import type { Platform } from "./types.ts";

export const STARTUP_LOG_MARKER = "[startup] ";
// Both end the line, which `log show`'s "Filtering the log data using ..." header does not match.
const EVENT_LINE = /\[startup\] (.+) \(x(\d+)\): (-?\d+) ms$/;
const LAST_LINE = /\[startup\] App startup time: (-?\d+) ms, (\d+) events$/;
const POLL_MS = 1000;

/** The startup of the last complete set of lines in `log`, or null before its last line came. */
export function parseStartupLog(log: string): PerformanceRead | null {
  let events: PerformanceRead["events"] = {};
  let read: PerformanceRead | null = null;
  for (const line of log.split(/\r?\n/).map(l => l.trimEnd())) {
    const last = LAST_LINE.exec(line);
    if (last) {
      const lines = Object.keys(events).length;
      if (lines !== Number(last[2])) {
        throw new Error(`${lines} startup event lines before "${line}"`);
      }
      read = { appStartupTime: Number(last[1]), events };
      events = {};
      continue;
    }
    const event = EVENT_LINE.exec(line);
    if (event) events[event[1]] = { count: Number(event[2]), time: Number(event[3]) };
  }
  return read;
}

/** Waits up to `timeoutMs` for the lines of the process `pid`: null when they never came. */
export function createStartupLogReader(P: Platform) {
  return async function readStartupLog(
    device: string,
    pid: number,
    timeoutMs: number,
  ): Promise<PerformanceRead | null> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const read = parseStartupLog(await P.jsLog(device, pid, STARTUP_LOG_MARKER));
      if (read || Date.now() >= deadline) return read;
      await sleep(POLL_MS);
    }
  };
}
