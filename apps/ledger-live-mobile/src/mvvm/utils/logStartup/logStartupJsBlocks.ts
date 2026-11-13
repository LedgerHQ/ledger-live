// Experiment for QAA-1501, not for develop: a startup event for each stretch the JS thread could not
// run a 10 ms timer, named after the Redux actions dispatched during it or just before it, and the
// JS thread's busy time so far at each startup milestone.
import { logStartupEvent, startupEvents, startupFirstImportTime } from "../logStartupTime";
import type { StartupEvent } from "../logStartupTime";

const TICK_MS = 10;
const LOGGED_FROM_MS = 50;
const WATCHED_MS = 8_000;
const ACTIONS_BEFORE_MS = 30;
const KEPT_DISPATCHES = 100;
const NAMED_ACTIONS = 4;
// A timer late by up to about one frame counts as idle.
const IDLE_LATENESS_MS = 8;
const MILESTONES = new Set([
  "DeeplinksProvider render",
  "WaitForAppReady render",
  "WaitForAppReady availability checked",
  "WaitForAppReady done",
  "App render",
  "DD view loaded",
  "Splash screen faded",
  "App started",
]);

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
let busyMs = 0;

const busyBeyondIdle = (now: number) => Math.max(0, now - last - TICK_MS - IDLE_LATENESS_MS);

function tick() {
  const now = Date.now();
  const blocked = now - last - TICK_MS;
  if (blocked >= LOGGED_FROM_MS) {
    blocks += 1;
    logStartupEvent(
      `JS blocked ${blocks} for ${blocked} ms after ${actionsAround(last + TICK_MS, now)}`,
    );
  }
  busyMs += busyBeyondIdle(now);
  last = now;
  if (now - startupFirstImportTime < WATCHED_MS) setTimeout(tick, TICK_MS);
}

setTimeout(tick, TICK_MS);

// The busy time goes in before the milestone itself, so "App started" still writes it to the log.
const seenMilestones = new Set<string>();
const pushEvents = startupEvents.push.bind(startupEvents);
startupEvents.push = ((...events: StartupEvent[]) => {
  for (const event of events) {
    if (MILESTONES.has(event.event) && !seenMilestones.has(event.event)) {
      seenMilestones.add(event.event);
      const busy = busyMs + busyBeyondIdle(event.time);
      pushEvents({ event: `JS busy ${busy} ms by ${event.event}`, time: event.time });
    }
  }
  return pushEvents(...events);
}) as typeof startupEvents.push;
