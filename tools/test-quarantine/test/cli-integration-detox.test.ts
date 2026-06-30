import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const cliEntry = resolve(here, "../src/cli.ts");
const fakeDetox = resolve(here, "fixtures/fake-detox.mjs");

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
  detoxArgs: string[];
}

function writeEntry(dir: string, name: string, yaml: string): void {
  writeFileSync(join(dir, name), yaml, "utf8");
}

/**
 * Invoke the wrapper as `run detox -- test <specs...> --retries 1`. Specs are
 * passed ABSOLUTE (under repoRoot) so filtering is independent of the test
 * process CWD, mirroring how e2e-ci passes resolved spec paths.
 */
function runCli(opts: {
  registryDir: string;
  repoRoot: string;
  scenario: string;
  specs?: string[];
  env?: Record<string, string>;
}): RunResult {
  const argsFile = join(mkdtempSync(join(tmpdir(), "tq-dtx-args-")), "args.json");
  const specs = (opts.specs ?? ["e2e/specs/keep.spec.ts"]).map(s => join(opts.repoRoot, s));
  const result = spawnSync(
    process.execPath,
    [cliEntry, "run", "detox", "--", "test", ...specs, "--retries", "1"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        QUARANTINE_REGISTRY_DIR: opts.registryDir,
        QUARANTINE_REPO_ROOT: opts.repoRoot,
        QUARANTINE_RUNNER_BIN_DETOX: `${process.execPath} ${fakeDetox}`,
        FAKE_DETOX_ARGS_FILE: argsFile,
        FAKE_DETOX_SCENARIO: opts.scenario,
        ...opts.env,
      },
    },
  );
  const detoxArgs = existsSync(argsFile)
    ? (JSON.parse(readFileSync(argsFile, "utf8")) as string[])
    : [];
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr, detoxArgs };
}

function setup(): { registryDir: string; repoRoot: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-dtx-"));
  const registryDir = join(repoRoot, "quarantine");
  mkdirSync(registryDir, { recursive: true });
  return { registryDir, repoRoot };
}

test("detox: whole-file skip drops the spec positional before launch", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "skipfile.yaml",
    `mode: skip\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "e2e/specs/skipme.spec.ts"\n`,
  );
  const res = runCli({
    registryDir,
    repoRoot,
    scenario: "pass",
    specs: ["e2e/specs/skipme.spec.ts", "e2e/specs/keep.spec.ts"],
  });
  // The quarantined spec must not reach detox; the other one must.
  assert.ok(
    !res.detoxArgs.some(a => a.endsWith("skipme.spec.ts")),
    "quarantined spec dropped from detox args",
  );
  assert.ok(
    res.detoxArgs.some(a => a.endsWith("keep.spec.ts")),
    "other spec retained",
  );
  assert.ok(res.detoxArgs.includes("test"), "detox subcommand preserved");
});

test("detox: value-bearing flags are injected in --flag=value form", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "skiptitle.yaml",
    `mode: skip\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "e2e/specs/keep.spec.ts"\n  title: "skip me"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "pass" });
  // Detox forwards unrecognised args positionally, so the value must ride in a
  // single token (no bare value that detox would mistake for a spec).
  assert.ok(
    res.detoxArgs.some(a => a.startsWith("--outputFile=")),
    "--outputFile injected as --flag=value",
  );
  assert.ok(res.detoxArgs.includes("--json"));
  const tnp = res.detoxArgs.find(a => a.startsWith("--testNamePattern="));
  assert.ok(tnp, "--testNamePattern injected as --flag=value");
  // No bare space-form value tokens for the flags we inject.
  assert.equal(res.detoxArgs.indexOf("--outputFile"), -1, "no space-form --outputFile");
  assert.equal(res.detoxArgs.indexOf("--testNamePattern"), -1, "no space-form --testNamePattern");
  // The raw regex is emitted as-is; it reaches jest safely because Detox is
  // patched to shell-quote forwarded args (see patches/detox@20.51.3.patch).
  const pattern = new RegExp(tnp!.slice("--testNamePattern=".length));
  assert.ok(!pattern.test("skip me"), "quarantined title excluded");
  assert.ok(pattern.test("other"), "other titles still run");
});

test("detox ignore: a hard-failing quarantined test yields exit 0", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "ignore.yaml",
    `mode: ignore\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "e2e/specs/keep.spec.ts"\n  title: "flaky ignored test"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "ignoreOnly" });
  assert.equal(res.status, 0, "exit forced to 0 by the ignore gate");
  assert.match(res.stdout, /forcing exit 0/);
});

test("detox ignore: a co-located UNQUARANTINED failure still fails the job", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "ignore.yaml",
    `mode: ignore\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "e2e/specs/keep.spec.ts"\n  title: "flaky ignored test"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "mixed" });
  assert.notEqual(res.status, 0, "real (unquarantined) failure must propagate");
  assert.match(res.stdout, /unquarantined failure/);
});

test("detox flake: cross-process pass-on-retry detects one flake and attempts delivery", () => {
  const { registryDir, repoRoot } = setup();
  const res = runCli({
    registryDir,
    repoRoot,
    scenario: "flake",
    // Never-listening host: delivery is attempted (and swallowed), proving the
    // NDJSON merge -> reduce -> report path fired without needing loopback.
    env: { CI: "1", FLAKE_API_KEY: "secret", FLAKE_API_HOST: "http://127.0.0.1:1" },
  });
  assert.equal(res.status, 0);
  assert.match(
    res.stdout,
    /reported \d+\/1 flake event\(s\)/,
    "exactly one flake detected + reported",
  );
});
