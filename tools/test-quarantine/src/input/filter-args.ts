import { isAbsolute, resolve } from "node:path";
import { toRepoRelative } from "../load.ts";
import { matchGlob, globToRegExpSource } from "../glob.ts";
import type { LoadedEntry } from "../schema.ts";

export type Runner = "jest" | "playwright" | "detox";

/** Escape a literal string for safe inclusion in a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Does an entry's `filter.file` (plain path or glob) match a repo-relative file? */
function entryFileMatches(filterFile: string, file: string): boolean {
  const normalized = file.split("\\").join("/");
  if (/[*?]/.test(filterFile)) return matchGlob(filterFile, normalized);
  const pattern = filterFile.split("\\").join("/");
  // Tolerate either side being a path-suffix of the other (repo-relative entry
  // vs a runner-relative listed file), matching filterSpecFiles' semantics.
  return pattern === normalized || normalized.endsWith(pattern) || pattern.endsWith(normalized);
}

/**
 * Scope title-level entries to a known run file set.
 *
 * `--testNamePattern` / `--grep-invert` are title-only and global, so an entry
 * targeting a DIFFERENT runner's spec (or another project's file) would
 * otherwise pollute this run's title pattern. When the caller can resolve the
 * files actually in this run (`runFiles`, repo-relative), keep only titled
 * entries whose `filter.file` matches one of them. `runFiles === undefined`
 * means the caller couldn't resolve a file set (config glob) — leave titled
 * entries unscoped (callers warn rather than silently over-skip).
 */
function scopeTitled(titled: LoadedEntry[], runFiles: string[] | undefined): LoadedEntry[] {
  if (runFiles === undefined) return titled;
  return titled.filter(e => runFiles.some(f => entryFileMatches(e.entry.filter.file, f)));
}

/** Split a `skip` entry set into file-only (whole-file) and title-level entries. */
function partition(entries: LoadedEntry[]): { fileOnly: LoadedEntry[]; titled: LoadedEntry[] } {
  const skipEntries = entries.filter(e => e.entry.mode === "skip");
  const fileOnly = skipEntries.filter(
    e => e.entry.filter.title === undefined && e.entry.filter.titlePattern === undefined,
  );
  const titled = skipEntries.filter(
    e => e.entry.filter.title !== undefined || e.entry.filter.titlePattern !== undefined,
  );
  return { fileOnly, titled };
}

/**
 * Build a single POSITIVE regex matching ANY of the quarantined titles (the
 * "drop-set"): the titles that should NOT run.
 *
 * A title is in the drop-set when it matches a quarantined entry the SAME way
 * the shared matcher does (match.ts):
 *   - `filter.title`        -> EXACT full-name equality  => anchor end `...$`
 *   - `filter.titlePattern` -> regex .test() (substring) => match anywhere
 *
 * This is consumed two ways depending on the runner's flag polarity:
 *   - Playwright `--grep-invert <P>` runs tests whose title does NOT match P,
 *     so it takes this drop-set pattern directly.
 *   - Jest/Detox `--testNamePattern <P>` runs tests whose title DOES match P,
 *     so they wrap it in a negative lookahead (see `buildTitleExclusionPattern`).
 */
function buildTitleDropPattern(titled: LoadedEntry[]): string | undefined {
  if (titled.length === 0) {
    return undefined;
  }
  const alternatives = titled.map(e => {
    const { title, titlePattern } = e.entry.filter;
    if (title !== undefined) {
      // Exact match: anchor both ends (mirrors match.ts `filter.title === title`).
      // The leading `^` matters for Playwright's `--grep-invert`, which tests the
      // pattern unanchored — without it `title: "Foo"` would also drop "xFoo".
      return `(?:^${escapeRegExp(title)}$)`;
    }
    // Substring pattern (`.test()` semantics). The leading `.*` lets it match
    // anywhere inside jest's `^(?!…)` lookahead; inert for the unanchored grep-invert.
    // Group the pattern so a top-level alternation stays scoped: `.*(?:a|b)`, not `.*a|b`.
    return `(?:.*(?:${titlePattern as string}))`;
  });
  return `(?:${alternatives.join("|")})`;
}

