#!/usr/bin/env node
// Usage: pnpm skills:check
// Fails when a skill, agent or doc drifts: broken frontmatter, Cursor rule keys, a skill description
// without what and when, a relative link or a backticked repo path that no longer resolves.
// waivers.json lists the paths a doc names on purpose although they do not exist.
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
