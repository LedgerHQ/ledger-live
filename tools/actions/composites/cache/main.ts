import { input, run, saveState, setOutput } from "./lib.ts";

// Probe before downloading so a miss is distinguishable from a transport or
// credentials failure: a miss is routine and must not fail the job, anything
// else should be loud.
const hit = run("probe") === 0;
setOutput("cache-hit", String(hit));
// Named without a dash on purpose: the runner exposes state as STATE_<name>
// verbatim, and STATE_cache-hit is awkward to read back.
saveState("CACHE_HIT", String(hit));

// Attempt the download even when the exact key missed: cache.sh falls back to
// the restore-key prefixes, and a prefix match is still worth restoring. Only
// an exact hit makes a download failure fatal — otherwise it is just a miss.
const status = run("download");

if (status === 0) {
  process.exit(0);
}

if (hit) {
  process.exit(status);
}

console.log(`Cache miss for ${input("key")}; the post step will save it.`);
