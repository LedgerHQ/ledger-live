#!/usr/bin/env bun
// Automated regression harness for the wallet-cli cases that need no device.
// Case ids match ../../docs/regression/no-device.md.
//
//   bun scripts/regression/run.ts                 # suites B, C, D (skill group, first-run nudge, read/dry-run)
//   bun scripts/regression/run.ts --suite b       # one suite (a|b|c|d, repeatable)
//   bun scripts/regression/run.ts --with-gates    # add suite A (repo gates); --with-build adds build/pack/smoke
//   bun scripts/regression/run.ts --bin ./cli     # a specific binary (default: dist/<platform>/cli)
//   bun scripts/regression/run.ts --source        # run from source via `pnpm wallet-cli start`
//   bun scripts/regression/run.ts --session <dir> # suite D against a pinned state dir, not yours
//   bun scripts/regression/run.ts --timeout <s>   # per-case timeout (default 240s)
//
// Suites B and C are hermetic (throwaway cwd, home and state dir).
// Suite D reads a real session and live backends; it never signs or broadcasts.
// Device-touching cases live in the docs, not here.
//
// Requires: bun, and a built binary or pnpm. Env: CASE_TIMEOUT, GATE_TIMEOUT, REPO_ROOT.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Harness, isExecutableFile, type RunConfig } from "./lib";
import { suiteA } from "./cases-gates";
import { suiteB } from "./cases-skill";
import { suiteC } from "./cases-nudge";
import { suiteD } from "./cases-readonly";

const USAGE = `Automated regression harness for the wallet-cli cases that need no device.
Case ids match apps/wallet-cli/docs/regression/no-device.md.

  bun scripts/regression/run.ts                 # suites B, C, D (skill group, first-run nudge, read/dry-run)
  bun scripts/regression/run.ts --suite b       # one suite (a|b|c|d, repeatable)
  bun scripts/regression/run.ts --with-gates    # add suite A (repo gates); --with-build adds build/pack/smoke
  bun scripts/regression/run.ts --bin ./cli     # a specific binary (default: dist/<platform>/cli)
  bun scripts/regression/run.ts --source        # run from source via \`pnpm wallet-cli start\`
  bun scripts/regression/run.ts --session <dir> # suite D against a pinned state dir, not yours
  bun scripts/regression/run.ts --timeout <s>   # per-case timeout (default 240s)

Suites B and C are hermetic (throwaway cwd, home and state dir).
Suite D reads a real session and live backends; it never signs or broadcasts.
Device-touching cases live in the docs, not here.

Requires: bun, and a built binary or pnpm. Env: CASE_TIMEOUT, GATE_TIMEOUT, REPO_ROOT.`;

const SUITES = {
  a: { title: "Suite A — repo & artifact gates", run: suiteA },
  b: { title: "Suite B — skill command group", run: suiteB },
  c: { title: "Suite C — first-run nudge", run: suiteC },
  d: { title: "Suite D — device-free regression", run: suiteD },
} as const;

type SuiteKey = keyof typeof SUITES;

// bunli.config.ts builds exactly these four targets.
const BINARY_BY_HOST: Record<string, string> = {
  "darwin-arm64": join("darwin-arm64", "cli"),
  "linux-arm64": join("linux-arm64", "cli"),
  "linux-x64": join("linux-x64", "cli"),
  "win32-x64": join("windows-x64", "cli.exe"),
};

function die(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function parseArgs(argv: string[]) {
  const suites: SuiteKey[] = [];
  let withBuild = false;
  let binOverride = "";
  let useSource = false;
  let sessionDir: string | undefined;
  let caseTimeout = Number(process.env.CASE_TIMEOUT ?? 240);

  const next = (index: number, flag: string): string => {
    const value = argv[index + 1];
    if (value === undefined) die(`${flag} needs a value`);
    return value;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--suite": {
        const name = next(i++, arg).toLowerCase();
        if (!(name in SUITES)) die(`unknown suite: ${name}`);
        suites.push(name as SuiteKey);
        break;
      }
      case "--with-gates":
        suites.push("a");
        break;
      case "--with-build":
        withBuild = true;
        break;
      case "--bin":
        binOverride = next(i++, arg);
        break;
      case "--source":
        useSource = true;
        break;
      case "--session":
        sessionDir = resolve(next(i++, arg));
        break;
      case "--timeout":
        caseTimeout = Number(next(i++, arg));
        break;
      case "-h":
      case "--help":
        process.stdout.write(`${USAGE}\n`);
        process.exit(0);
        break;
      default:
        die(`unknown flag: ${arg}`);
    }
  }

  return {
    suites: suites.length > 0 ? suites : (["b", "c", "d"] as SuiteKey[]),
    withBuild,
    binOverride,
    useSource,
    sessionDir,
    caseTimeout,
  };
}

