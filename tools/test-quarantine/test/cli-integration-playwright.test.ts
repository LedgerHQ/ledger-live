import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const cliEntry = resolve(here, "../src/cli.ts");
const fakePw = resolve(here, "fixtures/fake-playwright.mjs");

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
  pwArgs: string[];
}

function writeEntry(dir: string, name: string, yaml: string): void {
  writeFileSync(join(dir, name), yaml, "utf8");
}

/** Invoke the wrapper as `run playwright -- test <specs...>`. Specs are passed
 *  ABSOLUTE (under repoRoot) so filtering is independent of the test CWD. */
function runCli(opts: {
  registryDir: string;
  repoRoot: string;
  scenario: string;
  specs?: string[];
  env?: Record<string, string>;
}): RunResult {
  const argsFile = join(mkdtempSync(join(tmpdir(), "tq-pw-args-")), "args.json");
  const specs = (opts.specs ?? []).map(s => join(opts.repoRoot, s));
  const result = spawnSync(
    process.execPath,
    [cliEntry, "run", "playwright", "--", "test", ...specs],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        QUARANTINE_REGISTRY_DIR: opts.registryDir,
        QUARANTINE_REPO_ROOT: opts.repoRoot,
        QUARANTINE_RUNNER_BIN_PLAYWRIGHT: `${process.execPath} ${fakePw}`,
        FAKE_PW_ARGS_FILE: argsFile,
        FAKE_PW_SCENARIO: opts.scenario,
        ...opts.env,
      },
    },
  );
  const pwArgs = existsSync(argsFile)
    ? (JSON.parse(readFileSync(argsFile, "utf8")) as string[])
    : [];
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr, pwArgs };
}

function setup(): { registryDir: string; repoRoot: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-pw-"));
  const registryDir = join(repoRoot, "quarantine");
  mkdirSync(registryDir, { recursive: true });
  return { registryDir, repoRoot };
}

test("playwright: wrapper never passes --reporter (config reporters preserved)", () => {
  const { registryDir, repoRoot } = setup();
  const res = runCli({ registryDir, repoRoot, scenario: "pass" });
  assert.ok(
    !res.pwArgs.some(a => a.startsWith("--reporter")),
    "no --reporter injected — config reporters must not be overridden",
  );
});

test("playwright: whole-file skip drops the spec positional before launch", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "skipfile.yaml",
    `mode: skip\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "skipme.spec.ts"\n`,
  );
  const res = runCli({
    registryDir,
    repoRoot,
    scenario: "pass",
    specs: ["skipme.spec.ts", "keep.spec.ts"],
  });
  assert.ok(!res.pwArgs.some(a => a.endsWith("skipme.spec.ts")), "quarantined spec dropped");
  assert.ok(
    res.pwArgs.some(a => a.endsWith("keep.spec.ts")),
    "other spec retained",
  );
});

test("playwright: title skip injects --grep-invert over the drop-set", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "skiptitle.yaml",
    `mode: skip\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "keep.spec.ts"\n  title: "keep.spec.ts skip me"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "pass", specs: ["keep.spec.ts"] });
  const idx = res.pwArgs.indexOf("--grep-invert");
  assert.notEqual(idx, -1, "playwright received --grep-invert");
  const pattern = new RegExp(res.pwArgs[idx + 1]);
  assert.ok(pattern.test("keep.spec.ts skip me"), "quarantined title is in the invert set");
  assert.ok(!pattern.test("keep.spec.ts something else"), "other titles are not");
});

test("playwright ignore: a hard-failing quarantined test yields exit 0", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "ignore.yaml",
    `mode: ignore\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "keep.spec.ts"\n  title: "keep.spec.ts flaky ignored test"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "ignoreOnly" });
  assert.equal(res.status, 0, "exit forced to 0 by the ignore gate");
  assert.match(res.stdout, /forcing exit 0/);
});

test("playwright ignore: a co-located UNQUARANTINED failure still fails the job", () => {
  const { registryDir, repoRoot } = setup();
  writeEntry(
    registryDir,
    "ignore.yaml",
    `mode: ignore\nreason: r\nowner: o\nexpiry: "2999-01-01"\nfilter:\n  file: "keep.spec.ts"\n  title: "keep.spec.ts flaky ignored test"\n`,
  );
  const res = runCli({ registryDir, repoRoot, scenario: "mixed" });
  assert.notEqual(res.status, 0, "real (unquarantined) failure must propagate");
  assert.match(res.stdout, /unquarantined failure/);
});

test("playwright flake: pass-on-retry detects one flake and attempts delivery", () => {
  const { registryDir, repoRoot } = setup();
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
