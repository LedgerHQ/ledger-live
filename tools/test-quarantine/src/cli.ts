import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, isAbsolute, relative } from "node:path";
import { loadRegistry, defaultRepoRoot } from "./load.ts";
import {
  buildJestFilterArgs,
  buildPlaywrightFilterArgs,
  buildDetoxFilterArgs,
  filterPlaywrightSpecArgs,
  filterDetoxSpecArgs,
  PW_VALUE_FLAGS,
  DETOX_VALUE_FLAGS,
  type Runner,
} from "./input/filter-args.ts";
import { parseJestString } from "./output/parse-jest.ts";
import { parsePlaywrightString } from "./output/parse-playwright.ts";
import { applyExitGate } from "./output/exit-gate.ts";
import { mergeFlakeRecords, collapseAttemptsToFinal } from "./reporters/detox-flake-reporter.ts";
import { reduceFlakes } from "./flake/reduce.ts";
import { reportFlakes } from "./flake/report.ts";
import { validateRegistry, expiryCheck } from "./validate.ts";
import { classifyScript, ALLOWLISTED_SCRIPT_NAMES } from "./scripts-scan.ts";
import type { TestRecord, LoadedEntry } from "./schema.ts";

/** Shared per-run state handed to a runner adapter. */
interface WrapContext {
  runnerArgs: string[];
  active: LoadedEntry[];
  /** repo-relative files in this run, for title scoping (undefined if unknown). */
  runFiles: string[] | undefined;
  jsonOut: string;
  flakeDir: string;
  repoRoot: string;
}

/**
 * A runner adapter localises everything runner-specific (bin, run-file
 * resolution, input filtering + machine-readable output, result parsing, flake
 * source) so `runWrapper` stays linear and adding a runner is one object.
 */
interface RunnerAdapter {
  /** Default bin (overridable via QUARANTINE_RUNNER_BIN_<RUNNER>). */
  bin: string;
  /** Repo-relative files in this run, for title scoping (undefined if none). */
  resolveRunFiles(runnerArgs: string[], repoRoot: string): string[] | undefined;
  /** Inject skip filters + force machine-readable output; return args + child env. */
  applyFilters(ctx: WrapContext): { args: string[]; env: NodeJS.ProcessEnv };
  /** Parse the runner's `--outputFile` into records. */
  parseOutput(raw: string, repoRoot: string): TestRecord[];
  /** Final-outcome records fed to the ignore exit-gate (parsed output by default). */
  gateRecords(ctx: WrapContext, parsed: TestRecord[]): TestRecord[];
  /** Records used for flake detection (parsed output by default). */
  flakeRecords(ctx: WrapContext, parsed: TestRecord[]): TestRecord[];
}

function usage(): never {
  console.error(
    "Usage:\n" +
      "  test-quarantine run <jest|playwright|detox> -- <runner args...>\n" +
      "      Wrap the runner: inject skip filters, parse results, apply the\n" +
      "      ignore exit-gate, and emit flake events (CI only).\n" +
      "  test-quarantine validate\n" +
      "      Per-PR lint: validate every quarantine/*.yaml (schema, dates) and\n" +
      "      fail on a non-unique title-level title. Exit non-zero on problems.\n" +
      "  test-quarantine expiry-check\n" +
      "      Nightly: exit non-zero (listing entries + owners) when any entry is\n" +
      "      past its expiry. NOT a per-PR gate.\n" +
      "  test-quarantine bypass-guard [--repo-root <dir>]\n" +
      "      Per-PR lint: fail any jest-invoking allowlisted package.json script\n" +
      "      that does not route through the wrapper.",
  );
  process.exit(2);
}

interface ParsedArgv {
  runner: Runner;
  runnerArgs: string[];
}

function parseArgv(argv: string[]): ParsedArgv {
  if (argv[0] !== "run") usage();
  const runner = argv[1] as Runner;
  if (!RUNNER_NAMES.has(runner)) usage();
  const sepIndex = argv.indexOf("--", 2);
  const runnerArgs = sepIndex === -1 ? argv.slice(2) : argv.slice(sepIndex + 1);
  return { runner, runnerArgs };
}

