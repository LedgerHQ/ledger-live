import { setupServer } from "msw/node";
import { http, passthrough } from "msw";

export const server = setupServer();

type CounterKey = string;
const counters = new Map<CounterKey, number>();

function keyFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.hostname}`;
}

export function resetCounters() {
  counters.clear();
}

export function snapshotCounters() {
  const out = Array.from(counters.entries());
  return Object.fromEntries(out);
}

export function totalCalls() {
  let sum = 0;
  for (const [, v] of counters.entries()) {
    sum += v;
  }
  return sum;
}

function bump(req: Request) {
  const key = keyFromRequest(req);
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

server.events.on("request:start", ({ request }) => bump(request));

server.use(
  http.all("*", () => {
    return passthrough();
  }),
);
