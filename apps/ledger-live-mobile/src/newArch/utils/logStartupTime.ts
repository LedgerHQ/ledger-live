// NOTE don't import anything in order to measure the startup time with minimal overhead
/* eslint-disable no-console */

if (__DEV__) console.time("LogStartupTime");
export const startupFirstImportTime = Date.now();

export type StartupEvent = { event: string; time: number };
export const startupEvents: StartupEvent[] = [];

export function logStartupEvent(eventName: string) {
  if (__DEV__) console.timeLog("LogStartupTime", eventName);
  startupEvents.push({ event: eventName, time: Date.now() });
}
