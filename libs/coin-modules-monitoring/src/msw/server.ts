import { setupServer } from "msw/node";
import { http, passthrough } from "msw";

export const server = setupServer();

const counters: Record<string, number> = {};

export function resetCounters() {
  for (const key in counters) {
    delete counters[key];
  }
}

export function snapshotCounters() {
  return { ...counters };
}

export function totalCalls(): number {
  return Object.values(counters).reduce((sum, v) => sum + v, 0);
}

function bump(req: Request) {
  const key = new URL(req.url).hostname;
  counters[key] = (counters[key] ?? 0) + 1;
}

server.events.on("request:start", ({ request }) => bump(request));

server.use(http.all("*", () => passthrough()));
