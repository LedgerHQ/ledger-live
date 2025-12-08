#!/usr/bin/env node

/**
 * Script to verify that ID export methods are only used in allowed files.
 * Rules are defined in export-rules.json, organized by source file.
 */

import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const libDir = join(__dirname, "..");
const rootDir = join(libDir, "../..");

const rulesPath = join(libDir, "export-rules.json");

async function loadRules() {
  try {
    const content = await readFile(rulesPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load rules from ${rulesPath}:`, error.message);
    process.exit(1);
  }
}

async function findUsages(functionName) {
  try {
    const { stdout } = await execAsync(
      `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=lib --exclude-dir=lib-es --exclude-dir=node_modules -l "${functionName}" .`,
      {
        cwd: rootDir,
        encoding: "utf-8",
      },
    );
    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(file => file.replace(/^\.\//, ""));
  } catch (error) {
    // grep returns non-zero exit code when no matches found, which is fine
    return [];
  }
}

async function checkFunction(sourceFile, functionName, allowedFiles) {
  const usages = await findUsages(functionName);

  // Exclude test files and the source file itself (where the function is defined)
  const violations = usages.filter(
    file => !file.includes(".test.") && file !== sourceFile && !allowedFiles.includes(file),
  );

  if (violations.length > 0) {
    console.error(`❌ Rule violation for ${functionName} (from ${sourceFile}):`);
    console.error(
      `   Allowed files: ${allowedFiles.length > 0 ? allowedFiles.join(", ") : "none"}`,
    );
    console.error(`   Found in: ${violations.join(", ")}`);
    return false;
  }

  return true;
}

async function main() {
  const rules = await loadRules();

  if (!rules || typeof rules !== "object") {
    console.error("❌ Invalid rules format in export-rules.json");
    process.exit(1);
  }

  // Collect all function checks to run in parallel
  const checks = [];

  for (const [sourceFile, functions] of Object.entries(rules)) {
    if (!functions || typeof functions !== "object") {
      console.error(`❌ Invalid rule format for ${sourceFile}`);
      process.exit(1);
    }

    for (const [functionName, allowedFiles] of Object.entries(functions)) {
      if (!Array.isArray(allowedFiles)) {
        console.error(`❌ Invalid allowedFiles format for ${functionName} in ${sourceFile}`);
        process.exit(1);
      }

      checks.push(checkFunction(sourceFile, functionName, allowedFiles));
    }
  }

  // Run all checks in parallel
  const results = await Promise.all(checks);
  const allPassed = results.every(result => result === true);

  if (!allPassed) {
    console.error("❌ Some rules failed. Please fix the violations above.");
    process.exit(1);
  }
}

main().catch(error => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