/**
 * Build a negative-lookahead `--testNamePattern` regex (the "keep" pattern):
 * matches every title EXCEPT the quarantined ones, so a positive-match runner
 * (Jest/Detox `--testNamePattern`) runs everything else.
 *
 * `--testNamePattern` is title-only and global (PRD §6.1 precision limit): an
 * identical resolved title in two files is skipped in both.
 */
function buildTitleExclusionPattern(titled: LoadedEntry[]): string | undefined {
  const dropPattern = buildTitleDropPattern(titled);
  if (dropPattern === undefined) {
    return undefined;
  }
  // The whole name is anchored at start; the drop-set's alternatives supply
  // their own end anchoring (literals end with `$`, patterns are open via `.*`).
  return `^(?!${dropPattern}).*$`;
}

export interface JestFilterArgs {
  /** Args appended to the jest invocation. */
  args: string[];
}

/**
 * Jest input filtering (PRD §6.1):
 * - whole-file `skip` entries -> `--testPathIgnorePatterns <regex>`
 * - title-level `skip` entries -> negative `--testNamePattern`
 *
 * `runFiles` (repo-relative, optional) scopes title-level entries to the files
 * actually in this run: a title entry whose `filter.file`
 * isn't among them (e.g. a Playwright/other-project spec) does NOT contribute
 * to the jest pattern. Omit `runFiles` to keep the legacy global behaviour.
 */
export function buildJestFilterArgs(entries: LoadedEntry[], runFiles?: string[]): JestFilterArgs {
  const { fileOnly, titled } = partition(entries);
  const args: string[] = [];

  for (const e of fileOnly) {
    // `--testPathIgnorePatterns` values are regexes matched unanchored against
    // the test path. Escape a plain path; convert a glob to its regex equivalent
    // (PRD §5.2 allows glob `filter.file`). Anchor the END (`$`) so `a.test.ts`
    // matches the path tail exactly and not `a.test.tsx`; the start stays
    // unanchored so the leading directories of the absolute path still match.
    const pattern = e.entry.filter.file;
    const source = /[*?]/.test(pattern)
      ? `${globToRegExpSource(pattern)}$`
      : `${escapeRegExp(pattern)}$`;
    args.push("--testPathIgnorePatterns", source);
  }

  const titlePattern = buildTitleExclusionPattern(scopeTitled(titled, runFiles));
  if (titlePattern) {
    args.push("--testNamePattern", titlePattern);
  }

  return { args };
}

export interface PlaywrightFilterArgs {
  args: string[];
}

/**
 * Playwright input filtering (PRD §6.1):
 * - title-level `skip` entries -> `--grep-invert <regex>`
 * - whole-file `skip` entries -> a `--grep-invert` over the file path is not
 *   reliable, so callers should drop those files from the passed file list
 *   (see `filterSpecFiles`). Here we only emit the title exclusion.
 *
 * `runFiles` (repo-relative, optional) scopes title-level entries to the specs
 * actually in this run, so a jest/other-project title entry
 * doesn't pollute the Playwright `--grep-invert`. Omit to keep global behaviour.
 */
export function buildPlaywrightFilterArgs(
  entries: LoadedEntry[],
  runFiles?: string[],
): PlaywrightFilterArgs {
  const { titled } = partition(entries);
  const args: string[] = [];
  // `--grep-invert <P>` runs tests whose title does NOT match P, so it takes the
  // POSITIVE drop-set pattern directly (NOT the jest-style negative lookahead —
  // that would invert the selection and run exactly the quarantined tests).
  const dropPattern = buildTitleDropPattern(scopeTitled(titled, runFiles));
  if (dropPattern) {
    args.push("--grep-invert", dropPattern);
  }
  return { args };
}

// Playwright CLI flags that consume the FOLLOWING token as their value (space
// form, e.g. `--project mocked_tests`). Their value must not be mistaken for a
// spec-file positional. The `--flag=value` form needs no entry here.
export const PW_VALUE_FLAGS = new Set([
  "--project",
  "--workers",
  "-j",
  "--retries",
  "--repeat-each",
  "--grep",
  "-g",
  "--grep-invert",
  "--reporter",
  "--config",
  "-c",
  "--output",
  "--timeout",
  "--global-timeout",
  "--max-failures",
  "--shard",
  "--trace",
]);

