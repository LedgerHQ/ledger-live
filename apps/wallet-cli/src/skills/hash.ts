// Canonical content-hashing for skills. Pure (no fs) so it is reusable at
// install time (registry.writeSkill), doctor time (registry.diagnoseSkill), and
// codegen time (scripts/generate-skills-manifest.mjs replicates the SAME
// algorithm inline — keep the two in sync).
//
// Canonical form: sort files by posix path, then sha256 over the concatenation
// of `path + "\0" + sha256(content) + "\n"` for each file. Hashing the
// per-file content digest (rather than raw content) keeps the combined input
// small and unambiguous regardless of file sizes or newlines.

import { createHash } from "node:crypto";

/** sha256 hex digest of a single string (one skill file's content). */
export function hashOne(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Canonical sha256 digest over a set of skill files. Order-independent: files
 * are sorted by their posix `path` before hashing.
 */
export function hashSkillFiles(files: { path: string; content: string }[]): string {
  // Plain code-unit comparison (not localeCompare) — must stay identical to the
  // inline sort in scripts/generate-skills-manifest.mjs so runtime and codegen
  // hashes agree.
  const sorted = [...files].sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
  const combined = createHash("sha256");
  for (const file of sorted) {
    combined.update(`${file.path}\0${hashOne(file.content)}\n`, "utf8");
  }
  return combined.digest("hex");
}
