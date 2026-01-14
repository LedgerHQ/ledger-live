import { getTimeSinceStartup } from "react-native-startup-time";
import { startupEvents, startupFirstImportTime, type StartupEvent } from "./logStartupTime";

export type GroupedStartupEvent = StartupEvent & { count: number };

// WARNING: Not an exhaustive list, just the looked up ones.
export const STARTUP_EVENTS = {
  STORE_STORAGE_READ: "Store Storage read",
  CURRENCY_HYDRATED: "Currency hydrated",
  APP_STARTED: "App started",
  NAV_READY: "Splash screen faded",
} as const;

const NOT_LOGGED_EVENTS: string[] = [STARTUP_EVENTS.STORE_STORAGE_READ];

const startupTsp = new Promise<number>(resolve => {
  // On dev it doesn't make sense to compare to the app starting time due to metro start time
  // And also because react-native-startup-time does not reset on reload (so it keeps on increasing).
  if (__DEV__) return resolve(startupFirstImportTime);
  const now = Date.now();
  getTimeSinceStartup().then(t => resolve(now - t));
});

export async function resolveStartupEvents(): Promise<GroupedStartupEvent[]> {
  const awaitedTsp = await startupTsp;
  const resolved = new Map<string, GroupedStartupEvent>();
  startupEvents
    .filter(e => !NOT_LOGGED_EVENTS.includes(e.event))
    .forEach(({ event, time }) => {
      const existing = resolved.get(event);
      resolved.set(
        event,
        existing
          ? { event, time: existing.time, count: existing.count + 1 }
          : { event, time: time - awaitedTsp, count: 1 },
      );
    });

  return Array.from(resolved.values());
}