/**
 * Apply file-only `skip` entries to a Playwright invocation by dropping matching
 * spec-file positionals from the args (Playwright has no path-based
 * `--grep-invert`, so a whole-file skip can only be honored by removing the spec
 * path before launch — mirrors how Detox uses `filterSpecFiles`).
 *
 * We touch ONLY explicit spec-file positionals: args that are not the `test`
 * subcommand, not a `--flag`/`--flag=val`, and not the value of a space-form
 * value flag (`PW_VALUE_FLAGS`). Each positional is resolved (against `cwd`,
 * the runner's working dir) and relativized to `repoRoot` so it matches the
 * repo-relative `filter.file` contract; `buildPlaywrightFilterArgs` (titled ->
 * `--grep-invert`) is unaffected.
 *
 * If file-only skip entries are active but NO explicit spec files were passed
 * (Playwright globs from its config), the wrapper cannot filter — it `warn`s
 * loudly rather than silently running the quarantined file.
 */
interface SpecFilterOptions {
  /** Space-form flags whose following token is a value, not a spec positional. */
  valueFlags: Set<string>;
  /** Lowercase runner tag used in the `[test-quarantine] <tag>:` warning. */
  label: string;
  /** Capitalised runner name used in the warning body ("Playwright"/"Detox"). */
  displayName: string;
  cwd?: string;
  warn?: (message: string) => void;
}

/**
 * Drop whole-file `skip` spec-file positionals from a `<runner> test …` arg list
 * (Playwright and Detox share this exact shape — neither has a path-based
 * exclusion flag, so a whole-file skip is honored by removing the spec path
 * before launch). We touch ONLY explicit spec-file positionals: args that are
 * not the `test` subcommand, not a `--flag`/`--flag=val`, and not the value of a
 * space-form value flag (`valueFlags`). Each positional is resolved against
 * `cwd` (the runner's working dir) and relativised to `repoRoot` to match the
 * repo-relative `filter.file` contract.
 *
 * If file-only skip entries are active but NO explicit spec files were passed
 * (the runner globs from its config), we can't filter — `warn` loudly rather
 * than silently run the quarantined file (title-level skips still apply).
 */
function dropSkippedSpecPositionals(
  args: string[],
  active: LoadedEntry[],
  repoRoot: string,
  opts: SpecFilterOptions,
): string[] {
  const cwd = opts.cwd ?? process.cwd();
  const warn = opts.warn ?? (msg => console.warn(msg));
  const fileOnly = partition(active).fileOnly;
  if (fileOnly.length === 0) return args;

  const isPositionalSpec = (arg: string, prev: string | undefined): boolean => {
    if (arg === "test") return false; // the runner subcommand, not a spec
    if (arg.startsWith("-")) return false;
    if (prev !== undefined && opts.valueFlags.has(prev)) return false; // value of a space-form flag
    return true;
  };

  const specPositions: number[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (isPositionalSpec(args[i], i > 0 ? args[i - 1] : undefined)) specPositions.push(i);
  }

  if (specPositions.length === 0) {
    warn(
      `[test-quarantine] ${opts.label}: ${fileOnly.length} whole-file skip entry(ies) NOT applied — ` +
        `no explicit spec files were passed, so ${opts.displayName} globs from its config and the ` +
        `wrapper cannot drop them. Affected: ${fileOnly.map(e => e.sourceRelative).join(", ")}.`,
    );
    return args;
  }

  // Normalise each positional to a repo-relative path so it matches the
  // repo-relative `filter.file` contract (mirrors the parse normalisation).
  const specs = specPositions.map(pos => {
    const abs = isAbsolute(args[pos]) ? args[pos] : resolve(cwd, args[pos]);
    return { pos, repoRel: toRepoRelative(repoRoot, abs) };
  });
  const keptRepoRel = new Set(
    filterSpecFiles(
      active,
      specs.map(s => s.repoRel),
    ),
  );

  const droppedPositions = new Set(specs.filter(s => !keptRepoRel.has(s.repoRel)).map(s => s.pos));
  if (droppedPositions.size === 0) return args;
  return args.filter((_, i) => !droppedPositions.has(i));
}

