import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Direct dependencies that are NOT redistributed in the published binary:
// build-time tooling, types, peer-only declarations tree-shaken out by bun.
// Anything else listed in apps/wallet-cli/package.json must appear in
// THIRD_PARTY_NOTICES.md so its upstream attribution clauses are honored.
const NON_REDISTRIBUTED = new Set([
  "@oxlint/binding-darwin-arm64",
  "@oxlint/binding-darwin-x64",
  "@oxlint/binding-linux-x64-gnu",
  "@oxlint/binding-win32-x64-msvc",
  "@types/debug",
  "@types/node",
  "@types/w3c-web-usb",
  "bun-types",
  "bunli",
  "oxfmt",
  "oxlint",
  "typescript",
]);

// First-party scopes: Ledger-owned workspace packages bundled as source under
// the same Apache-2.0 license as wallet-cli itself — not third-party.
const FIRST_PARTY_SCOPES = ["@ledgerhq/", "@shared/"];

const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const notices = await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");

const isFirstParty = name => FIRST_PARTY_SCOPES.some(scope => name.startsWith(scope));

const redistributed = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
].filter(name => !NON_REDISTRIBUTED.has(name) && !isFirstParty(name));

const mentionsPackage = name =>
  notices.includes(`| ${name} |`) || notices.includes(`\`${name}\``);

const missing = redistributed.filter(name => !mentionsPackage(name));

if (missing.length > 0) {
  console.error("THIRD_PARTY_NOTICES.md is missing the following redistributed dependencies:");
  for (const name of missing) {
    console.error(`  - ${name}`);
  }
  console.error(
    "\nEach direct dependency declared in apps/wallet-cli/package.json that ships",
  );
  console.error("inside the published binary must appear in THIRD_PARTY_NOTICES.md,");
  console.error("either as a markdown table row (`| package-name |`) or quoted in");
  console.error("backticks. If the new dep is build-only and not redistributed, add it");
  console.error("to the NON_REDISTRIBUTED set in this script.");
  process.exit(1);
}

console.log(`THIRD_PARTY_NOTICES.md covers all ${redistributed.length} redistributed dependencies.`);
