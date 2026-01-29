/**
 * Fails if any E1001 (duplicate-package) concerns a package in the blocklist.
 * Rsdoctor reports all dups as warnings; we only fail when a forbidden package is duplicated.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isBlocked } from "./rsdoctor-duplicate-blocklist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lldRoot = path.resolve(__dirname, "..", "..");
const repoRoot = path.resolve(lldRoot, "..", "..");
const rsdoctorDir = path.join(repoRoot, "rsdoctor");

function getDuplicatePackageNamesFromFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON in", filePath, ":", e.message);
    process.exit(1);
  }
  const errors = json.data?.errors ?? [];
  const names = [];
  for (const err of errors) {
    if (err.code !== "E1001") continue;
    const name = err.packages?.[0]?.target?.name;
    if (name) names.push(name);
  }
  return names;
}

function main() {
  if (!fs.existsSync(rsdoctorDir)) {
    console.error("rsdoctor dir not found:", rsdoctorDir);
    process.exit(1);
  }
  const entries = fs.readdirSync(rsdoctorDir, { withFileTypes: true });
  const desktopDirs = entries.filter(e => e.isDirectory() && e.name.startsWith("desktop-"));
  if (desktopDirs.length === 0) {
    console.error(
      "No desktop-* directories in",
      rsdoctorDir,
      "- Rsdoctor desktop build may not have run or produced output.",
    );
    process.exit(1);
  }
  const violations = new Set();
  for (const dir of desktopDirs) {
    const jsonPath = path.join(rsdoctorDir, dir.name, "rsdoctor-data.json");
    if (!fs.existsSync(jsonPath)) continue;
    const names = getDuplicatePackageNamesFromFile(jsonPath);
    for (const name of names) {
      if (isBlocked(name)) violations.add(name);
    }
  }
  if (violations.size === 0) {
    console.log("check-rsdoctor-duplicates: no forbidden package duplicated.");
    process.exit(0);
  }
  const sorted = Array.from(violations).sort();
  console.error(
    "check-rsdoctor-duplicates: E1001 duplicate-package in blocklist (must not be duplicated):",
    sorted.join(", "),
  );
  console.error(
    "See apps/ledger-live-desktop/tools/rspack/rsdoctor-duplicate-blocklist.mjs",
  );
  process.exit(1);
}

main();