/** Resolve the runner's launch command. We invoke the local binary via the package manager. */
function runnerCommand(runner: Runner, args: string[]): { cmd: string; argv: string[] } {
  // Optional override so integration tests (and unusual local setups) can point
  // at a custom binary, e.g. QUARANTINE_RUNNER_BIN_JEST=node ... a fake runner.
  const override = process.env[`QUARANTINE_RUNNER_BIN_${runner.toUpperCase()}`];
  if (override) {
    // Split on spaces to allow "node /path/to/fake.mjs".
    const parts = override.split(" ").filter(Boolean);
    return { cmd: parts[0], argv: [...parts.slice(1), ...args] };
  }
  // The wrapper sits inside a package script, so the runner bin is on PATH
  // (node_modules/.bin). We invoke it directly.
  return { cmd: RUNNERS[runner].bin, argv: args };
}

function ensureJsonOutput(args: string[], outFile: string): string[] {
  const next = [...args];
  if (!next.includes("--json")) next.push("--json");
  if (!next.some(a => a === "--outputFile" || a.startsWith("--outputFile="))) {
    next.push("--outputFile", outFile);
  }
  return next;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  switch (argv[0]) {
    case "validate":
      return runValidate();
    case "expiry-check":
      return runExpiryCheck();
    case "bypass-guard":
      return runBypassGuard(argv.slice(1));
    case "run":
      return runWrapper(argv);
    default:
      return usage();
  }
}

/** Are there any title-level `skip` entries (the only kind that needs scoping)? */
function hasTitledSkip(entries: LoadedEntry[]): boolean {
  return entries.some(
    e =>
      e.entry.mode === "skip" &&
      (e.entry.filter.title !== undefined || e.entry.filter.titlePattern !== undefined),
  );
}

/**
 * Repo-relative spec-file positionals in a `<runner> test …` invocation (shared
 * by Playwright and Detox — they differ only in which flags consume the next
 * token as a value). Returns undefined if none were passed explicitly.
 */
function positionalRunFiles(
  args: string[],
  repoRoot: string,
  valueFlags: Set<string>,
): string[] | undefined {
  const cwd = process.cwd();
  const files: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "test" || a.startsWith("-")) continue;
    const prev = i > 0 ? args[i - 1] : undefined;
    if (prev !== undefined && valueFlags.has(prev)) continue;
    const abs = isAbsolute(a) ? a : join(cwd, a);
    files.push(relative(repoRoot, abs).split("\\").join("/"));
  }
  return files.length > 0 ? files : undefined;
}

/**
 * Resolve the repo-relative test files in this jest run via `jest --listTests`
 * (run with the SAME args, sans our injected filters). Returns undefined if the
 * listing fails — caller then leaves title entries unscoped and warns.
 */
function jestRunFiles(runnerArgs: string[], repoRoot: string): string[] | undefined {
  const { cmd, argv } = runnerCommand("jest", [...runnerArgs, "--listTests"]);
  const res = spawnSync(cmd, argv, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (res.status !== 0 || typeof res.stdout !== "string") return undefined;
  const files = res.stdout
    .split("\n")
    .map(l => l.trim())
    .filter(
      l =>
        l.length > 0 &&
        (l.endsWith(".ts") || l.endsWith(".tsx") || l.endsWith(".js") || l.endsWith(".jsx")),
    )
    .map(l =>
      relative(repoRoot, isAbsolute(l) ? l : join(process.cwd(), l))
        .split("\\")
        .join("/"),
    );
  return files.length > 0 ? files : undefined;
}

const jestAdapter: RunnerAdapter = {
  bin: "jest",
  resolveRunFiles: (runnerArgs, repoRoot) => jestRunFiles(runnerArgs, repoRoot),
  applyFilters: ({ runnerArgs, active, runFiles, jsonOut }) => ({
    args: ensureJsonOutput([...runnerArgs, ...buildJestFilterArgs(active, runFiles).args], jsonOut),
    env: process.env,
  }),
  parseOutput: (raw, repoRoot) => parseJestString(raw, repoRoot),
  gateRecords: (_ctx, parsed) => parsed,
  flakeRecords: (_ctx, parsed) => parsed,
};

const playwrightAdapter: RunnerAdapter = {
  bin: "playwright",
  resolveRunFiles: (runnerArgs, repoRoot) =>
    positionalRunFiles(runnerArgs, repoRoot, PW_VALUE_FLAGS),
  applyFilters: ({ runnerArgs, active, runFiles, jsonOut, repoRoot }) => {
    // Whole-file skips: drop matching spec-file positionals before launch
    // (Playwright has no path-based --grep-invert); title-level -> --grep-invert.
    const args = filterPlaywrightSpecArgs([...runnerArgs], active, repoRoot);
    args.push(...buildPlaywrightFilterArgs(active, runFiles).args);
    // Do NOT pass --reporter on the CLI: it REPLACES the config's reporters
    // (html/github/allure/…), breaking CI artifacts. Instead set the json output
    // path via env — the project's playwright config appends a `json` reporter
    // when it sees this env (additive), and we parse the resulting file.
    return { args, env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut } };
  },
  parseOutput: (raw, repoRoot) => parsePlaywrightString(raw, repoRoot),
  gateRecords: (_ctx, parsed) => parsed,
  flakeRecords: (_ctx, parsed) => parsed,
};

