import { startupEvents, startupFirstImportTime, type StartupEvent } from "./logStartupTime";

export type GroupedStartupEvent = StartupEvent & { count: number };

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

// Times are relative to the first JS import. Datadog RUM measures the native part of the startup.
export async function resolveStartupEvents(): Promise<GroupedStartupEvent[]> {
  const resolved = new Map<string, GroupedStartupEvent>();
  startupEvents
    .filter(e => !NOT_LOGGED_EVENTS.has(e.event))
    .forEach(({ event, time }) => {
      const existing = resolved.get(event);
      resolved.set(
        event,
        existing
          ? { event, time: existing.time, count: existing.count + 1 }
          : { event, time: time - startupFirstImportTime, count: 1 },
      );
    });

  return Array.from(resolved.values());
}
