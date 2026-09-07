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

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { rewriteSkillFile } from "./standalone-skill-transform.mjs";

/** Files that must exist in the export — the workflow used to assert this in bash. */
const REQUIRED_FILES = ["SKILL.md", "references/business-logic.md"];

/** Recursively collect skill-relative posix paths under `dir`. */
async function collectFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    // Follow symlinks as leaves (in-repo `references/safety.md` is one) rather than
    // descending into them, mirroring generate-skills-manifest.mjs.
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(abs, base)));
    } else {
      files.push(path.relative(base, abs).split(path.sep).join("/"));
    }
  }
  return files;
}

async function main() {
  const [sourceDir, targetDir] = process.argv.slice(2);
  if (!sourceDir || !targetDir) {
    throw new Error(
      "Usage: node ./scripts/export-standalone-skill.mjs <source-skill-dir> <target-skill-dir>",
    );
  }

  const files = await collectFiles(sourceDir);

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
