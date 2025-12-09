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
const idsDir = join(libDir, "src/ids");

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

/**
 * Check if a function is used and if all usages are allowed
 */
async function checkFunction(sourceFile, functionName, allowedFiles) {
  const usages = await findUsages(functionName);

  // Exclude test files, webpack bundles, and the source file itself (where the function is defined)
  const violations = usages.filter(
    file =>
      !file.includes(".test.") &&
      !file.includes(".webpack/") &&
      !file.includes(".bundle.js") &&
      !file.includes("CHANGELOG") &&
      file !== sourceFile &&
      !allowedFiles.includes(file),
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

  // First, find all export methods in the source files
  // Note: persistence.ts contains exportIdentitiesForPersistence function, not export* methods
  const sourceFiles = [
    join(idsDir, "UserId.ts"),
    join(idsDir, "DatadogId.ts"),
    join(idsDir, "DeviceId.ts"),
  ];
  
  // Also check persistence.ts for exportIdentitiesForPersistence function
  const persistenceFile = join(libDir, "src/store/persistence.ts");

  const allExportMethods = new Map(); // sourceFile -> [methodNames]

  for (const sourceFile of sourceFiles) {
    const methods = await extractExportMethods(sourceFile);
    if (methods.length > 0) {
      // Convert absolute path to relative path from root
      const relativePath = sourceFile.replace(rootDir + "/", "");
      allExportMethods.set(relativePath, methods);
    }
  }
  
  // Check persistence.ts for exportIdentitiesForPersistence
  const persistenceMethods = await extractExportMethods(persistenceFile);
  if (persistenceMethods.length > 0) {
    const relativePath = persistenceFile.replace(rootDir + "/", "");
    allExportMethods.set(relativePath, persistenceMethods);
  }

  // Collect all function checks
  const checks = [];

  // Check all methods found in source files
  for (const [sourceFile, methods] of allExportMethods.entries()) {
    const fileRules = rules[sourceFile] || {};
    
    for (const methodName of methods) {
      const allowedFiles = fileRules[methodName] || [];
      
      // If method is not in rules at all, it means it's not whitelisted
      if (!(methodName in fileRules)) {
        // Check if it's actually used
        const usages = await findUsages(methodName);
        
        // Exclude the source file itself and files in the same directory (internal usage)
        const sourceDir = dirname(sourceFile);
        const actualUsages = usages.filter(
          file =>
            !file.includes(".test.") &&
            !file.includes(".webpack/") &&
            !file.includes(".bundle.js") &&
            !file.includes("CHANGELOG") &&
            file !== sourceFile &&
            !file.startsWith(sourceDir + "/"), // Exclude internal usage within the same lib
        );
        
        if (actualUsages.length > 0) {
          console.error(`❌ Rule violation for ${methodName} (from ${sourceFile}):`);
          console.error(`   Method is used but not whitelisted in export-rules.json`);
          console.error(`   Found in: ${actualUsages.join(", ")}`);
          checks.push(Promise.resolve(false));
        }
      } else {
        // Method is in rules, check that all usages are allowed
        checks.push(checkFunction(sourceFile, methodName, allowedFiles));
      }
    }
  }

  // Also check methods explicitly listed in rules (for backwards compatibility)
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

      // Only check if not already checked above
      const sourceMethods = allExportMethods.get(sourceFile) || [];
      if (!sourceMethods.includes(functionName)) {
        checks.push(checkFunction(sourceFile, functionName, allowedFiles));
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