const detoxAdapter: RunnerAdapter = {
  bin: "detox",
  resolveRunFiles: (runnerArgs, repoRoot) =>
    positionalRunFiles(runnerArgs, repoRoot, DETOX_VALUE_FLAGS),
  applyFilters: ({ runnerArgs, active, runFiles, jsonOut, flakeDir, repoRoot }) => {
    // Whole-file skips: drop matching spec positionals before launch.
    const args = filterDetoxSpecArgs([...runnerArgs], active, repoRoot);
    // Detox forwards UNRECOGNISED args positionally, so every value-bearing flag
    // (title `--testNamePattern`, `--outputFile`) must be a single `--flag=value`
    // token or its value would be misread as a spec. The regex value reaches jest
    // safely because Detox is patched to shell-quote forwarded args (it otherwise
    // only escapes spaces, breaking on the regex's parens — see patches/detox).
    const detoxTitle = buildDetoxFilterArgs(active, runFiles).args;
    if (detoxTitle.length === 2) args.push(`${detoxTitle[0]}=${detoxTitle[1]}`);
    if (!args.includes("--json")) args.push("--json");
    if (!args.some(a => a === "--outputFile" || a.startsWith("--outputFile="))) {
      args.push(`--outputFile=${jsonOut}`);
    }
    // Tell the reporter (inside each child jest) where to append NDJSON, and pin
    // the repo root so it normalises spec paths consistently.
    return {
      args,
      env: { ...process.env, QUARANTINE_FLAKE_DIR: flakeDir, QUARANTINE_REPO_ROOT: repoRoot },
    };
  },
  // Detox runs jest under the hood, so its --outputFile is jest-shaped.
  parseOutput: (raw, repoRoot) => parseJestString(raw, repoRoot),
  // Detox reruns are cross-process under --forceExit, so a reliable final
  // outcome per test isn't in the last jest --outputFile — it's in the reporter's
  // merged NDJSON. Both the exit-gate and flake detection read from there.
  gateRecords: ({ flakeDir }) => collapseAttemptsToFinal(mergeFlakeRecords(flakeDir)),
  flakeRecords: ({ flakeDir }) => mergeFlakeRecords(flakeDir),
};

const RUNNERS: Record<Runner, RunnerAdapter> = {
  jest: jestAdapter,
  playwright: playwrightAdapter,
  detox: detoxAdapter,
};
const RUNNER_NAMES = new Set<Runner>(Object.keys(RUNNERS) as Runner[]);

