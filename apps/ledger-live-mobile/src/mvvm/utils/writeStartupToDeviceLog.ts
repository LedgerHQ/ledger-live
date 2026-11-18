import { resolveStartupEvents } from "./resolveStartupEvents";

/** Starts the startup's lines in the device log, which e2e/tooling/startup-perf reads. */
export const STARTUP_LOG_PREFIX = "[startup]";

// The only level iOS release builds write to the device log; console.error would reach Datadog.
const NATIVE_ERROR_LEVEL = 3;

type NativeLoggingHook = (message: string, level: number) => void;

/**
 * Writes the startup to the device log as soon as it is over, as Settings > Debug > Performance
 * shows it: a line per event, then the App startup time.
 *
 *     [startup] App started (x2): 1650 ms
 *     [startup] App startup time: 1650 ms, 13 events
 */
export function writeStartupToDeviceLog(lastEvent: string): void {
  const { nativeLoggingHook } = globalThis as { nativeLoggingHook?: NativeLoggingHook };
  if (!nativeLoggingHook) return;
  const events = resolveStartupEvents();
  const appStartupTime = events.find(e => e.event === lastEvent)?.time ?? 0;
  const lines = [
    ...events.map(({ event, time, count }) => `${event} (x${count}): ${time} ms`),
    `App startup time: ${appStartupTime} ms, ${events.length} events`,
  ];
  for (const line of lines) nativeLoggingHook(`${STARTUP_LOG_PREFIX} ${line}`, NATIVE_ERROR_LEVEL);
}
