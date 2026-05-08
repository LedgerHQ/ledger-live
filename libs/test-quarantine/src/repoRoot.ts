import fs from "fs";
import path from "path";

/**
 * Walks parents from `startPath` until `pnpm-workspace.yaml` is found.
 */
export function findRepoRoot(startPath: string = process.cwd()): string {
  let dir = path.resolve(startPath);
  for (;;) {
    const marker = path.join(dir, "pnpm-workspace.yaml");
    if (fs.existsSync(marker)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `[test-quarantine] Could not find monorepo root (pnpm-workspace.yaml) starting from ${startPath}`,
      );
    }
    dir = parent;
  }
}
