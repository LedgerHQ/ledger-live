/**
 * Fails if any E1001 (duplicate-package) concerns a package in the blocklist.
 * Rsdoctor reports all dups as warnings; we only fail when a forbidden package is duplicated.
 */
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isBlocked } from "../rsdoctor-duplicate-blocklist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const rsdoctorDir = path.join(repoRoot, "rsdoctor", "mobile");
const jsonPath = path.join(rsdoctorDir, "rsdoctor-data.json");

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
  if (!fs.existsSync(jsonPath)) {
    console.error("rsdoctor mobile report not found:", jsonPath);
    process.exit(1);
  }
  const names = getDuplicatePackageNamesFromFile(jsonPath);
  const violations = new Set();
  for (const name of names) {
    if (isBlocked(name)) violations.add(name);
  }
  if (violations.size === 0) {
    console.log("check-rsdoctor-duplicates (mobile): no forbidden package duplicated.");
    process.exit(0);
  }
  const sorted = Array.from(violations).sort();
  console.error(
    "check-rsdoctor-duplicates (mobile): E1001 duplicate-package in blocklist (must not be duplicated):",
    sorted.join(", "),
  );
  console.error("See apps/ledger-live-mobile/rsdoctor-duplicate-blocklist.mjs");
  process.exit(1);
}

main();
