import { DdRumReactNavigationTracking } from "@datadog/mobile-react-navigation";
import { track } from "~/analytics";
import { navigationRef } from "~/rootnavigation";
import { viewNamePredicate } from "~/datadog";
import { logStartupEvent, type StartupEvent, startupEvents } from "./logStartupTime";
import { resolveStartupEvents } from "./resolveStartupEvents";

type LastStartupEvent = (typeof LAST_STARTUP_EVENTS)[keyof typeof LAST_STARTUP_EVENTS];

export const LAST_STARTUP_EVENTS = {
  APP_STARTED: "App started",
  NAV_READY: "Splash screen faded",
} as const;
export const LAST_STARTUP_EVENT_VALUES: string[] = Object.values(LAST_STARTUP_EVENTS);

/**
 * Logs a startup-related event and conditionally then triggers startup tracking once startup is complete.
 *
 * Startup is considered complete when:
 * - Every value in {@link LAST_STARTUP_EVENT_VALUES} has been logged at least once in {@link startupEvents}
 *
 * In practice both "App started" and "Splash screen faded" might happen in different orders. Thus, this just makes sure
 * both events happened and at least once before triggering the tracking.
 * As the tracking functions should only be called once this also ensures this is the first time the given event was logged.
 *
 * @param eventName One of the last startup event labels defined in {@link LastStartupEvent}.
 * @returns The {@link StartupEvent} instance recorded for this call.
 */
export async function logLastStartupEvents(eventName: LastStartupEvent): Promise<StartupEvent> {
  const event = logStartupEvent(eventName);
  const lastEventCalls = startupEvents.flatMap(e =>
    LAST_STARTUP_EVENT_VALUES.includes(e.event) ? e.event : [],
  );
  const isStartupDone = new Set(lastEventCalls).size === LAST_STARTUP_EVENT_VALUES.length;
  const isStartupLastCall = lastEventCalls.filter(e => e === eventName).length === 1;
  if (isStartupDone && isStartupLastCall) {
    try {
      DdRumReactNavigationTracking.startTrackingViews(navigationRef.current, viewNamePredicate);
      const events = await resolveStartupEvents();
      const appStartupTime = events.find(e => e.event === eventName)?.time ?? 0;
      await track("app_startup_events", { appStartupTime, events });
    } catch (error) {
      console.error("Error during app startup tracking:", error);
    }
  }
  return event;
}
