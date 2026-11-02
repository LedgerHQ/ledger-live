#!/usr/bin/env node
// Usage: pnpm skills:check
// Fails when a skill, agent or doc drifts: broken frontmatter, Cursor rule keys, a skill description
// without what and when, a relative link or a backticked repo path that no longer resolves.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRepo, formatFinding, listFiles } from "./rules.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const files = listFiles(root);
const findings = checkRepo(root, files);

for (const finding of findings) console.error(formatFinding(finding));
if (findings.length > 0) {
  console.error(`\nskills:check found ${findings.length} problem(s) in ${files.length} files.`);
  process.exit(1);
}
console.log(`skills:check passed on ${files.length} files.`);
