import { input, run } from "./lib.ts";

const hit = process.env.STATE_CACHE_HIT === "true";

if (hit && input("save-always") !== "true") {
  console.log("Cache was an exact key match; nothing to save.");
  process.exit(0);
}

// A failed save is not a failed job: the work already succeeded and the next
// run simply misses again.
if (run("upload") !== 0) {
  console.log(
    `::warning title=Cache not saved::Upload failed for ${input("key")}; the next run will miss.`,
  );
}
