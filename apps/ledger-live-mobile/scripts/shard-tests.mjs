/* eslint-disable no-console */
// Usage:
//   node shard-tests.mjs [testFilter] [testRootDir]
//   node shard-tests.mjs [testFilter] [platform] [testRootDir] [shardIndex] [shardTotal]
import fs from "fs";
import path from "path";

const baseDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));

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
  return files.filter(f => filters.some(filter => f.toLowerCase().includes(filter)));
}

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
  }
  return {};
}

function distributeFilesByTiming(files, timingData, shardIndex, shardTotal) {
  if (!timingData.testResults || Object.keys(timingData.testResults).length === 0) {
    // No timing data available, use simple round-robin distribution
    const filesPerShard = Math.ceil(files.length / shardTotal);
    const startIndex = (shardIndex - 1) * filesPerShard;
    const endIndex = Math.min(startIndex + filesPerShard, files.length);
    return files.slice(startIndex, endIndex);
  }

  // Sort files by estimated duration (from timing data)
  const filesWithTiming = files.map(file => {
    const fileName = path.basename(file, ".spec.ts");
    const timing = timingData.testResults[fileName] || { duration: 0 };
    return { file, duration: timing.duration || 0 };
  });

  // Sort by duration (longest first for better load balancing)
  filesWithTiming.sort((a, b) => b.duration - a.duration);

  // Separate tests with actual timing from tests with 0ms duration
  const testsWithTiming = filesWithTiming.filter(f => f.duration > 0);
  const testsWithZeroTiming = filesWithTiming.filter(f => f.duration === 0);

  // Distribute files across shards using greedy approach for tests with actual timing
  const shards = Array.from({ length: shardTotal }, () => ({ files: [], totalDuration: 0 }));

  // First, distribute tests with actual timing using greedy approach
  for (const { file, duration } of testsWithTiming) {
    // Find shard with minimum total time
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
 * Main entry point that:
 * 1. Gets parameters from command line args
 * 2. Finds all test files in the directory
 * 3. Applies any filters
 * 4. If sharding parameters provided, distributes files by timing
 * 5. Outputs the final list of files as a space-separated string
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length >= 4) {
    const [testFilter, platform, testRootDir, shardIndex, shardTotal] = args;

    const files = findTestFiles(testRootDir);
    const filteredFiles = filterTestFiles(files, testFilter);

    const timingData = loadTimingData(platform, testRootDir);

    const shardFiles = distributeFilesByTiming(
      filteredFiles,
      timingData,
      parseInt(shardIndex),
      parseInt(shardTotal),
    );

    console.log(shardFiles.join(" "));
  } else {
    const [testFilter, testRootDir] = args;

    const files = findTestFiles(testRootDir || baseDir);
    const filteredFiles = filterTestFiles(files, testFilter || "");

    console.log(filteredFiles.join(" "));
  }
}

main();