function resolveCli(
  args: ReturnType<typeof parseArgs>,
  repoRoot: string,
  walletCliDir: string,
): { binArgv: string[]; binLabel: string } {
  if (args.useSource) {
    return {
      binArgv: ["pnpm", "--dir", repoRoot, "--silent", "wallet-cli", "start"],
      binLabel: "pnpm wallet-cli start",
    };
  }
  const host = `${process.platform}-${process.arch}`;
  const fallback = BINARY_BY_HOST[host];
  if (!args.binOverride && !fallback) die(`no default binary for ${host}; pass --bin or --source`);
  const bin = args.binOverride || join(walletCliDir, "dist", fallback);
  if (!isExecutableFile(bin)) {
    process.stderr.write(`binary not found: ${bin}\n`);
    die(`build it with: (cd ${walletCliDir} && pnpm build)   — or run with --source`);
  }
  return { binArgv: [bin], binLabel: bin };
}

const args = parseArgs(process.argv.slice(2));
const here = import.meta.dir;
const repoRoot = process.env.REPO_ROOT ?? resolve(here, "..", "..", "..", "..");
const walletCliDir = join(repoRoot, "apps", "wallet-cli");
const packageJson = JSON.parse(readFileSync(join(walletCliDir, "package.json"), "utf8")) as {
  version: string;
};
const { binArgv, binLabel } = resolveCli(args, repoRoot, walletCliDir);

const runId = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\.\d+Z$/, "")
  .replace("T", "-");
const tmpRoot = mkdtempSync(join(tmpdir(), `wallet-cli-regression.${runId}.`));
const logFile = join(tmpRoot, "run.log");
writeFileSync(logFile, "");

const config: RunConfig = {
  repoRoot,
  walletCliDir,
  expectedVersion: packageJson.version,
  binArgv,
  binLabel,
  caseTimeoutMs: args.caseTimeout * 1000,
  gateTimeoutMs: Number(process.env.GATE_TIMEOUT ?? 2400) * 1000,
  tmpRoot,
  logFile,
  isoState: mkdtempSync(join(tmpRoot, "iso-state.")),
  isoHome: mkdtempSync(join(tmpRoot, "iso-home.")),
  sessionDir: args.sessionDir,
  withBuild: args.withBuild,
};

const harness = new Harness(config);

harness.print(`wallet-cli regression run ${runId}`);
harness.print(`  version under test : ${config.expectedVersion}`);
harness.print(`  cli                : ${config.binLabel}`);
harness.print(`  suites             : ${args.suites.join(" ")}`);
if (config.sessionDir) harness.print(`  session            : ${config.sessionDir}`);
harness.print(`  log                : ${config.logFile}`);
harness.print("");

const start = Date.now();
for (const key of args.suites) {
  const suite = SUITES[key];
  harness.print(`── ${suite.title} ──`);
  await suite.run(harness);
  harness.print("");
}
const seconds = Math.round((Date.now() - start) / 1000);

const total = harness.passCount + harness.failCount;
harness.print("──────────────────────────────────────────────");
harness.print(
  `passed ${harness.passCount}/${total}   failed ${harness.failCount}   skipped ${harness.skipCount}   (${seconds}s)`,
);
if (harness.failCount > 0) {
  harness.print(`failed cases: ${harness.failedIds.join(" ")}`);
  harness.print(`full log: ${config.logFile}`);
  process.exit(1);
}
harness.print(`log: ${config.logFile}`);
