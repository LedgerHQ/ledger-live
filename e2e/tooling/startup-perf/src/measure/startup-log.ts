// Reads a launch's startup from the device log: as soon as the startup is over, the app writes a
// line per startup event, then the App startup time (writeStartupToDeviceLog.ts, from #24576 on):
//   [startup] App started (x2): 1650 ms
//   [startup] App startup time: 1650 ms, 13 events
import type { StartupEvent } from "../types.ts";
import { sleep } from "./exec.ts";
import type { Platform } from "./types.ts";

export const STARTUP_LOG_MARKER = "[startup] ";
// Both end the line, which `log show`'s "Filtering the log data using ..." header does not match.
const EVENT_LINE = /\[startup\] (.+) \(x(\d+)\): (-?\d+) ms$/;
const LAST_LINE = /\[startup\] App startup time: (-?\d+) ms, (\d+) events$/;
const POLL_MS = 1000;

/** A launch's startup lines: the App startup time, and each event by name. */
export interface StartupRead {
  appStartupTime: number;
  events: Record<string, StartupEvent>;
}

/** The startup of the last complete set of lines in `log`, or null before its last line came. */
export function parseStartupLog(log: string): StartupRead | null {
  let events: StartupRead["events"] = {};
  let read: StartupRead | null = null;
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

/**
 * Waits up to `timeoutMs` for the app to write the lines of the process `pid`: null when it never
 * did. A query still running then may finish, so lines written in time are not lost; the platform
 * bounds a hung one.
 */
export function createStartupLogReader(P: Platform) {
  return async function readStartupLog(
    device: string,
    pid: number,
    timeoutMs: number,
  ): Promise<StartupRead | null> {
    const deadline = Date.now() + timeoutMs;
    // A timer can end a millisecond before Date.now() reaches the deadline: the last wait ends it.
    let lastWait = false;
    for (;;) {
      const read = parseStartupLog(await P.jsLog(device, pid, STARTUP_LOG_MARKER));
      const left = deadline - Date.now();
      if (read || lastWait || left <= 0) return read;
      lastWait = left <= POLL_MS;
      await sleep(Math.min(POLL_MS, left));
    }
  };
}
