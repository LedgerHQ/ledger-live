import { getTimeSinceStartup } from "react-native-startup-time";
import { startupEvents, startupFirstImportTime, type StartupEvent } from "./logStartupTime";

export type GroupedStartupEvent = StartupEvent & { count: number };

export const STARTUP_EVENTS = {
  LEGACY_STARTED: "App started",
  STARTED: "Splash screen faded",
} as const;

const startupTsp = new Promise<number>(resolve => {
  // On dev it does't make sense to compare to the app starting time due to metro start time
  // And also because react-native-startup-time does not reset on reload (so it keeps on increasing).
  if (__DEV__) return resolve(startupFirstImportTime);
  const now = Date.now();
  getTimeSinceStartup().then(t => resolve(now - t));
});

export async function resolveStartupEvents() {
  const awaitedTsp = await startupTsp;
  const resolved = new Map<string, GroupedStartupEvent>();
  startupEvents.forEach(({ event, time }) => {
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
