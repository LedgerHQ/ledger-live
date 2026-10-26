/* eslint-disable no-console */
// Distributes mobile E2E spec files across CI shards (by timing), after selecting them
// with e2e/tooling/filter/selectSpecs.mjs. Run from the repo root by the mobile E2E workflows.
// Usage:
//   Selection mode: node shard-tests.mjs [testFilter] [testRootDir]
//   Sharding mode:  node shard-tests.mjs [fileList] [platform] [testRootDir] [shardIndex] [shardTotal]
//   In sharding mode the first arg is the precomputed spec-file list from a prior
//   selection call (used directly, no re-scan/re-filter), not a filter.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  compareStrings,
  findTestFiles,
  filterTestFiles,
} from "../../tooling/filter/selectSpecs.mjs";

const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

function loadTimingData(platform, testRootDir) {
  try {
    const timingFile = path.join(testRootDir, "artifacts", `e2e-test-results-${platform}.json`);
    if (fs.existsSync(timingFile)) {
      const timingData = JSON.parse(fs.readFileSync(timingFile, "utf8"));
      console.error(`[shard-tests] Loaded timing data from ${timingFile}`);

      // Convert Jest test results array to object format expected by the script
      if (timingData.testResults && Array.isArray(timingData.testResults)) {
        const convertedTestResults = {};
        for (const testResult of timingData.testResults) {
          if (testResult.name) {
            // Extract filename from the full path
            const fileName = path.basename(testResult.name, ".spec.ts");
            convertedTestResults[fileName] = {
              duration:
                testResult.endTime && testResult.startTime
                  ? testResult.endTime - testResult.startTime
                  : 0,
            };
          }
        }
        return { ...timingData, testResults: convertedTestResults };
      }

      return timingData;
    }
  } catch (e) {
    console.error(`[shard-tests] Error loading timing data:`, e);
    throw new Error(`Failed to load timing data: ${e.message}`);
  }
  return {};
}

const PAYTAB_SPEC = /\/paytab\//;

function splitPaytab(files) {
  const paytab = [];
  const rest = [];
  for (const file of files) {
    (PAYTAB_SPEC.test(file.replaceAll("\\", "/")) ? paytab : rest).push(file);
  }
  return { paytab, rest };
}

function leastLoadedShard(shards) {
  let target = 0;
  for (let i = 1; i < shards.length; i++) {
    if (shards[i].totalDuration < shards[target].totalDuration) target = i;
  }
  return target;
}

function pinPaytab(shards, paytabFiles) {
  if (paytabFiles.length === 0 || shards.length === 0) return;
  // Duration stays unchanged so later specs can still land on this shard.
  shards[leastLoadedShard(shards)].files.push(...paytabFiles);
}

export function distributeFilesByTiming(files, timingData, shardIndex, shardTotal) {
  if (shardTotal <= 0) return [];

  const { paytab, rest } = splitPaytab(files);
  const shards = Array.from({ length: shardTotal }, () => ({ files: [], totalDuration: 0 }));
  const durationOf = file => {
    const fileName = path.basename(file, ".spec.ts");
    return timingData.testResults?.[fileName]?.duration || 0;
  };

  pinPaytab(shards, paytab);

  if (!timingData.testResults || Object.keys(timingData.testResults).length === 0) {
    // Spread tests across shards when timing is unavailable.
    const spread = rest.filter((_, i) => i % shardTotal === shardIndex - 1);
    if (paytab.length > 0 && shardIndex === 1) return [...paytab, ...spread];
    return spread;
  }

  // Sort files by estimated duration (from timing data)
  const filesWithTiming = rest.map(file => {
    return { file, duration: durationOf(file) };
  });

  // Sort by duration (longest first for better load balancing)
  filesWithTiming.sort((a, b) => {
    if (b.duration !== a.duration) {
      return b.duration - a.duration;
    }
    // When durations are equal, sort by file path
    return compareStrings(a.file, b.file);
  });

  // Separate tests with actual timing from tests with 0ms duration
  const testsWithTiming = filesWithTiming.filter(f => f.duration > 0);
  const testsWithZeroTiming = filesWithTiming.filter(f => f.duration === 0);

  // First, distribute tests with actual timing using greedy approach
  for (const { file, duration } of testsWithTiming) {
    // Find shard with minimum total time
    // When multiple shards have the same total time, prefer the one with lower index for determinism
    let minShardIndex = 0;
    let minTotalTime = Infinity;

    for (let i = 0; i < shardTotal; i++) {
      if (shards[i].totalDuration < minTotalTime) {
        minTotalTime = shards[i].totalDuration;
        minShardIndex = i;
      }
    }

    // Add file to the shard with minimum total time
    shards[minShardIndex].files.push(file);
    shards[minShardIndex].totalDuration += duration;
  }

  // Then, distribute tests with 0ms duration using round-robin to ensure even distribution
  for (let i = 0; i < testsWithZeroTiming.length; i++) {
    const shardToUse = i % shardTotal;
    shards[shardToUse].files.push(testsWithZeroTiming[i].file);
  }

  return shards[shardIndex - 1]?.files || [];
}

/**
 * Main entry point. Two modes:
 * - Selection (2 args): `[testFilter] [testRootDir]` — scan + filter, print the matching spec files.
 * - Sharding (5 args): `[fileList] [platform] [testRootDir] [shardIndex] [shardTotal]` — the first
 *   arg is the precomputed spec-file list (from the selection call), so it's used directly (no
 *   re-scan / re-filter); files are distributed across shards by timing.
 */
export function main() {
  const args = process.argv.slice(2);

  if (args.length === 5) {
    const [fileList, platform, testRootDir, shardIndex, shardTotal] = args;

    // The first arg is already the selected spec-file list, not a filter.
    const files = fileList.trim().split(/\s+/).filter(Boolean);

    const timingData = loadTimingData(platform, testRootDir);

    const shardFiles = distributeFilesByTiming(
      files,
      timingData,
      parseInt(shardIndex),
      parseInt(shardTotal),
    );

    console.log(shardFiles.join(" "));
  } else if (args.length <= 2) {
    const [testFilter, testRootDir] = args;

    const files = findTestFiles(testRootDir || baseDir);
    const filteredFiles = filterTestFiles(files, testFilter || "");

    console.log(filteredFiles.join(" "));
  } else {
    console.error(
      "[shard-tests] Invalid arguments.\n" +
        "  Selection mode: node shard-tests.mjs [testFilter] [testRootDir]\n" +
        "  Sharding mode:  node shard-tests.mjs [fileList] [platform] [testRootDir] [shardIndex] [shardTotal]",
    );
    process.exitCode = 1;
  }
}

// Only run when invoked directly (e.g. `node shard-tests.mjs ...`), so the module
// can be imported by unit tests without executing.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
