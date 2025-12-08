import { getTimeSinceStartup } from "react-native-startup-time";
import { track } from "~/analytics";
import {
  startupEventsResolvers,
  startupFirstImportTime,
  type StartupEvent,
} from "./logStartupTime";

export type GroupedStartupEvent = StartupEvent & { count: number };

const resolved = new Map<string, GroupedStartupEvent>();
const startupTsp = new Promise<number>(resolve => {
  // On dev it does't make sense to compare to the app starting time due to metro start time
  // And also because react-native-startup-time does not reset on reload (so it keeps on increasing).
  if (__DEV__) return resolve(startupFirstImportTime);
  const now = Date.now();
  getTimeSinceStartup().then(t => resolve(now - t));
});

export async function resolveStartupEvents(sendEvents = false): Promise<GroupedStartupEvent[]> {
  const awaitedTsp = await startupTsp;
  startupEventsResolvers.splice(0).forEach(resolver => {
    const { event, time } = resolver(awaitedTsp);
    const existing = resolved.get(event);
    resolved.set(event, {
      event,
      time: existing?.time ?? time,
      count: 1 + (existing?.count ?? 0),
    });
  });

  const events = Array.from(resolved.values());

  if (sendEvents) {
    track("app_startup_events", { events });
  }

  return events;
}
