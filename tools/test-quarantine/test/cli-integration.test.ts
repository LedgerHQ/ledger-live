import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const cliEntry = resolve(here, "../src/cli.ts");
const fakeJest = resolve(here, "fixtures/fake-jest.mjs");

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
  jestArgs: string[];
}

function writeEntry(dir: string, name: string, yaml: string): void {
  writeFileSync(join(dir, name), yaml, "utf8");
}

function runCli(opts: {
  registryDir: string;
  repoRoot: string;
  scenario: string;
  env?: Record<string, string>;
}): RunResult {
  const argsFile = join(mkdtempSync(join(tmpdir(), "tq-args-")), "args.json");
  const result = spawnSync(
    process.execPath,
    [cliEntry, "run", "jest", "--", "--config", "ignored"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        QUARANTINE_REGISTRY_DIR: opts.registryDir,
        QUARANTINE_REPO_ROOT: opts.repoRoot,
        QUARANTINE_RUNNER_BIN_JEST: `${process.execPath} ${fakeJest}`,
        FAKE_JEST_ARGS_FILE: argsFile,
        FAKE_JEST_REPO_ROOT: opts.repoRoot,
        FAKE_JEST_SCENARIO: opts.scenario,
        ...opts.env,
      },
    },
  );
  const jestArgs = existsSync(argsFile)
    ? (JSON.parse(readFileSync(argsFile, "utf8")) as string[])
    : [];
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr, jestArgs };
}

function setup(): { registryDir: string; repoRoot: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-int-"));
  const registryDir = join(repoRoot, "quarantine");
  mkdirSync(registryDir, { recursive: true });
  return { registryDir, repoRoot };
}

test("skip entry injects native jest exclusion flags before launch", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "skip.yaml",
    `mode: skip\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "a.test.ts"\n  title: "flaky"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "pass" });
  // The wrapper must append a negative --testNamePattern excluding "flaky".
  const idx = res.jestArgs.indexOf("--testNamePattern");
  assert.notEqual(idx, -1, "jest received --testNamePattern");
  const pattern = new RegExp(res.jestArgs[idx + 1]);
  assert.ok(!pattern.test("flaky"), "quarantined title excluded");
  assert.ok(pattern.test("other"), "other titles still run");
  // and it always adds --json --outputFile for parsing.
  assert.ok(res.jestArgs.includes("--json"));
  assert.ok(res.jestArgs.includes("--outputFile"));
});

test("skip whole-file entry injects --testPathIgnorePatterns", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "skipfile.yaml",
    `mode: skip\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "a.test.ts"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "pass" });
  const idx = res.jestArgs.indexOf("--testPathIgnorePatterns");
  assert.notEqual(idx, -1);
  assert.ok(new RegExp(res.jestArgs[idx + 1]).test("a.test.ts"));
});

test("ignore: a hard-failing quarantined test yields exit 0", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "ignore.yaml",
    `mode: ignore\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "a.test.ts"\n  title: "flaky"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "ignoreOnly" });
  assert.equal(res.status, 0, "exit forced to 0 by the ignore gate");
  assert.match(res.stdout, /forcing exit 0/);
});

test("ignore: co-located UNQUARANTINED timeout failure still fails the job", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "ignore.yaml",
    `mode: ignore\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "a.test.ts"\n  title: "flaky"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "mixed" });
  assert.notEqual(res.status, 0, "real (unquarantined) timeout failure must propagate");
  assert.match(res.stdout, /unquarantined failure/);
});

/**
 * A flaky (pass-on-retry) run detects exactly one flake and attempts delivery.
 *
 * NOTE: in this sandbox, a CHILD process cannot open a localhost socket to a
 * server listening in the parent test process (cross-process loopback is
 * blocked by the harness). So this end-to-end test asserts the observable
 * behaviour from the spawned CLI: it detected one flake and attempted to
 * report it. The actual payload-vs-contract assertion against a live mock
 * ingest server runs IN-PROCESS in report.test.ts ("posts one event...",
 * "payload conforms to the ingest contract fields"), where loopback works.
 */
test("flaky test (pass-on-retry) detects one flake and attempts delivery", () => {
  const { registryDir, repoRoot } = setup();
  // Point at a never-listening host: delivery is attempted (and swallowed),
  // proving the detection + report path fired without needing loopback.
  const res = runCli({
    registryDir,
    repoRoot,
    scenario: "flake",
    env: { CI: "1", FLAKE_API_KEY: "secret", FLAKE_API_HOST: "http://127.0.0.1:1" },
  });
  assert.equal(res.status, 0);
  assert.match(
    res.stdout,
    /reported \d+\/1 flake event\(s\)/,
    "exactly one flake detected + reported",
  );
});
