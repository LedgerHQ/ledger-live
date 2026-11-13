// Experiment for QAA-1501, not for develop: a startup event for each stretch the JS thread could not
// run a 10 ms timer, named after the Redux actions dispatched during it or just before it.
import { logStartupEvent, startupFirstImportTime } from "../logStartupTime";

const TICK_MS = 10;
const LOGGED_FROM_MS = 50;
const WATCHED_MS = 8_000;
const ACTIONS_BEFORE_MS = 30;
const KEPT_DISPATCHES = 100;
const NAMED_ACTIONS = 4;

type Dispatch = { type: string; start: number; end: number };
const recentDispatches: Dispatch[] = [];

/** Called by the startup action middleware for every dispatch. */
export function noteDispatch(dispatch: Dispatch): void {
  recentDispatches.push(dispatch);
  if (recentDispatches.length > KEPT_DISPATCHES) recentDispatches.shift();
}

function actionsAround(from: number, to: number): string {
  const types = recentDispatches
    .filter(d => d.end >= from - ACTIONS_BEFORE_MS && d.start <= to)
    .map(d => d.type);
  const named = [...new Set(types)].slice(-NAMED_ACTIONS);
  return named.length ? named.join(", ") : "no action";
}

let last = Date.now();
let blocks = 0;

function tick() {
  const now = Date.now();
  const blocked = now - last - TICK_MS;
  if (blocked >= LOGGED_FROM_MS) {
    blocks += 1;
    logStartupEvent(
      `JS blocked ${blocks} for ${blocked} ms after ${actionsAround(last + TICK_MS, now)}`,
    );
  }
  last = now;
  if (now - startupFirstImportTime < WATCHED_MS) setTimeout(tick, TICK_MS);
}

setTimeout(tick, TICK_MS);