async function runWrapper(argv: string[]): Promise<void> {
  const { runner, runnerArgs } = parseArgv(argv);
  const adapter = RUNNERS[runner];
  const repoRoot = process.env.QUARANTINE_REPO_ROOT ?? defaultRepoRoot();
  // QUARANTINE_REGISTRY_DIR overrides the registry location (integration tests).
  const { active } = loadRegistry({ repoRoot, registryDir: process.env.QUARANTINE_REGISTRY_DIR });

  const workDir = mkdtempSync(join(tmpdir(), "test-quarantine-"));
  const jsonOut = join(workDir, "results.json");
  const flakeDir = join(workDir, "flake");

  // Scope title-level skips to the files in THIS run, so an entry targeting
  // another runner/project doesn't pollute the title pattern.
  // Only resolve the file set when there ARE titled skips (avoid the cost on the
  // common no-quarantine run); `undefined` => unscoped + a warning.
  let runFiles: string[] | undefined;
  if (hasTitledSkip(active)) {
    runFiles = adapter.resolveRunFiles(runnerArgs, repoRoot);
    if (runFiles === undefined) {
      console.warn(
        "[test-quarantine] could not resolve this run's test files (no explicit specs / " +
          "listing unavailable); title-level skips are applied UNSCOPED (may match same-named " +
          "tests in other files). Pass explicit spec files to scope precisely.",
      );
    }
  }

  const ctx: WrapContext = { runnerArgs, active, runFiles, jsonOut, flakeDir, repoRoot };
  const { args: finalArgs, env: childEnv } = adapter.applyFilters(ctx);

  logApplied(active, runner);

  const { cmd, argv: spawnArgv } = runnerCommand(runner, finalArgs);
  const runnerExitCode = await spawnRunner(cmd, spawnArgv, childEnv);

  // --- Output: parse, gate, report ---
  let records: TestRecord[] = [];
  try {
    if (existsSync(jsonOut)) records = adapter.parseOutput(readFileSync(jsonOut, "utf8"), repoRoot);
  } catch (error) {
    console.warn(`[test-quarantine] could not parse runner output: ${(error as Error).message}`);
  }

  // Flake reporting (CI only, best-effort) — never fails the job.
  try {
    const flakes = reduceFlakes(adapter.flakeRecords(ctx, records));
    if (flakes.length > 0) {
      const summary = await reportFlakes(flakes, active);
      if (!summary.skipped) {
        console.log(
          `[test-quarantine] reported ${summary.delivered}/${flakes.length} flake event(s).`,
        );
      }
    }
  } catch (error) {
    console.warn(`[test-quarantine] flake reporting error: ${(error as Error).message}`);
  }

  // ignore exit-gate.
  const gate = applyExitGate({
    runnerExitCode,
    records: adapter.gateRecords(ctx, records),
    entries: active,
  });
  if (gate.overridden) {
    console.log(
      `[test-quarantine] ignore-gate: forcing exit 0 — ${gate.ignored.length} quarantined ` +
        `failure(s) absorbed, 0 unquarantined failures.`,
    );
  } else if (gate.unhandled.length > 0) {
    console.log(
      `[test-quarantine] ignore-gate: ${gate.unhandled.length} unquarantined failure(s) remain — ` +
        `propagating exit ${gate.exitCode}.`,
    );
  }

  cleanup(workDir);
  process.exit(gate.exitCode);
}

