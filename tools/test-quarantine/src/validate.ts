import { execFileSync } from "node:child_process";
import { loadRegistry, defaultRepoRoot, type LoadOptions } from "./load.ts";
import { fileMatches } from "./match.ts";
import type { LoadedEntry } from "./schema.ts";

/**
 * Registry-level checks for the `validate` and `expiry-check` subcommands
 * (PRD §9). `load.ts` already enforces the per-entry schema and drops expired
 * entries; these helpers add the cross-entry invariant (unique title-level
 * titles) and surface expiry for the nightly job.
 */

export interface ValidateResult {
  /** True when the registry has no problems. */
  ok: boolean;
  /** Human-readable problem descriptions (empty when ok). */
  problems: string[];
  /** Non-fatal advisories (e.g. a title that also exists in another test file). */
  warnings: string[];
  /** The active entries that were loaded (for diagnostics). */
  active: LoadedEntry[];
}

/**
 * Find test files (other than `excludeFile`) that contain `title` as a literal
 * substring — a heuristic for "this resolved title also exists in another test
 * file", which `--testNamePattern`/`--grep-invert` would skip too (PRD §9, §6.1).
 *
 * Uses `git grep` over the repo's spec/test files. Injectable for tests via
 * `grep`. Returns repo-relative paths; empty on any failure (never throws).
 */
export type TitleGrep = (title: string, repoRoot: string) => string[];

const defaultTitleGrep: TitleGrep = (title, repoRoot) => {
  try {
    const out = execFileSync(
      "git",
      [
        "grep",
        "-l",
        "--fixed-strings",
        "-e",
        title,
        "--",
        ":(glob)**/*.test.ts",
        ":(glob)**/*.test.tsx",
        ":(glob)**/*.spec.ts",
        ":(glob)**/*.spec.tsx",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    );
    return out
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);
  } catch {
    // git grep exits non-zero when there are no matches (or git unavailable).
    return [];
  }
};

/**
 * Per-PR validation (PRD §9): every entry parses against the schema (enforced
 * by `loadRegistry`, which throws) AND every title-level entry's resolved
 * `filter.title` is unique across the whole registry.
 *
 * Why unique titles matter: the runner exclusion flags (`--testNamePattern` /
 * `--grep-invert`) are title-only and global (PRD §6.1), so two entries sharing
 * a resolved title would skip the test in BOTH files — a silent over-skip. A
 * non-unique title-level title is therefore a broken quarantine that must not
 * merge.
 *
 * `titlePattern` entries are regexes (not literal titles) and are intentionally
 * NOT checked for cross-entry uniqueness — patterns are expected to overlap.
 */
export function validateRegistry(
  options: LoadOptions = {},
  titleGrep: TitleGrep = defaultTitleGrep,
): ValidateResult {
  const problems: string[] = [];
  const warnings: string[] = [];

  // loadRegistry throws on schema / YAML / bad-date errors — let that propagate
  // to the caller (the CLI converts it to a non-zero exit). We only add the
  // cross-entry checks here.
  const { active, expired } = loadRegistry(options);
  const all = [...active, ...expired];
  const repoRoot = options.repoRoot ?? defaultRepoRoot();

  // Unique title-level title check across the entire registry.
  const byTitle = new Map<string, LoadedEntry[]>();
  for (const loaded of all) {
    const { title } = loaded.entry.filter;
    if (title === undefined) continue; // file-only or titlePattern entries are exempt
    const bucket = byTitle.get(title) ?? [];
    bucket.push(loaded);
    byTitle.set(title, bucket);
  }
  for (const [title, bucket] of byTitle) {
    if (bucket.length > 1) {
      const sources = bucket.map(e => e.sourceRelative).join(", ");
      problems.push(
        `Non-unique title-level title ${JSON.stringify(title)} declared in ${bucket.length} ` +
          `entries (${sources}). Title exclusion is global, so this would skip the test in ` +
          `every matching file. Use distinct titles or a file-scoped titlePattern.`,
      );
    }
  }

  // Title-uniqueness ADVISORY (PRD §9, warn-level): a title-level entry whose
  // resolved `title` also appears in a test file OTHER than its `filter.file`
  // would be skipped in both by the global `--testNamePattern`/`--grep-invert`.
  // Warn (don't fail) — this is the documented §6.1 precision limit, and the
  // scoping fix only helps when the run's file set is resolvable.
  for (const loaded of all) {
    const { title, file } = loaded.entry.filter;
    if (title === undefined) continue;
    // Keep only hits that AREN'T the entry's own file. `file` may be a glob
    // (schema §5.2), so match glob-aware; the suffix tolerance covers a grep hit
    // that differs from the entry path by a leading segment.
    const hits = titleGrep(title, repoRoot).filter(f => {
      const n = f.split("\\").join("/");
      const entryFile = file.split("\\").join("/");
      const own = fileMatches(file, n) || n.endsWith(entryFile) || entryFile.endsWith(n);
      return !own;
    });
    if (hits.length > 0) {
      warnings.push(
        `Title ${JSON.stringify(title)} (entry ${loaded.sourceRelative}, file ${file}) also ` +
          `appears in ${hits.length} other test file(s): ${hits.join(", ")}. The global title ` +
          `exclusion would skip it there too — use a more specific title or run with explicit ` +
          `spec files so the wrapper can scope by file.`,
      );
    }
  }

  return { ok: problems.length === 0, problems, warnings, active };
}

export interface ExpiryCheckResult {
  /** True when no entry is past its expiry. */
  ok: boolean;
  /** The expired entries (empty when ok). */
  expired: LoadedEntry[];
}

/**
 * Nightly expiry check (PRD §9). Returns the entries whose `expiry` is in the
 * past so the scheduled job can fail and notify their owners. This is NOT a
 * per-PR gate — an unrelated team's stale entry must not block PRs.
 */
export function expiryCheck(options: LoadOptions = {}): ExpiryCheckResult {
  // Suppress the per-entry expiry warning loadRegistry would emit; we report
  // the expired set ourselves with owners.
  const { expired } = loadRegistry({ ...options, warn: () => {} });
  return { ok: expired.length === 0, expired };
}
