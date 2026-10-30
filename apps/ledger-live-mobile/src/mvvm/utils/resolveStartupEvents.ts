import AppStartupModule from "~/native-modules/AppStartupModule";
import { startupEvents, startupFirstImportTime, type StartupEvent } from "./logStartupTime";

export type GroupedStartupEvent = StartupEvent & { count: number };

export type StartupTimeBase = "process" | "js";

type StartupOrigin = { base: StartupTimeBase; time: number };

// WARNING: Not an exhaustive list, just the looked up ones.
export const STARTUP_EVENTS = {
  STORE_STORAGE_READ: "Store Storage read",
  CURRENCY_HYDRATED: "Currency hydrated",
  APP_STARTED: "App started",
  NAV_READY: "Splash screen faded",
} as const;

const NOT_LOGGED_EVENTS = new Set<string>([
  STARTUP_EVENTS.STORE_STORAGE_READ,
  STARTUP_EVENTS.CURRENCY_HYDRATED,
]);

const MAX_PROCESS_START_TO_JS_START_MS = 60_000;

let startupOrigin: StartupOrigin | undefined;

function readProcessStartTime(): number | null {
  try {
    const processStartTime = AppStartupModule?.getProcessStartTime() ?? null;
    if (processStartTime === null) return null;

    const processStartToJsStart = startupFirstImportTime - processStartTime;
    const isPlausibleLaunch =
      processStartToJsStart >= 0 && processStartToJsStart <= MAX_PROCESS_START_TO_JS_START_MS;
    return isPlausibleLaunch ? processStartTime : null;
  } catch (error) {
    console.warn("Could not read the app process start time", error);
    return null;
  }
}

function computeStartupOrigin(): StartupOrigin {
  // On dev the metro start time makes the process start meaningless
  const processStartTime = __DEV__ ? null : readProcessStartTime();
  return processStartTime === null
    ? { base: "js", time: startupFirstImportTime }
    : { base: "process", time: processStartTime };
}

function resolveStartupOrigin(): StartupOrigin {
  startupOrigin ??= computeStartupOrigin();
  return startupOrigin;
}

export function clearStartupOriginCache(): void {
  startupOrigin = undefined;
}

export function getStartupTimeBase(): StartupTimeBase {
  return resolveStartupOrigin().base;
}

export function resolveStartupEvents(): GroupedStartupEvent[] {
  const origin = resolveStartupOrigin().time;
  const resolved = new Map<string, GroupedStartupEvent>();
  startupEvents
    .filter(e => !NOT_LOGGED_EVENTS.has(e.event))
    .forEach(({ event, time }) => {
      const existing = resolved.get(event);
      resolved.set(
        event,
        existing
          ? { event, time: existing.time, count: existing.count + 1 }
          : { event, time: time - origin, count: 1 },
      );
    });

  return Array.from(resolved.values());
}
