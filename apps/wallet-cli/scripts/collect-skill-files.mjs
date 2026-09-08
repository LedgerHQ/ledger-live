// Walk a skill directory and collect its files, refusing symlinks that escape.
//
// Shared by generate-skills-manifest.mjs (embeds the skill in the binary) and
// export-standalone-skill.mjs (publishes it to agent-skills). Both used to carry
// their own copy of this walk and only one copy had the guard.

import { lstat, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Recursively collect file paths under `dir`, relative to `dir` and posix-separated.
 *
 * A symlink is only accepted once `realpath` confirms it resolves to a regular file
 * inside `boundary` — otherwise its target's content would become part of a public
 * artifact (the npm binary, or the agent-skills repo).
 *
 * @param {string} dir Directory to walk.
 * @param {object} options
 * @param {string} options.boundary Directory every symlink target must resolve
 *   inside. Resolved here, so a symlinked ancestor (git worktree, `/tmp` on macOS)
 *   still compares correctly.
 * @param {string} [options.label] Path shown in errors instead of the absolute one.
 * @returns {Promise<string[]>} Skill-relative posix paths, unordered.
 */
export async function collectSkillFiles(dir, { boundary, label = dir }) {
  const boundaryReal = await realpath(boundary).catch(() => path.resolve(boundary));
  return walk(dir, dir, boundaryReal, label);
}

/**
 * @param {string} dir
 * @param {string} base
 * @param {string} boundaryReal
 * @param {string} label
 * @returns {Promise<string[]>}
 */
async function walk(dir, base, boundaryReal, label) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(base, abs).split(path.sep).join("/");
    const info = await lstat(abs);

    if (info.isSymbolicLink()) {
      const real = await realpath(abs).catch(() => null);
      if (real === null) {
        throw new Error(`Refusing to publish "${label}/${rel}": broken symlink.`);
      }
      if (real !== boundaryReal && !real.startsWith(boundaryReal + path.sep)) {
        throw new Error(
          `Refusing to publish "${label}/${rel}": symlink resolves outside ${boundaryReal} (${real}).`,
        );
      }
      // Refused even inside the boundary: descending would emit the same content
      // twice and a self-link would loop.
      const target = await stat(real);
      if (!target.isFile()) {
        throw new Error(`Refusing to publish "${label}/${rel}": symlink does not point to a file.`);
      }
      files.push(rel);
    } else if (info.isDirectory()) {
      files.push(...(await walk(abs, base, boundaryReal, label)));
    } else if (info.isFile()) {
      files.push(rel);
    }
    // Anything else (socket, fifo, device) can't be a skill file — skip it.
  }

  return files;
}
