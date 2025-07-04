// shard-tests.js
// Usage: node shard-tests.js <numShards> <shardIndex>
// Example: node shard-tests.js 3 1

import fs from "fs";
import path from "path";

const baseDir = path.dirname(new URL(import.meta.url).pathname);
const artifactsTimingPath = path.resolve(baseDir, "artifacts", "jest-timings.json");
const defaultTimingPath = path.resolve(baseDir, "jest-timings.json");

let testFiles = [];
let timings = null;
if (fs.existsSync(artifactsTimingPath)) {
  timings = JSON.parse(fs.readFileSync(artifactsTimingPath, "utf8"));
} else if (fs.existsSync(defaultTimingPath)) {
  timings = JSON.parse(fs.readFileSync(defaultTimingPath, "utf8"));
} else {
  // eslint-disable-next-line no-console
  console.warn("No timing file found, using round-robin sharding.");
}

const numShards = parseInt(process.argv[2], 10);
const shardIndex = parseInt(process.argv[3], 10) - 1; // 1-based to 0-based
if (isNaN(numShards) || isNaN(shardIndex) || shardIndex < 0 || shardIndex >= numShards) {
  console.error("Usage: node shard-tests.js <numShards> <shardIndex>");
  process.exit(2);
}

if (timings && timings.testResults) {
  // Timing-based sharding
  testFiles = timings.testResults.map(tr => ({
    file: tr.name,
    time: (tr.endTime || 0) - (tr.startTime || 0),
  }));
  // Sort test files by time descending
  const sorted = [...testFiles].sort((a, b) => b.time - a.time);
  const shards = Array.from({ length: numShards }, () => ({ files: [], total: 0 }));
  for (const test of sorted) {
    // Assign to the shard with the least total time
    shards.sort((a, b) => a.total - b.total);
    shards[0].files.push(test.file);
    shards[0].total += test.time;
  }
  // eslint-disable-next-line no-console
  console.log(shards[shardIndex].files.join(" "));
} else {
  // Fallback: simple round-robin sharding by test file name
  // Find all test files in e2e/mobile/ (assume .test.js or .spec.js)
  const glob = () =>
    fs.readdirSync(baseDir).filter(f => f.endsWith(".test.js") || f.endsWith(".spec.js"));
  let allFiles = [];
  try {
    allFiles = glob();
  } catch (e) {
    // fallback to empty
    allFiles = [];
  }
  allFiles.sort();
  const filesForShard = allFiles.filter((_, idx) => idx % numShards === shardIndex);
  // eslint-disable-next-line no-console
  console.log(filesForShard.join(" "));
}
