/**
 * Reads rsdoctor JSON reports and exits with code 1 if any E1001 (duplicate-package)
 * concerns a package not in the desktop allowlist. Use after `pnpm run doctor` so CI
 * fails on new duplicates.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse allowlist from the .ts file (single source of truth)
const allowlistPath = path.join(__dirname, "rsdoctor-duplicate-allowlist.ts");
const allowlistRaw = fs.readFileSync(allowlistPath, "utf-8");
const match = allowlistRaw.match(
  /export const RSDOCTOR_DUPLICATE_PACKAGE_ALLOWLIST[^=]+=\s*\[([\s\S]*?)\];/m,
);
const allowlist = new Set(
  (match ? match[1] : "")
    .replace(/\/\*.*?\*\//g, "")
    .split(/[\n,]+/)
    .map(s => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean),
);

const lldRoot = path.resolve(__dirname, "..", "..");
const repoRoot = path.resolve(lldRoot, "..", "..");
const rsdoctorDir = path.join(repoRoot, "rsdoctor");

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
  if (!fs.existsSync(rsdoctorDir)) {
    console.error("rsdoctor dir not found:", rsdoctorDir);
    process.exit(1);
  }
  const entries = fs.readdirSync(rsdoctorDir, { withFileTypes: true });
  const desktopDirs = entries.filter(e => e.isDirectory() && e.name.startsWith("desktop-"));
  const violations = new Set();
  for (const dir of desktopDirs) {
    const jsonPath = path.join(rsdoctorDir, dir.name, "rsdoctor-data.json");
    if (!fs.existsSync(jsonPath)) continue;
    const names = getDuplicatePackageNamesFromFile(jsonPath);
    for (const name of names) {
      if (!allowlist.has(name)) violations.add(name);
    }
  }
  if (violations.size === 0) {
    console.log("check-rsdoctor-duplicates: no disallowed duplicate packages.");
    process.exit(0);
  }
  const sorted = Array.from(violations).sort();
  console.error(
    "check-rsdoctor-duplicates: E1001 duplicate-package not in allowlist:",
    sorted.join(", "),
  );
  console.error(
    "Add to apps/ledger-live-desktop/tools/rspack/rsdoctor-duplicate-allowlist.ts if intentional.",
  );
  process.exit(1);
}

main();
