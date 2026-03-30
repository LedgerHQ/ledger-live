#!/usr/bin/env node
/**
 * Rebuild node-hid and usb native addons with node-gyp.
 * Use when you need CLI or Desktop device (USB) support and install skipped
 * building these (e.g. due to onlyBuiltDependencies).
 */
import { execSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..", "..");
const pnpmNodeModules = join(root, "node_modules", ".pnpm");

function findPackageDir(name) {
  if (!existsSync(pnpmNodeModules)) return null;
  for (const entry of readdirSync(pnpmNodeModules)) {
    if (entry === name || entry.startsWith(`${name}@`)) {
      const pkgDir = join(pnpmNodeModules, entry, "node_modules", name);
      if (existsSync(join(pkgDir, "binding.gyp"))) return pkgDir;
    }
  }
  return null;
}

function rebuild(name) {
  const dir = findPackageDir(name);
  if (!dir) {
    console.warn(
      `rebuild-device-deps: ${name} not found under node_modules/.pnpm, skipping.`,
    );
    return;
  }
  console.log(`Building ${name} in ${dir}...`);
  execSync("node-gyp rebuild", { cwd: dir, stdio: "inherit" });
}

rebuild("node-hid");
rebuild("usb");
