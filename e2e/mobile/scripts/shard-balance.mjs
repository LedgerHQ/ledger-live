/* eslint-disable no-console */
// Replays the CI shard distribution against a timing file, to answer "would more shards help,
// or are the shards badly balanced?" without running CI. See e2e/mobile/docs/sharding.md.
// Usage (from the repo root):
//   node e2e/mobile/scripts/shard-balance.mjs --platform android
//   node e2e/mobile/scripts/shard-balance.mjs --platform ios --counts 12,20,30 --filter "@NanoSP"
// Reads the same timing file the workflow restores: <root>/artifacts/e2e-test-results-<platform>.json
import path from "path";

import { findTestFiles, filterTestFiles } from "../../tooling/filter/selectSpecs.mjs";
import { loadTimingData, distributeFilesByTiming } from "./shard-tests.mjs";

const DEFAULT_COUNTS = [8, 12, 16, 20, 24, 30, 40];

function parseArgs(argv) {
  const opts = { platform: "android", root: "e2e/mobile", counts: DEFAULT_COUNTS, filter: "" };
  for (let i = 0; i < argv.length; i += 2) {
    const value = argv[i + 1];
    switch (argv[i]) {
      case "--platform":
        opts.platform = value;
        break;
      case "--root":
        opts.root = value;
        break;
      case "--filter":
        opts.filter = value ?? "";
        break;
      case "--counts":
        opts.counts = value
          .split(",")
          .map(n => parseInt(n, 10))
          .filter(n => n > 0);
        break;
      default:
        throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  if (!["ios", "android"].includes(opts.platform)) {
    throw new Error(`--platform must be ios or android, got "${opts.platform}"`);
  }
  return opts;
}

function durationOf(timingData, file) {
  const key = path.basename(file, ".spec.ts");
  return timingData.testResults?.[key]?.duration || 0;
}

// Calls the production distributor once per shard index, exactly as the N separate CI jobs do,
// so an inconsistent partition (a file duplicated or dropped) shows up here too.
function replay(files, timingData, shardTotal) {
  const shards = [];
  const seen = new Map();

  for (let shardIndex = 1; shardIndex <= shardTotal; shardIndex++) {
    const assigned = distributeFilesByTiming(files, timingData, shardIndex, shardTotal);
    const ms = assigned.reduce((sum, f) => sum + durationOf(timingData, f), 0);
    shards.push({ shardIndex, files: assigned, ms });
    for (const f of assigned) seen.set(f, (seen.get(f) ?? 0) + 1);
  }

  const totalMs = shards.reduce((sum, s) => sum + s.ms, 0);
  const maxMs = Math.max(...shards.map(s => s.ms));
  const meanMs = totalMs / shardTotal;

  return {
    shards,
    maxMs,
    meanMs,
    imbalance: meanMs > 0 ? maxMs / meanMs : 1,
    duplicated: [...seen.entries()].filter(([, n]) => n > 1).map(([f]) => f),
    missing: files.filter(f => !seen.has(f)),
  };
}

const min = ms => (ms / 60000).toFixed(1);

function main() {
  const opts = parseArgs(process.argv.slice(2));

  const timingData = loadTimingData(opts.platform, opts.root);
  const hasTiming = Object.keys(timingData.testResults ?? {}).length > 0;

  const files = filterTestFiles(findTestFiles(opts.root), opts.filter);
  if (files.length === 0) {
    console.error(`No spec files found under ${opts.root} for filter "${opts.filter}".`);
    process.exitCode = 1;
    return;
  }

  const timed = files.filter(f => durationOf(timingData, f) > 0);
  const heaviest = files.reduce(
    (max, f) => {
      const ms = durationOf(timingData, f);
      return ms > max.ms ? { file: f, ms } : max;
    },
    { file: files[0], ms: 0 },
  );

  console.log(`platform      ${opts.platform}`);
  console.log(`spec files    ${files.length} selected, ${timed.length} with timing`);

  if (!hasTiming) {
    console.log("");
    console.log(
      "No timing data. The distributor falls back to round-robin by alphabetical index, " +
        "which ignores duration entirely - the numbers below would all be meaningless, so " +
        "restore a timing file first (see e2e/mobile/docs/sharding.md).",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`heaviest file ${path.basename(heaviest.file)} at ${min(heaviest.ms)}m`);
  console.log(
    "              this is the floor: one spec file cannot be split, so no shard count goes below it",
  );
  console.log("");
  console.log("shards   slowest    mean   imbalance   vs 12 shards");
  console.log("------   -------   -----   ---------   ------------");

  const baseline = replay(files, timingData, 12).maxMs;

  for (const shardTotal of opts.counts) {
    const r = replay(files, timingData, shardTotal);

    if (r.duplicated.length > 0 || r.missing.length > 0) {
      console.error(
        `\nPartition is not a clean split at ${shardTotal} shards: ` +
          `${r.duplicated.length} duplicated, ${r.missing.length} unassigned.`,
      );
      process.exitCode = 1;
    }

    const atFloor = r.maxMs <= heaviest.ms ? "  <- at floor" : "";
    const ratio = baseline > 0 ? `${(r.maxMs / baseline).toFixed(2)}x` : "-";
    console.log(
      `${String(shardTotal).padStart(6)}   ${min(r.maxMs).padStart(6)}m   ` +
        `${min(r.meanMs).padStart(5)}m   ${r.imbalance.toFixed(3).padStart(9)}   ` +
        `${ratio.padStart(12)}${atFloor}`,
    );
  }

  console.log("");
  console.log(
    "imbalance = slowest shard / perfect average. 1.000 is a mathematically perfect split; " +
      "values near 1.0 mean the packer has no headroom left and only the shard count moves the " +
      "slowest shard. Times are test time only - per-shard setup is a fixed cost on top.",
  );
}

main();
