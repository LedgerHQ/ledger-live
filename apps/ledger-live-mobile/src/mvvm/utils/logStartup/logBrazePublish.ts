// Experiment for QAA-1501, not for develop: startup events at each step of a Braze content-card
// publish, numbered per publish, to split its cost into filtering, building, dispatching and rendering.
import { logStartupEvent } from "../logStartupTime";

let publishes = 0;

export function startBrazePublish(reason: string, cards: number): void {
  publishes += 1;
  logStartupEvent(`Braze publish ${publishes} start (${reason}, ${cards} cards)`);
}

export function markBrazePublish(step: string): void {
  if (publishes === 0) return;
  logStartupEvent(`Braze publish ${publishes} ${step}`);
}

/** After the dispatches: a microtask runs after React's sync render, a timeout after the rest. */
export function endBrazePublish(): void {
  const publish = publishes;
  logStartupEvent(`Braze publish ${publish} dispatched`);
  queueMicrotask(() => logStartupEvent(`Braze publish ${publish} rendered`));
  setTimeout(() => logStartupEvent(`Braze publish ${publish} settled`), 0);
}
