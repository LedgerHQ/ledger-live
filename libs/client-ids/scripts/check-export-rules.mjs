#!/usr/bin/env node

/**
 * Script to verify that ID export methods are only used in allowed files.
 * Rules are defined in export-rules.json, organized by source file.
 *
 * This script:
 * 1. Finds all export* methods in the source files
 * 2. Checks if they are used anywhere
 * 3. Verifies that all usages are in allowed files according to the rules
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

/**
 * Extract all export* methods from a source file
 * Only matches method definitions, not calls
 */
async function extractExportMethods(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    // Match method definitions: exportUserIdForXxx(): string { or exportUserIdForXxx() {
    // This regex matches the method name before the colon or opening brace
    const exportMethodRegex = /export\w+For\w+\s*\(\)\s*:/g;
    const matches = content.match(exportMethodRegex);
    if (!matches) return [];

    // Extract method names (remove the () and : part)
    return matches.map(match => match.replace(/\s*\(\)\s*:$/, ""));
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Find all files that use a specific function
 */
async function findUsages(functionName) {
  try {
    const { stdout } = await execAsync(
      `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=lib --exclude-dir=lib-es --exclude-dir=node_modules --exclude-dir=.next -l "${functionName}" .`,
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
  } catch {
    // grep returns non-zero exit code when no matches found, which is fine
    return [];
  }
}

/**
 * Check if a function is used and if all usages are allowed
 * @param sourceFile - The file where the function is actually defined (e.g., UserId.ts)
 * @param functionName - The name of the function to check
 * @param allowedFiles - Array of files where the function is allowed to be used
 * @param rules - The rules object loaded from export-rules.json
 */
async function checkFunction(sourceFile, functionName, allowedFiles, rules) {
  const usages = await findUsages(functionName);

  // Build final allowed files: source file + ID definition files + explicitly allowed files
  const idDefinitionFiles = Object.keys(rules).filter(
    key => key.startsWith("libs/client-ids/src/ids/") && key.endsWith(".ts"),
  );
  const finalAllowedFiles = [...new Set([sourceFile, ...idDefinitionFiles, ...allowedFiles])];

  // Exclude test files, webpack bundles, next.js builds, and the source file itself (where the function is defined)
  const violations = usages.filter(
    file =>
      !file.includes(".test.") &&
      !file.includes(".webpack/") &&
      !file.includes(".bundle.js") &&
      !file.includes(".next/") &&
      !file.includes("CHANGELOG") &&
      file !== sourceFile &&
      !finalAllowedFiles.includes(file),
  );

  if (violations.length > 0) {
    console.error(`❌ Rule violation for ${functionName} (from ${sourceFile}):`);
    console.error(
      `   Allowed files: ${finalAllowedFiles.length > 0 ? finalAllowedFiles.join(", ") : "none"}`,
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

  // Infer source files from export-rules.json keys
  // All keys in the rules file are source files that define export methods
  const sourceFiles = Object.keys(rules).map(relativePath => join(rootDir, relativePath));

  const allExportMethods = new Map(); // sourceFile -> [methodNames]

  for (const sourceFile of sourceFiles) {
    const methods = await extractExportMethods(sourceFile);
    if (methods.length > 0) {
      // Convert absolute path to relative path from root
      const relativePath = sourceFile.replace(rootDir + "/", "");
      allExportMethods.set(relativePath, methods);
    }
  }

  // Collect all function checks
  const checks = [];

  // Check all methods found in source files
  for (const [sourceFile, methods] of allExportMethods.entries()) {
    for (const methodName of methods) {
      // Find rules for this method (check all rule files)
      let allowedFiles = [];
      for (const [, ruleMethods] of Object.entries(rules)) {
        if (ruleMethods[methodName]) {
          allowedFiles = ruleMethods[methodName];
          break;
        }
      }

      // If method is not in rules at all, check if it's used externally
      if (allowedFiles.length === 0) {
        const usages = await findUsages(methodName);
        const sourceDir = dirname(sourceFile);
        const actualUsages = usages.filter(
          file =>
            !file.includes(".test.") &&
            !file.includes(".webpack/") &&
            !file.includes(".bundle.js") &&
            !file.includes(".next/") &&
            !file.includes("CHANGELOG") &&
            file !== sourceFile &&
            !file.startsWith(sourceDir + "/"),
        );

        if (actualUsages.length > 0) {
          console.error(`❌ Rule violation for ${methodName} (from ${sourceFile}):`);
          console.error(`   Method is used but not whitelisted in export-rules.json`);
          console.error(`   Found in: ${actualUsages.join(", ")}`);
          checks.push(Promise.resolve(false));
        }
      } else {
        // Method is in rules, check that all usages are allowed
        checks.push(checkFunction(sourceFile, methodName, allowedFiles, rules));
      }
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