/** `validate` subcommand — per-PR registry lint (PRD §9). */
function runValidate(): void {
  const repoRoot = process.env.QUARANTINE_REPO_ROOT ?? defaultRepoRoot();
  const registryDir = process.env.QUARANTINE_REGISTRY_DIR;
  let result;
  try {
    // loadRegistry (inside validateRegistry) throws on schema/YAML/date errors.
    result = validateRegistry({ repoRoot, registryDir, warn: () => {} });
  } catch (error) {
    console.error(`[test-quarantine] validate: ${(error as Error).message}`);
    process.exit(1);
  }
  // Advisories (e.g. a title that also exists in another test file) are
  // warn-level — printed but never fail the lint.
  for (const warning of result.warnings) {
    console.warn(`[test-quarantine] validate: warning — ${warning}`);
  }
  if (!result.ok) {
    console.error("[test-quarantine] validate: registry has problems:");
    for (const problem of result.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(
    `[test-quarantine] validate: OK — ${result.active.length} active entry(ies), ` +
      `${result.warnings.length} warning(s).`,
  );
  process.exit(0);
}

/** `expiry-check` subcommand — nightly expiry gate (PRD §9). */
function runExpiryCheck(): void {
  const repoRoot = process.env.QUARANTINE_REPO_ROOT ?? defaultRepoRoot();
  const registryDir = process.env.QUARANTINE_REGISTRY_DIR;
  let result;
  try {
    result = expiryCheck({ repoRoot, registryDir });
  } catch (error) {
    console.error(`[test-quarantine] expiry-check: ${(error as Error).message}`);
    process.exit(1);
  }
  if (!result.ok) {
    console.error(`[test-quarantine] expiry-check: ${result.expired.length} expired entry(ies):`);
    for (const e of result.expired) {
      console.error(
        `  - ${e.sourceRelative}: expired ${e.entry.expiry} (owner ${e.entry.owner}` +
          (e.entry.jira ? `, ${e.entry.jira}` : "") +
          `) — ${e.entry.reason}`,
      );
    }
    process.exit(1);
  }
  console.log("[test-quarantine] expiry-check: OK — no expired entries.");
  process.exit(0);
}

/**
 * `bypass-guard` subcommand — per-PR drift guard (PRD §8.1).
 *
 * Scans every non-node_modules package.json and fails if any allowlisted-name
 * script invokes jest directly instead of routing through the wrapper
 * (`classifyScript` -> `bypass`). Packages not yet migrated are exempted via the
 * migration allowlist so their PRs aren't blocked; the guard enforces that
 * migrated packages don't regress and new ones route through the wrapper.
 */
function runBypassGuard(args: string[]): void {
  let repoRoot = process.env.QUARANTINE_REPO_ROOT ?? defaultRepoRoot();
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--repo-root") repoRoot = args[(i += 1)];
  }

  const allow = loadBypassAllowlist(repoRoot);

  const offenders: { pkg: string; name: string; value: string; reason: string }[] = [];
  for (const pkgPath of findPackageJsons(repoRoot)) {
    let json: { scripts?: Record<string, unknown> };
    try {
      json = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      continue;
    }
    const scripts = json.scripts;
    if (!scripts || typeof scripts !== "object") continue;
    const rel = relativePath(repoRoot, pkgPath);
    if (allow.has(rel)) continue; // not-yet-migrated, explicitly permitted
    for (const [name, value] of Object.entries(scripts)) {
      if (!ALLOWLISTED_SCRIPT_NAMES.has(name) || typeof value !== "string") continue;
      const c = classifyScript(name, value);
      if (c.kind === "bypass") offenders.push({ pkg: rel, name, value, reason: c.reason });
    }
  }

  if (offenders.length > 0) {
    console.error(
      `[test-quarantine] bypass-guard: ${offenders.length} jest script(s) bypass the wrapper. ` +
        `Edit each package.json script to route through \`test-quarantine run jest --\` ` +
        `(or add the package to quarantine/.bypass-allow if it's not ready to migrate):`,
    );
    for (const o of offenders) {
      console.error(`  - ${o.pkg}  [${o.name}]: ${o.value}\n      (${o.reason})`);
    }
    process.exit(1);
  }
  console.log("[test-quarantine] bypass-guard: OK — every jest script routes through the wrapper.");
  process.exit(0);
}

/**
 * Load the bypass-guard migration allowlist: repo-relative package.json paths
 * permitted to still invoke jest directly during the pilot rollout. One path
 * per line; `#` comments and blank lines ignored. Missing file => empty set
 * (guard enforces on everything).
 */
function loadBypassAllowlist(repoRoot: string): Set<string> {
  const file =
    process.env.QUARANTINE_BYPASS_ALLOWLIST ?? join(repoRoot, "quarantine", ".bypass-allow");
  const set = new Set<string>();
  if (!existsSync(file)) return set;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.replace(/#.*$/, "").trim();
    if (trimmed) set.add(trimmed.split("\\").join("/"));
  }
  return set;
}

/** Recursively collect package.json paths, skipping node_modules and dot dirs. */
function findPackageJsons(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "package.json") out.push(full);
    }
  };
  walk(root);
  return out;
}

function relativePath(root: string, p: string): string {
  return p.startsWith(root)
    ? p
        .slice(root.length)
        .replace(/^[/\\]/, "")
        .split("\\")
        .join("/")
    : p;
}

function logApplied(entries: LoadedEntry[], runner: Runner): void {
  const applicable = entries.filter(
    e =>
      // skip-mode entries are reflected as input filters; ignore-mode log too.
      e.entry.mode === "skip" || e.entry.mode === "ignore",
  );
  if (applicable.length === 0) return;
  console.log(`[test-quarantine] ${runner}: ${applicable.length} active quarantine entry(ies):`);
  for (const e of applicable) {
    console.log(
      `  - [${e.entry.mode}] ${e.sourceRelative}: ${e.entry.reason} (owner ${e.entry.owner}, expires ${e.entry.expiry})`,
    );
  }
}

function spawnRunner(cmd: string, argv: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise(resolve => {
    const child = spawn(cmd, argv, {
      stdio: "inherit",
      env,
      shell: process.platform === "win32",
    });
    child.on("error", error => {
      console.error(`[test-quarantine] failed to spawn ${cmd}: ${error.message}`);
      resolve(1);
    });
    child.on("close", code => resolve(code ?? 1));
  });
}

function cleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

main().catch(error => {
  console.error(`[test-quarantine] fatal: ${(error as Error).stack ?? error}`);
  process.exit(1);
});
