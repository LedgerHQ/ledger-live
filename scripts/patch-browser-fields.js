#!/usr/bin/env node

/**
 * This script removes the "browser" field from specific packages in node_modules.
 * This forces bundlers (esbuild, Vite) to use the "main" entry point instead,
 * which allows proper tree-shaking and significantly reduces bundle size.
 *
 * Run after pnpm install.
 */

const fs = require("fs");
const path = require("path");

// Packages to patch - these ship pre-bundled minified browser builds
// that cannot be tree-shaken
const PACKAGES_TO_PATCH = [
  "@stellar/stellar-sdk", // browser → dist/stellar-sdk.min.js (~936KB) vs main → lib/index.js
  "@stellar/stellar-base", // browser → dist/stellar-base.min.js (~442KB) vs main → lib/index.js
  "web3", // browser → dist/web3.min.js (~1.36MB) vs main → lib/index.js
  "icon-sdk-js", // browser → build/icon-sdk-js.web.min.js (~2.74MB) vs main → build/icon-sdk-js.node.min.js
  "casper-js-sdk", // browser → dist/lib.web.js (~1.03MB) vs main → dist/lib.node.js
  "algosdk", // browser → dist/browser/algosdk.min.js (~406KB) vs main → dist/cjs/index.js
  "@solana/web3.js", // browser → lib/index.browser.esm.js (~321KB) vs main → lib/index.cjs.js
];

function findPackageDirs(packageName) {
  const pnpmDir = path.join(__dirname, "..", "node_modules", ".pnpm");
  const dirs = [];

  if (!fs.existsSync(pnpmDir)) {
    return dirs;
  }

  // pnpm uses a flat structure like: .pnpm/@stellar+stellar-sdk@14.0.0/node_modules/@stellar/stellar-sdk
  const entries = fs.readdirSync(pnpmDir);
  const escapedName = packageName.replace("/", "+").replace("@", "");
  const prefix = packageName.startsWith("@")
    ? packageName.replace("/", "+")
    : packageName;

  for (const entry of entries) {
    if (entry.startsWith(prefix + "@") || entry.startsWith(escapedName + "@")) {
      const packagePath = path.join(pnpmDir, entry, "node_modules", packageName);
      if (fs.existsSync(packagePath)) {
        dirs.push(packagePath);
      }
    }
  }

  return dirs;
}

function patchPackage(packageDir) {
  const packageJsonPath = path.join(packageDir, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const content = fs.readFileSync(packageJsonPath, "utf-8");
  const pkg = JSON.parse(content);

  let modified = false;

  // Remove top-level browser field
  if (pkg.browser) {
    console.log(`  Removing "browser": "${pkg.browser}"`);
    delete pkg.browser;
    modified = true;
  }

  // Remove browser from exports
  if (pkg.exports && typeof pkg.exports === "object") {
    const removeBrowserFromExports = (obj, path = "exports") => {
      if (obj && typeof obj === "object") {
        if (obj.browser) {
          console.log(`  Removing "${path}.browser": "${obj.browser}"`);
          delete obj.browser;
          modified = true;
        }
        for (const [key, val] of Object.entries(obj)) {
          if (val && typeof val === "object") {
            removeBrowserFromExports(val, `${path}.${key}`);
          }
        }
      }
    };
    removeBrowserFromExports(pkg.exports);
  }

  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  return modified;
}

console.log("Patching browser fields in node_modules...\n");

let patchedCount = 0;

for (const packageName of PACKAGES_TO_PATCH) {
  const dirs = findPackageDirs(packageName);

  if (dirs.length === 0) {
    console.log(`[SKIP] ${packageName} - not found in node_modules`);
    continue;
  }

  for (const dir of dirs) {
    console.log(`[PATCH] ${packageName}`);
    console.log(`  Path: ${dir}`);
    if (patchPackage(dir)) {
      patchedCount++;
    } else {
      console.log("  No browser field found");
    }
  }
}

console.log(`\nDone! Patched ${patchedCount} package(s).`);

