#!/usr/bin/env node
// Usage: pnpm skills:check
// Fails on drift in .agents/**, docs/**, AGENTS.md and layer READMEs. Codes and rules: rules.mjs
// (CHECK_CODES). waivers.json lists paths a doc names on purpose although they do not exist.
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRepo, formatFinding, listFiles } from "./rules.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const waiversPath = resolve(here, "waivers.json");
const files = listFiles(root);
const findings = checkRepo(root, {
  files,
  waivers: JSON.parse(readFileSync(waiversPath, "utf8")),
  waiversFile: relative(root, waiversPath),
});

for (const finding of findings) console.error(formatFinding(finding));
if (findings.length > 0) {
  console.error(`\nskills:check found ${findings.length} problem(s) in ${files.length} files.`);
  process.exit(1);
}
console.log(`skills:check passed on ${files.length} files.`);
