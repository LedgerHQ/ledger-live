// shard-tests.js
// Usage: node shard-tests.js <numShards> <shardIndex> [testFilter] [platform]
// Example: node shard-tests.js 3 1 "" ios

import fs from "fs";
import path from "path";

const baseDir = path.dirname(new URL(import.meta.url).pathname);

const numShards = parseInt(process.argv[2], 10);
const shardIndex = parseInt(process.argv[3], 10) - 1;
const testFilter = process.argv[4] || "";
const platform = process.argv[5] || "";

let artifactsTimingPath;
if (platform) {
  artifactsTimingPath = path.resolve(baseDir, "artifacts", `e2e-test-results-${platform}.json`);
} else {
  artifactsTimingPath = path.resolve(baseDir, "artifacts", "e2e-test-results.json");
}

if (isNaN(numShards) || isNaN(shardIndex) || shardIndex < 0 || shardIndex >= numShards) {
  console.error(
    "[shard-tests] Usage: node shard-tests.js <numShards> <shardIndex> [testFilter] [platform]",
  );
  process.exit(2);
}

let testFiles = [];
let timings = null;
if (fs.existsSync(artifactsTimingPath)) {
  console.error(`[shard-tests] Found timing file: ${artifactsTimingPath}`);
  try {
    timings = JSON.parse(fs.readFileSync(artifactsTimingPath, "utf8"));
  } catch (e) {
    console.error("[shard-tests] Error parsing timing file:", e);
    timings = null;
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

let discoveredFiles = [];
try {
  discoveredFiles = findTestFiles(baseDir);
  console.error(`[shard-tests] Discovered ${discoveredFiles.length} test files:`, discoveredFiles);
  if (testFilter) {
    const filters = testFilter.toLowerCase().split(/\s+/).filter(Boolean);
    discoveredFiles = discoveredFiles.filter(f =>
      filters.some(fltr => f.toLowerCase().includes(fltr)),
    );
    console.error(
      `[shard-tests] Filtered to ${discoveredFiles.length} test files:`,
      discoveredFiles,
    );
  }
} catch (e) {
  console.error("[shard-tests] Error reading test files:", e);
  discoveredFiles = [];
}

if (timings && timings.testResults) {
  const timingMap = new Map();
  for (const tr of timings.testResults) {
    let totalDuration = 0;
    if (tr.assertionResults && Array.isArray(tr.assertionResults)) {
      totalDuration = tr.assertionResults.reduce((sum, result) => sum + (result.duration || 0), 0);
    } else if (tr.endTime && tr.startTime) {
      totalDuration = tr.endTime - tr.startTime;
    }
    timingMap.set(tr.name, totalDuration);
  }
  testFiles = discoveredFiles.map(file => ({
    file,
    time: timingMap.has(file) ? timingMap.get(file) : 1000,
  }));
  const sorted = [...testFiles].sort((a, b) => b.time - a.time);
  const shards = Array.from({ length: numShards }, () => ({ files: [], total: 0 }));
  let currentShard = 0;
  for (const test of sorted) {
    shards[currentShard].files.push(test.file);
    shards[currentShard].total += test.time;
    currentShard = (currentShard + 1) % numShards;
    shards.sort((a, b) => a.total - b.total);
  }
  const filesForShard = shards[shardIndex].files;
  console.error(
    `[shard-tests] Shard ${shardIndex + 1}: ${filesForShard.length} test files`,
    filesForShard,
  );
  console.log(filesForShard.join(" "));
  console.error(`[shard-tests] Done. Files for this shard: ${filesForShard.length}`);
  process.exit(0);
} else {
  console.error("[shard-tests] No timing file found, using cyclic round-robin sharding.");
  discoveredFiles.sort();
  const shards = Array.from({ length: numShards }, () => ({ files: [] }));

  discoveredFiles.forEach((file, idx) => {
    const targetShard = idx % numShards;
    shards[targetShard].files.push(file);
  });
  const filesForShard = shards[shardIndex].files;
  console.error(
    `[shard-tests] Shard ${shardIndex + 1}: ${filesForShard.length} test files`,
    filesForShard,
  );
  console.log(filesForShard.join(" "));
  console.error(`[shard-tests] Done. Files for this shard: ${filesForShard.length}`);
  process.exit(0);
}
