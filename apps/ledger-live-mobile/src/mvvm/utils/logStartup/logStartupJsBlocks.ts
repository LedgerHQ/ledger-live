// Experiment for QAA-1501, not for develop: a startup event for each stretch the JS thread could not
// run a 10 ms timer, to see what the startup waits behind. The event's time is the stretch's end.
import { logStartupEvent, startupFirstImportTime } from "../logStartupTime";

const TICK_MS = 10;
const LOGGED_FROM_MS = 50;
const WATCHED_MS = 8_000;

let last = Date.now();
let blocks = 0;

function tick() {
  const now = Date.now();
  const blocked = now - last - TICK_MS;
  if (blocked >= LOGGED_FROM_MS) {
    blocks += 1;
    logStartupEvent(`JS blocked ${blocks} for ${blocked} ms`);
  }
  last = now;
  if (now - startupFirstImportTime < WATCHED_MS) setTimeout(tick, TICK_MS);
}

setTimeout(tick, TICK_MS);
