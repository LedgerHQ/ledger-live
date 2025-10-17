#!/usr/bin/env node

import { exec } from "child_process";
import { resolve, relative } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);
const WORKSPACE_ROOT = resolve(process.cwd());

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: pnpm fix-files <files...>");
  process.exit(1);
}

// Resolve and filter files
const absoluteFiles = files
  .map(f => (f.startsWith("/") ? f : resolve(WORKSPACE_ROOT, f)))
  .filter(f => /\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(f));

if (absoluteFiles.length === 0) {
  console.log("No files to process");
  process.exit(0);
}

console.log(`Processing ${absoluteFiles.length} file(s)...`);
const startTime = Date.now();
let hasErrors = false;

// Step 1: Prettier
const prettierArgs = absoluteFiles.map(f => `"${f}"`).join(" ");
console.log("\nRunning Prettier...");
try {
  await execAsync(`pnpm prettier --write --log-level warn ${prettierArgs}`, {
    cwd: WORKSPACE_ROOT,
  });
} catch (error) {
  console.error("Prettier failed");
  hasErrors = true;
}

// Step 2: ESLint
const eslintArgs = absoluteFiles
  .filter(f => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f))
  .map(f => `"${f}"`)
  .join(" ");

if (eslintArgs) {
  console.log("\nRunning ESLint...");
  try {
    await execAsync(`pnpm eslint --fix --cache --no-error-on-unmatched-pattern ${eslintArgs}`, {
      cwd: WORKSPACE_ROOT,
    });
  } catch (error) {
    // Warnings are OK
  }
}

// Step 3: TypeCheck
const tsFiles = absoluteFiles.filter(f => /\.(ts|tsx)$/.test(f));

if (tsFiles.length === 0) {
  console.log("\nNo TypeScript files to typecheck");
} else {
  console.log("\nRunning TypeCheck...");

  // Get unique package paths
  const packagePaths = new Set(
    tsFiles
      .map(f => {
        const rel = relative(WORKSPACE_ROOT, f);
        const parts = rel.split("/");
        // Match patterns like libs/package-name, apps/package-name, tools/package-name, etc.
        if (parts.length >= 2) {
          return `${parts[0]}/${parts[1]}`;
        }
        return null;
      })
      .filter(Boolean),
  );

  if (packagePaths.size === 0) {
    console.log("No packages to typecheck");
  } else {
    const filters = Array.from(packagePaths)
      .map(path => `--filter=./${path}`)
      .join(" ");

    try {
      await execAsync(`pnpm turbo typecheck ${filters}`, { cwd: WORKSPACE_ROOT });
    } catch (error) {
      console.error("TypeCheck failed");
      hasErrors = true;
    }
  }
}

// Summary
const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\nCompleted in ${duration}s`);

if (hasErrors) {
  console.error("FAILED");
  process.exit(1);
} else {
  console.log("SUCCESS");
  process.exit(0);
}
