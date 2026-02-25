// NOTE don't import anything in order to measure the startup time with minimal overhead
/* eslint-disable no-console */

if (__DEV__) console.time("LogStartupTime");
export const startupFirstImportTime = Date.now();

export type StartupEvent<Data = unknown> = { event: string; time: number; data?: Data };
export const startupEvents: StartupEvent[] = [];

export function logStartupEvent<DATA = unknown>(
  eventName: string,
  data?: DATA,
): StartupEvent<DATA> {
  devConsoleLog(eventName);
  const event = { event: eventName, time: Date.now(), data };
  startupEvents.push(event);
  return event;
}

function devConsoleLog(eventName: string) {
  if (!__DEV__) return;
  if (startupEvents.some(e => e.event === eventName)) return;
  console.timeLog("LogStartupTime", eventName);
}