/** Apply file-only `skip` entries to a Playwright `test …` invocation. */
export function filterPlaywrightSpecArgs(
  args: string[],
  active: LoadedEntry[],
  repoRoot: string,
  cwd: string = process.cwd(),
  warn: (message: string) => void = msg => console.warn(msg),
): string[] {
  return dropSkippedSpecPositionals(args, active, repoRoot, {
    valueFlags: PW_VALUE_FLAGS,
    label: "playwright",
    displayName: "Playwright",
    cwd,
    warn,
  });
}

/**
 * Filter a controlled spec-file list, dropping whole-file `skip` entries.
 *
 * Used for Detox (the `$SHARD_TEST_FILES` list in `scripts/e2e-ci.mjs`) and for
 * Playwright whole-file skips. Title-level Detox entries are handled by
 * `--testNamePattern` (see `buildDetoxFilterArgs`).
 */
export function filterSpecFiles(entries: LoadedEntry[], files: string[]): string[] {
  const { fileOnly } = partition(entries);
  if (fileOnly.length === 0) {
    return files;
  }
  return files.filter(file => {
    const normalized = file.split("\\").join("/");
    return !fileOnly.some(e => {
      const pattern = e.entry.filter.file;
      if (/[*?]/.test(pattern)) {
        // reuse the shared glob matcher
        return matchGlob(pattern, normalized);
      }
      return pattern.split("\\").join("/") === normalized || normalized.endsWith(pattern);
    });
  });
}

export interface DetoxFilterArgs {
  args: string[];
}

/**
 * Detox title-level input filtering: negative `--testNamePattern` (jest under
 * the hood). `runFiles` (repo-relative, optional) scopes title-level entries to
 * the specs actually in this run, exactly like the jest path,
 * so a jest/playwright/other-project title entry doesn't pollute the pattern.
 */
export function buildDetoxFilterArgs(entries: LoadedEntry[], runFiles?: string[]): DetoxFilterArgs {
  const { titled } = partition(entries);
  const args: string[] = [];
  const titlePattern = buildTitleExclusionPattern(scopeTitled(titled, runFiles));
  if (titlePattern) {
    args.push("--testNamePattern", titlePattern);
  }
  return { args };
}

// Detox CLI flags that consume the FOLLOWING token as their value (space form),
// so the value isn't mistaken for a spec-file positional (e.g. `--retries 1`,
// `--record-logs failing`). Covers both detox-owned flags and the jest-bound
// flags detox forwards. The `--flag=value` form needs no entry here.
export const DETOX_VALUE_FLAGS = new Set([
  "-c",
  "--configuration",
  "-a",
  "--artifacts-location",
  "--loglevel",
  "--record-logs",
  "--take-screenshots",
  "--record-videos",
  "--record-performance",
  "--capture-view-hierarchy",
  "--device-name",
  "--device-boot-args",
  "--app-launch-args",
  "--retries",
  "--shard",
  "--testNamePattern",
  "-t",
  "--outputFile",
  "-o",
  "--maxWorkers",
  "-w",
]);

/**
 * Apply file-only `skip` entries to a Detox `test …` invocation (Detox = jest
 * under the hood; same positional-dropping shape as Playwright — see
 * {@link filterPlaywrightSpecArgs}). Title-level Detox skips are handled by
 * `--testNamePattern` (see `buildDetoxFilterArgs`).
 */
export function filterDetoxSpecArgs(
  args: string[],
  active: LoadedEntry[],
  repoRoot: string,
  cwd: string = process.cwd(),
  warn: (message: string) => void = msg => console.warn(msg),
): string[] {
  return dropSkippedSpecPositionals(args, active, repoRoot, {
    valueFlags: DETOX_VALUE_FLAGS,
    label: "detox",
    displayName: "Detox",
    cwd,
    warn,
  });
}
