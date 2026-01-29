/**
 * Reads rsdoctor JSON report and exits with code 1 if any E1001 (duplicate-package)
 * concerns a package not in the mobile allowlist. Use after `pnpm run doctor` so CI
 * fails on new duplicates.
 */
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { RSDOCTOR_DUPLICATE_PACKAGE_ALLOWLIST } from "../rsdoctor-duplicate-allowlist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const rsdoctorDir = path.join(repoRoot, "rsdoctor", "mobile");
const jsonPath = path.join(rsdoctorDir, "rsdoctor-data.json");
const allowlist = new Set(RSDOCTOR_DUPLICATE_PACKAGE_ALLOWLIST);

function getDuplicatePackageNamesFromFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
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
    if (!allowlist.has(name)) violations.add(name);
  }
  if (violations.size === 0) {
    console.log("check-rsdoctor-duplicates (mobile): no disallowed duplicate packages.");
    process.exit(0);
  }
  const sorted = Array.from(violations).sort();
  console.error(
    "check-rsdoctor-duplicates (mobile): E1001 duplicate-package not in allowlist:",
    sorted.join(", "),
  );
  console.error("Add to apps/ledger-live-mobile/rsdoctor-duplicate-allowlist.mjs if intentional.");
  process.exit(1);
}

main();
