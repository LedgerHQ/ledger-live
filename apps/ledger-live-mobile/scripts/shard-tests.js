/* eslint-disable no-console */
// Usage: node shard-tests.js [testFilter] [platform] [testRootDir] [shardIndex] [shardTotal]
// Example: node shard-tests.js "" ios e2e/mobile 1 3

import fs from "fs";
import path from "path";

const baseDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));

function getTimingFilePath(testRootDir, platform) {
  const rootDir = testRootDir ? path.resolve(testRootDir) : baseDir;
  console.error(`[shard-tests] rootDir: ${rootDir}`);
  if (platform) {
    return path.resolve(rootDir, "artifacts", `e2e-test-results-${platform}.json`);
  } else {
    return path.resolve(rootDir, "artifacts", "e2e-test-results.json");
  }
}

function loadTimings(timingPath) {
  if (!fs.existsSync(timingPath)) return null;
  console.error(`[shard-tests] Found timing file: ${timingPath}`);
  try {
    return JSON.parse(fs.readFileSync(timingPath, "utf8"));
  } catch (e) {
    console.error("[shard-tests] Error parsing timing file:", e);
    return null;
  }
}

function findTestFiles(dir) {
  let results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findTestFiles(fullPath));
      } else if (entry.name.endsWith(".spec.ts")) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    console.error("[shard-tests] Error reading directory:", dir, e);
  }
  return results;
}

function filterTestFiles(files, testFilter) {
  if (!testFilter) return files;
  const filters = testFilter.toLowerCase().split(/\s+/).filter(Boolean);
  return files.filter(f => filters.some(fltr => f.toLowerCase().includes(fltr)));
}

function buildTimingMap(timings) {
  const timingMap = new Map();
  if (!timings || !timings.testResults) return timingMap;
  for (const tr of timings.testResults) {
    let totalDuration = 0;
    if (tr.assertionResults && Array.isArray(tr.assertionResults)) {
      totalDuration = tr.assertionResults.reduce((sum, result) => sum + (result.duration || 0), 0);
    } else if (tr.endTime && tr.startTime) {
      totalDuration = tr.endTime - tr.startTime;
    }
    timingMap.set(tr.name, totalDuration);
  }
  return timingMap;
}

function getFilesForShard(files, shard, total) {
  if (!shard || !total || total < 2) return files;
  // 1-based shard index
  return files.filter((_, idx) => idx % total === shard - 1);
}

function main() {
  const { testFilter, platform, testRootDir, shardIndex, shardTotal } = (() => {
    // Parse testFilter, platform, testRootDir, shardIndex, shardTotal
    const testFilter = process.argv[2] || "";
    const platform = process.argv[3] || "";
    const testRootDir = process.argv[4] || baseDir;
    const shardIndex = parseInt(process.argv[5], 10) || 0;
    const shardTotal = parseInt(process.argv[6], 10) || 0;
    return { testFilter, platform, testRootDir, shardIndex, shardTotal };
  })();
  const timingPath = getTimingFilePath(testRootDir, platform);
  const timings = loadTimings(timingPath);
  console.error("[shard-tests] Timing file contents:\n" + JSON.stringify(timings, null, 2));
  let discoveredFiles = findTestFiles(testRootDir);
  console.error(`[shard-tests] Discovered ${discoveredFiles.length} test files:`, discoveredFiles);
  discoveredFiles = filterTestFiles(discoveredFiles, testFilter);
  if (testFilter) {
    console.error(
      `[shard-tests] Filtered to ${discoveredFiles.length} test files:`,
      discoveredFiles,
    );
  }
  let filesForShard;
  if (timings && timings.testResults) {
    const timingMap = buildTimingMap(timings);
    // Sort all files by timing (desc)
    filesForShard = [...discoveredFiles].sort(
      (a, b) => (timingMap.get(b) || 0) - (timingMap.get(a) || 0),
    );
  } else {
    console.error("[shard-tests] No timing file found, using round-robin order.");
    filesForShard = [...discoveredFiles].sort();
  }
  if (shardIndex && shardTotal && shardTotal > 1) {
    filesForShard = getFilesForShard(filesForShard, shardIndex, shardTotal);
    console.error(
      `[shard-tests] Sliced to ${filesForShard.length} files for shard ${shardIndex}/${shardTotal}`,
    );
  }
  // If no files, print message and exit 0
  if (filesForShard.length === 0) {
    console.error("[shard-tests] No test files matched the filter. Exiting with no files.");
    process.exit(0);
  }
  // Output all files, one per line
  for (const file of filesForShard) {
    console.log(file);
  }
  process.exit(0);
}

main();
