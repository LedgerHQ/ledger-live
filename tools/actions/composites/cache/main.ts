import { input, run, saveState, setOutput } from "./lib.ts";

// Probe before downloading so a miss is distinguishable from a transport or
// credentials failure: a miss is routine and must not fail the job, anything
// else should be loud.
const hit = run("probe") === 0;
setOutput("cache-hit", String(hit));
// Named without a dash on purpose: the runner exposes state as STATE_<name>
// verbatim, and STATE_cache-hit is awkward to read back.
saveState("CACHE_HIT", String(hit));

if (hit) {
  process.exit(run("download"));
}

console.log(`Cache miss for ${input("key")}; the post step will save it.`);
