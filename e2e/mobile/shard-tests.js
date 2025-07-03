// shard-tests.js
// Usage: node shard-tests.js <numShards> <shardIndex>
// Example: node shard-tests.js 3 1

import fs from "fs";
import path from "path";

const timingsPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "jest-timings.json",
);
if (!fs.existsSync(timingsPath)) {
  console.error("Timing file not found:", timingsPath);
  process.exit(1);
}
const timings = JSON.parse(fs.readFileSync(timingsPath, "utf8"));
const testFiles = timings.testResults.map(tr => ({
  file: tr.name,
  time: (tr.endTime || 0) - (tr.startTime || 0),
}));

const numShards = parseInt(process.argv[2], 10);
const shardIndex = parseInt(process.argv[3], 10) - 1; // 1-based to 0-based
if (isNaN(numShards) || isNaN(shardIndex) || shardIndex < 0 || shardIndex >= numShards) {
  console.error("Usage: node shard-tests.js <numShards> <shardIndex>");
  process.exit(2);
}

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