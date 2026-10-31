import { createRequire } from "node:module";
import path from "node:path";
import { git } from "./git.js";
import { createRevision } from "./revision.js";
import { compare } from "./text.js";

/** @import { Branch, Change, ChangeStatus, Commits } from "./types.js" */

/** @type {Partial<Record<string, ChangeStatus>>} */
const STATUS_OF = { A: "added", M: "modified", T: "modified", D: "deleted" };

/**
 * What a branch changes between its head and its base: the given one, or the head's merge base with the base
 * branch, and both commits to read files from. Run from anywhere inside the repository.
 * @param {{ cwd: string, base?: string, head?: string, baseBranch?: string, stripScope?: string }} options
 * @returns {Branch}
 */
export function readBranch({
  cwd,
  base,
  head = "HEAD",
  baseBranch = "origin/develop",
  stripScope = "@ledgerhq/",
}) {
  const repo = git(["rev-parse", "--show-toplevel"], cwd).trim();
  const ts = loadTypeScript(repo);
  const headCommit = git(["rev-parse", head], repo).trim();
  /** @type {Commits} */
  const commits = base
    ? { base: git(["rev-parse", base], repo).trim(), head: headCommit }
    : {
        base: git(["merge-base", baseBranch, headCommit], repo).trim(),
        head: headCommit,
        baseBranch,
      };
  return {
    commits,
    changes: readChanges(repo, commits.base, commits.head),
    revisions: {
      base: createRevision({ repo, rev: commits.base, ts, stripScope }),
      head: createRevision({ repo, rev: commits.head, ts, stripScope }),
    },
  };
}

/**
 * The repository's own TypeScript, so imports resolve as its build does; this package's otherwise.
 * @param {string} repo
 * @returns {typeof import("typescript")}
 */
function loadTypeScript(repo) {
  try {
    return createRequire(path.join(repo, "package.json"))("typescript");
  } catch {
    return createRequire(import.meta.url)("typescript");
  }
}

/**
 * Files changed between the two commits, renames counted as a deletion and an addition, sorted by path.
 * @param {string} repo
 * @param {string} base
 * @param {string} head
 */
function readChanges(repo, base, head) {
  const fields = git(["diff", "--name-status", "--no-renames", "-z", base, head], repo)
    .split("\0")
    .filter(Boolean);
  /** @type {Map<string, Change>} */
  const result = new Map();
  for (let i = 0; i < fields.length; i += 2) {
    const status = STATUS_OF[fields[i][0]];
    if (status) result.set(fields[i + 1], { rel: fields[i + 1], status });
  }
  return new Map([...result].sort(([a], [b]) => compare(a, b)));
}
