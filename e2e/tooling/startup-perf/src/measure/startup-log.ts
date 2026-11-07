// Reads a launch's startup from the device log: launched with startupPerfLog, the app writes
// `startup-perf {"t": app startup time, "e": [[event, time, count], ...]}` as soon as the startup is
// over (logStartupForMeasurement.ts, or the line ci/prepare-build.mts adds to the refs before it).
import { sleep } from "./exec.ts";
import type { PerformanceRead } from "./performance-screen.ts";
import type { Platform } from "./types.ts";

/** The launch argument the app waits for before it writes the line. */
export const STARTUP_LOG_LAUNCH_ARGS = { startupPerfLog: 1 };
export const STARTUP_LOG_MARKER = "startup-perf ";
// The payload ends the line. In `log show`'s "Filtering the log data using ..." header, a quote
// follows the marker.
const STARTUP_LOG_LINE = /startup-perf (\{.*?)\s*$/;
const POLL_MS = 1000;

type Payload = { t: number; e: Array<[string, number, number]> };

const isEventRow = (row: unknown): row is [string, number, number] =>
  Array.isArray(row) &&
  row.length === 3 &&
  typeof row[0] === "string" &&
  Number.isFinite(row[1]) &&
  Number.isInteger(row[2]);

const isPayload = (value: unknown): value is Payload =>
  typeof value === "object" &&
  value !== null &&
  "t" in value &&
  "e" in value &&
  Number.isFinite(value.t) &&
  Array.isArray(value.e) &&
  value.e.every(isEventRow);

/** The startup in the last startup-perf line of `log`, or null when there is none. */
export function parseStartupLog(log: string): PerformanceRead | null {
  const payloads = log.split("\n").flatMap(line => STARTUP_LOG_LINE.exec(line)?.[1] ?? []);
  const payload = payloads.at(-1);
  if (payload === undefined) return null;
  const parsed: unknown = JSON.parse(payload);
  if (!isPayload(parsed)) {
    throw new Error(`unexpected startup-perf payload: ${payload.slice(0, 300)}`);
  }
  return {
    appStartupTime: parsed.t,
    events: Object.fromEntries(parsed.e.map(([event, time, count]) => [event, { count, time }])),
  };
}

/** Waits up to `timeoutMs` for the line of the process `pid`: null when it never came. */
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
