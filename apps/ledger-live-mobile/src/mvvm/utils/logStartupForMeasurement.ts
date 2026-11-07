import { LaunchArguments } from "react-native-launch-arguments";
import { resolveStartupEvents } from "./resolveStartupEvents";

/** The launch argument with which e2e/tooling/startup-perf asks for the log line. */
export const STARTUP_PERF_LOG_ARGUMENT = "startupPerfLog";

// The only level iOS release builds write to the device log; console.error would reach Datadog.
const NATIVE_ERROR_LEVEL = 3;

type NativeLoggingHook = (message: string, level: number) => void;

/**
 * Writes the startup to the device log as soon as it is over, as
 * `startup-perf {"t": app startup time, "e": [[event, time, count], ...]}`, when the app was
 * launched with the startupPerfLog argument: the startup measurement reads it there instead of
 * opening the Debug screen.
 */
export function logStartupForMeasurement(lastEvent: string): void {
  if (!LaunchArguments?.value?.()?.[STARTUP_PERF_LOG_ARGUMENT]) return;
  const events = resolveStartupEvents();
  const appStartupTime = events.find(e => e.event === lastEvent)?.time ?? 0;
  const payload = { t: appStartupTime, e: events.map(e => [e.event, e.time, e.count]) };
  const { nativeLoggingHook } = globalThis as { nativeLoggingHook?: NativeLoggingHook };
  nativeLoggingHook?.(`startup-perf ${JSON.stringify(payload)}`, NATIVE_ERROR_LEVEL);
}
