import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const cliEntry = resolve(here, "../src/cli.ts");

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function runCli(subcmd: string[], env: Record<string, string>): RunResult {
  const result = spawnSync(process.execPath, [cliEntry, ...subcmd], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr };
}

function registry(files: Record<string, string>): { repoRoot: string; registryDir: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-sub-"));
  const registryDir = join(repoRoot, "quarantine");
  mkdirSync(registryDir, { recursive: true });
  for (const [n, c] of Object.entries(files)) writeFileSync(join(registryDir, n), c, "utf8");
  return { repoRoot, registryDir };
}

const ok = `mode: skip\nreason: r\nowner: "@o"\nexpiry: "2999-01-01"\nfilter:\n  file: "a.test.ts"\n  title: "flaky"\n`;

test("validate: exit 0 on a clean registry", () => {
  const { repoRoot, registryDir } = registry({ "a.yaml": ok });
  const r = runCli(["validate"], {
    QUARANTINE_REPO_ROOT: repoRoot,
    QUARANTINE_REGISTRY_DIR: registryDir,
  });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /validate: OK/);
});

test("validate: exit 1 on a schema-invalid entry", () => {
  const bad = `mode: skip\nreason: r\nexpiry: "2999-01-01"\nfilter:\n  file: "a.test.ts"\n`;
  const { repoRoot, registryDir } = registry({ "bad.yaml": bad });
  const r = runCli(["validate"], {
    QUARANTINE_REPO_ROOT: repoRoot,
    QUARANTINE_REGISTRY_DIR: registryDir,
  });
  assert.equal(r.status, 1);
});

test("validate: exit 1 on a duplicate title-level title", () => {
  const a = ok;
  const b = `mode: skip\nreason: r\nowner: "@o"\nexpiry: "2999-01-01"\nfilter:\n  file: "b.test.ts"\n  title: "flaky"\n`;
  const { repoRoot, registryDir } = registry({ "a.yaml": a, "b.yaml": b });
  const r = runCli(["validate"], {
    QUARANTINE_REPO_ROOT: repoRoot,
    QUARANTINE_REGISTRY_DIR: registryDir,
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Non-unique title-level title/);
});

test("expiry-check: exit 0 when nothing expired", () => {
  const { repoRoot, registryDir } = registry({ "a.yaml": ok });
  const r = runCli(["expiry-check"], {
    QUARANTINE_REPO_ROOT: repoRoot,
    QUARANTINE_REGISTRY_DIR: registryDir,
  });
  assert.equal(r.status, 0);
});

test("expiry-check: exit 1 and lists the expired entry + owner", () => {
  const expired = `mode: skip\nreason: r\nowner: "@team"\nexpiry: "2000-01-01"\nfilter:\n  file: "a.test.ts"\n  title: "flaky"\n`;
  const { repoRoot, registryDir } = registry({ "a.yaml": expired });
  const r = runCli(["expiry-check"], {
    QUARANTINE_REPO_ROOT: repoRoot,
    QUARANTINE_REGISTRY_DIR: registryDir,
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /@team/);
  assert.match(r.stderr, /expired 2000-01-01/);
});

test("expiry-check: a valid-but-not-expired duplicate does NOT fail (expiry is not the dup gate)", () => {
  // expiry-check only cares about dates, never about dup titles.
  const a = ok;
  const b = `mode: skip\nreason: r\nowner: "@o"\nexpiry: "2999-01-01"\nfilter:\n  file: "b.test.ts"\n  title: "flaky"\n`;
  const { repoRoot, registryDir } = registry({ "a.yaml": a, "b.yaml": b });
  const r = runCli(["expiry-check"], {
    QUARANTINE_REPO_ROOT: repoRoot,
    QUARANTINE_REGISTRY_DIR: registryDir,
  });
  assert.equal(r.status, 0);
});

test("bypass-guard: exit 0 when every jest script routes through the wrapper", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-guard-ok-"));
  mkdirSync(join(repoRoot, "pkg"), { recursive: true });
  writeFileSync(
    join(repoRoot, "pkg", "package.json"),
    JSON.stringify({ scripts: { coverage: "test-quarantine run jest -- --coverage" } }, null, 2),
  );
  const r = runCli(["bypass-guard", "--repo-root", repoRoot], {});
  assert.equal(r.status, 0);
  assert.match(r.stdout, /bypass-guard: OK/);
});

test("bypass-guard: exit 1 on a package that bypasses the wrapper", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-guard-bad-"));
  mkdirSync(join(repoRoot, "pkg"), { recursive: true });
  writeFileSync(
    join(repoRoot, "pkg", "package.json"),
    JSON.stringify({ scripts: { coverage: "jest --coverage" } }, null, 2),
  );
  const r = runCli(["bypass-guard", "--repo-root", repoRoot], {});
  assert.equal(r.status, 1);
  assert.match(r.stderr, /bypass the wrapper/);
  assert.match(r.stderr, /pkg\/package\.json/);
});

test("bypass-guard: a delegating chained `test` is not a bypass (leaf is guarded)", () => {
  // Mirrors desktop/mobile: `test` delegates to the leaf, which is wrapped.
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-guard-chain-"));
  mkdirSync(join(repoRoot, "pkg"), { recursive: true });
  writeFileSync(
    join(repoRoot, "pkg", "package.json"),
    JSON.stringify(
      {
        scripts: {
          test: "pnpm test:jest:coverage && pnpm test:env",
          "test:jest": "test-quarantine run jest --",
          "test:jest:coverage": "pnpm test:jest --ci --coverage",
        },
      },
      null,
      2,
    ),
  );
  const r = runCli(["bypass-guard", "--repo-root", repoRoot], {});
  assert.equal(r.status, 0);
});

test("bypass-guard: a package on the migration allowlist is skipped", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-guard-allow-"));
  mkdirSync(join(repoRoot, "pkg"), { recursive: true });
  mkdirSync(join(repoRoot, "quarantine"), { recursive: true });
  writeFileSync(
    join(repoRoot, "pkg", "package.json"),
    JSON.stringify({ scripts: { coverage: "jest --coverage" } }, null, 2),
  );
  // Without the allowlist it fails; with it, the offending pkg is permitted.
  const before = runCli(["bypass-guard", "--repo-root", repoRoot], {});
  assert.equal(before.status, 1);
  writeFileSync(join(repoRoot, "quarantine", ".bypass-allow"), "pkg/package.json\n");
  const after = runCli(["bypass-guard", "--repo-root", repoRoot], {});
  assert.equal(after.status, 0);
});

test("bypass-guard: ignores debug/oxfmt/detox exceptions", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-guard-exc-"));
  mkdirSync(join(repoRoot, "pkg"), { recursive: true });
  writeFileSync(
    join(repoRoot, "pkg", "package.json"),
    JSON.stringify(
      {
        scripts: {
          coverage: "test-quarantine run jest -- --coverage",
          "test:jest:debug": "node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand",
          format: "oxfmt src jest",
          "mock:test": "pnpm detox test",
        },
      },
      null,
      2,
    ),
  );
  const r = runCli(["bypass-guard", "--repo-root", repoRoot], {});
  assert.equal(r.status, 0);
});
