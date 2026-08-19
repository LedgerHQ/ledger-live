import { matchesGlob } from "node:path";

/** Normalise a path or glob to forward slashes. */
function normalizeSlashes(value: string): string {
  return value.split("\\").join("/");
}

/**
 * Match a repo-relative file against a `filter.file` glob — the single glob
 * matcher used everywhere in-process (PRD §5.2 subset: `*` within a path
 * segment, `**` across segments, `?` a single non-`/` char).
 *
 * Delegates to Node's `path.matchesGlob` (the same minimatch-style semantics the
 * runners use). Like the runners, `*` does not match dotfiles (`a/*.ts` ∌
 * `a/.b.ts`) — irrelevant here, since dotfiles are never collected as tests.
 */
export function matchGlob(pattern: string, file: string): boolean {
  return matchesGlob(normalizeSlashes(file), normalizeSlashes(pattern));
}

/** Cap on a `filter.file` glob length, so the generated RegExp source stays bounded. */
const MAX_GLOB_LENGTH = 512;

/**
 * Convert a `filter.file` glob to an UNANCHORED RegExp SOURCE (no `^`/`$`).
 *
 * This is the ONE place a glob→regex translation is still required: jest's
 * `--testPathIgnorePatterns` takes a regex string (not a glob), so whole-file
 * `skip` for jest must serialise the glob. All in-process matching uses
 * {@link matchGlob} instead. Callers anchor as needed (jest searches unanchored,
 * so the caller appends `$` to match the path tail).
 *
 * A run of `*` collapses to one wildcard (2+ crosses `/`, one does not) so the
 * source never contains adjacent unbounded quantifiers like `[^]*[^/]*`.
 */
export function globToRegExpSource(glob: string): string {
  const normalized = normalizeSlashes(glob);
  if (normalized.length > MAX_GLOB_LENGTH) {
    throw new Error(`filter.file glob too long (${normalized.length} > ${MAX_GLOB_LENGTH})`);
  }
  let out = "";
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === "*") {
      let runEnd = i;
      while (normalized[runEnd] === "*") runEnd += 1;
      const isDoubleStar = runEnd - i >= 2;
      i = runEnd - 1; // the for-loop's i += 1 advances past the run
      if (isDoubleStar) {
        if (normalized[i + 1] === "/") {
          // `**/` -> zero or more WHOLE path segments (segment-aware, matching
          // path.matchesGlob): `a/**/c.ts` matches `a/c.ts` and `a/x/c.ts` but
          // NOT `a/bc.ts`. Consume the slash so `c.ts` stays a full segment.
          out += "(?:[^]*/)?";
          i += 1;
        } else {
          out += "[^]*"; // trailing/inline ** -> anything incl. slashes
        }
      } else {
        out += "[^/]*"; // * -> anything except slash
      }
    } else if (ch === "?") {
      out += "[^/]";
    } else if ("\\^$.|+()[]{}".includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return out;
}
