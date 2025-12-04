// NOTE don't import anything in order to measure the startup time with minimal overhead
export type StartupEvent = { event: string; time: number };

const resolvers: ((start: Promise<number>) => Promise<StartupEvent>)[] = [];
const resolved: Promise<StartupEvent>[] = [];

export function logStartupEvent(eventName: string) {
  const now = Date.now();
  return new Promise<StartupEvent>(res => {
    resolvers.push(async start => {
      const event = { event: eventName, time: now - (await start) };
      res(event);
      return event;
    });
  });
}

export function resolveStartupEvents(start: Promise<number>) {
  resolved.push(...resolvers.splice(0).map(resolver => resolver(start)));
  return Promise.all(resolved);
}
