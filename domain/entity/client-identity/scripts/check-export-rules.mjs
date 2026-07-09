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
const rootDir = join(libDir, "../../..");

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

async function extractExportMethods(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const exportMethodRegex = /export\w+For\w+\s*\(\)\s*:/g;
    const matches = content.match(exportMethodRegex);
    if (!matches) return [];
    return matches.map(match => match.replace(/\s*\(\)\s*:$/, ""));
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}:`, error.message);
    return [];
  }
}

async function findUsages(functionName) {
  try {
    const { stdout } = await execAsync(
      `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=lib --exclude-dir=lib-es --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=build --exclude-dir=generated --exclude-dir=dist --exclude-dir=.expo --exclude-dir=.claude -l "${functionName}" .`,
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
    return [];
  }
}

async function checkFunction(sourceFile, functionName, allowedFiles, rules) {
  const usages = await findUsages(functionName);

  const idDefinitionFiles = Object.keys(rules).filter(
    key => key.startsWith("domain/entity/client-identity/src/ids/") && key.endsWith(".ts"),
  );
  const finalAllowedFiles = [...new Set([sourceFile, ...idDefinitionFiles, ...allowedFiles])];

  const violations = usages.filter(
    file =>
      !file.includes(".test.") &&
      !file.includes(".webpack/") &&
      !file.includes(".bundle.js") &&
      !file.includes(".next/") &&
      !file.includes("/build/") &&
      !file.includes("/generated/") &&
      !file.includes("CHANGELOG") &&
      !file.split("/").some(seg => seg.startsWith("types-")) &&
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

  const sourceFiles = Object.keys(rules).map(relativePath => join(rootDir, relativePath));

  const allExportMethods = new Map();

  for (const sourceFile of sourceFiles) {
    const methods = await extractExportMethods(sourceFile);
    if (methods.length > 0) {
      const relativePath = sourceFile.replace(rootDir + "/", "");
      allExportMethods.set(relativePath, methods);
    }
  }

  const checks = [];

  for (const [sourceFile, methods] of allExportMethods.entries()) {
    for (const methodName of methods) {
      let allowedFiles = [];
      for (const [, ruleMethods] of Object.entries(rules)) {
        if (ruleMethods[methodName]) {
          allowedFiles = ruleMethods[methodName];
          break;
        }
      }

      if (allowedFiles.length === 0) {
        const usages = await findUsages(methodName);
        const sourceDir = dirname(sourceFile);
        const actualUsages = usages.filter(
          file =>
            !file.includes(".test.") &&
            !file.includes(".webpack/") &&
            !file.includes(".bundle.js") &&
            !file.includes(".next/") &&
            !file.includes("/build/") &&
            !file.includes("/generated/") &&
            !file.includes("CHANGELOG") &&
            !file.split("/").some(seg => seg.startsWith("types-")) &&
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
        checks.push(checkFunction(sourceFile, methodName, allowedFiles, rules));
      }
    }
  }

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
