import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

/** The file that marks the monorepo root. */
const WORKSPACE_MARKER = "pnpm-workspace.yaml";

/**
 * Convert a path to forward slashes.
 *
 * Split/join rather than a regex: this is the only transformation involved, and
 * the tool deliberately avoids constructed patterns for anything path-related.
 */
export function toPosix(path: string): string {
  return path.split("\\").join("/");
}

/** Resolve symlinks, falling back to the input for paths that do not exist. */
function realPathOrSelf(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

/** Does this relative path climb out of the directory it was resolved against? */
function escapesRoot(relativePath: string): boolean {
  return relativePath === ".." || relativePath.startsWith("../");
}

/**
 * Express `path` relative to `repoRoot`, so the same test reported from macOS,
 * Linux and a Windows dev machine reduces to the same string.
 *
 * Test runners report real paths, while the configured root may still contain a
 * symlink — macOS resolves `/tmp` to `/private/tmp`, and checkouts under a
 * symlinked home directory behave the same way. When the naive result climbs
 * out of the root, the two disagree about symlinks rather than the file really
 * being outside the repo, so compare real paths before accepting that.
 */
export function toRepoRelative(path: string, repoRoot: string): string {
  const absolute = isAbsolute(path) ? path : resolve(process.cwd(), path);
  const direct = toPosix(relative(repoRoot, absolute));
  if (!escapesRoot(direct)) return direct;
  return toPosix(relative(realPathOrSelf(repoRoot), realPathOrSelf(absolute)));
}

/**
 * Walk up from `startDir` looking for the workspace marker.
 *
 * Returns `undefined` rather than guessing when the marker is absent — callers
 * fall back to the cwd, which keeps paths stable for a single-package checkout.
 */
export function findRepoRoot(startDir: string): string | undefined {
  let current = resolve(startDir);
  for (;;) {
    if (existsSync(join(current, WORKSPACE_MARKER))) return current;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/**
 * The repo root used to normalise every reported path.
 *
 * `QUARANTINE_REPO_ROOT` wins so a runner that spawns test processes from an
 * unexpected cwd can pin it explicitly.
 */
export function repoRoot(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string {
  return env.QUARANTINE_REPO_ROOT ?? findRepoRoot(cwd) ?? cwd;
}
