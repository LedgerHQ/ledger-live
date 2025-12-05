// NOTE don't import anything in order to measure the startup time with minimal overhead
/* eslint-disable no-console */

if (__DEV__) console.time("LogStartupTime");
export const startupFirstImportTime = Date.now();

export type StartupEvent = { event: string; time: number };
export const startupEventsResolvers: ((start: number) => StartupEvent)[] = [];

export function logStartupEvent(eventName: string) {
  if (__DEV__) console.timeLog("LogStartupTime", eventName);
  const now = Date.now();
  return new Promise<StartupEvent>(res => {
    startupEventsResolvers.push(start => {
      const event = { event: eventName, time: now - start };
      res(event);
      return event;
    });
  });
}
