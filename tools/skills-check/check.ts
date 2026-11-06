#!/usr/bin/env node
// Usage: pnpm skills:check
// Fails on drift in .agents/**, docs/**, AGENTS.md and layer READMEs. Codes and rules: rules.ts
// (CHECK_CODES). waivers.json lists paths a doc names on purpose although they do not exist.
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkRepo,
  formatFinding,
  listFiles,
  waiversFromParsedJson,
  type Waiver,
} from "./rules.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const waiversPath = resolve(here, "waivers.json");
const files = listFiles(root);
const waiversFile = relative(root, waiversPath);
const waivers: Waiver[] = waiversFromParsedJson(JSON.parse(readFileSync(waiversPath, "utf8")));
const findings = checkRepo(root, {
  files,
  waivers,
  waiversFile,
});

for (const finding of findings) console.error(formatFinding(finding));
if (findings.length > 0) {
  console.error(`\nskills:check found ${findings.length} problem(s) in ${files.length} files.`);
  process.exit(1);
}
console.log(`skills:check passed on ${files.length} files.`);
