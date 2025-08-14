/* eslint-disable no-console */
// Usage: node shard-tests.js [testFilter] [testRootDir]
import fs from "fs";
import path from "path";

const baseDir = path.resolve(path.dirname(new URL(import.meta.url).pathname));

/**
 * Recursively searches through directories to find all .spec.ts test files
 * @param {string} dir - The directory to search in
 * @returns {string[]} An array of full paths to test files
 */
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

/**
 * Filters test files based on provided search terms
 * If no filter is provided, returns all files
 * If filter is provided, returns files that match any of the space-separated terms
 * @param {string[]} files - Array of file paths to filter
 * @param {string} testFilter - Space-separated filter terms
 * @returns {string[]} Filtered array of file paths
 */
function filterTestFiles(files, testFilter) {
  if (!testFilter) return files;
  const filters = testFilter.toLowerCase().split(/\s+/).filter(Boolean);
  return files.filter(f => filters.some(filter => f.toLowerCase().includes(filter)));
}

/**
 * Main entry point that:
 * 1. Gets test filter and root directory from command line args
 * 2. Finds all test files in the directory
 * 3. Applies any filters
 * 4. Outputs the final list of files as a space-separated string
 */
function main() {
  const testFilter = process.argv[2] || "";
  const testRootDir = process.argv[3] || baseDir;

  const files = findTestFiles(testRootDir);
  const filteredFiles = filterTestFiles(files, testFilter);

  // Output the files as a space-separated string
  console.log(filteredFiles.join(" "));
}

main();
