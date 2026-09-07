// Export the canonical wallet-cli skill in its standalone form.
//
// Run by .github/workflows/sync-wallet-cli-skill.yml to produce the copy published
// to LedgerHQ/agent-skills. It replaced an inline `sed` pipeline in that workflow so
// the published copy and the copy embedded in the binary go through the exact same
// transform (scripts/standalone-skill-transform.mjs) — keeping them byte-identical
// is the whole point, and two hand-synced implementations had already drifted.
//
// Usage:
//   node ./scripts/export-standalone-skill.mjs <source-skill-dir> <target-skill-dir>

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectSkillFiles } from "./collect-skill-files.mjs";
import { rewriteSkillFile } from "./standalone-skill-transform.mjs";

/** Files that must exist in the export — the workflow used to assert this in bash. */
const REQUIRED_FILES = ["SKILL.md", "references/business-logic.md"];

async function main() {
  const [sourceDir, targetDir] = process.argv.slice(2);
  if (!sourceDir || !targetDir) {
    throw new Error(
      "Usage: node ./scripts/export-standalone-skill.mjs <source-skill-dir> <target-skill-dir>",
    );
  }

  // Boundary is the skill dir, stricter than the generator's whole-skills-tree
  // one: this copy is public, so a link to another skill fails the sync loudly.
  const files = await collectSkillFiles(sourceDir, {
    boundary: sourceDir,
    label: path.basename(sourceDir),
  });

  const missing = REQUIRED_FILES.filter(required => !files.includes(required));
  if (missing.length > 0) {
    throw new Error(`Source skill at ${sourceDir} is missing: ${missing.join(", ")}.`);
  }

  // Replace rather than merge, so a file deleted upstream disappears downstream.
  await rm(targetDir, { recursive: true, force: true });

  for (const rel of files) {
    const content = await readFile(path.join(sourceDir, rel), "utf8");
    const target = path.join(targetDir, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, rewriteSkillFile(rel, content), "utf8");
  }

  console.log(`Exported ${files.length} file(s) to ${targetDir}.`);
}

await main();
