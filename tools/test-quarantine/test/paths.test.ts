import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { findRepoRoot, repoRoot, toPosix, toRepoRelative } from "../src/core/paths.ts";

test("paths are normalised to forward slashes", () => {
  assert.equal(toPosix("libs\\example\\a.test.ts"), "libs/example/a.test.ts");
  assert.equal(toPosix("libs/example/a.test.ts"), "libs/example/a.test.ts");
});

test("absolute test paths become repo-relative", () => {
  assert.equal(toRepoRelative("/repo/libs/example/a.test.ts", "/repo"), "libs/example/a.test.ts");
});

test("a path already inside the repo root is left alone", () => {
  assert.equal(toRepoRelative("/repo/a.test.ts", "/repo"), "a.test.ts");
});

test("a symlinked repo root still yields a path inside the repo", () => {
  // Test runners report real paths, so a root configured through a symlink
  // (macOS /tmp, a symlinked home directory) must not produce a ../.. escape.
  const real = mkdtempSync(join(tmpdir(), "tq-real-"));
  mkdirSync(join(real, "src"), { recursive: true });
  writeFileSync(join(real, "src", "a.test.ts"), "");

  const link = join(mkdtempSync(join(tmpdir(), "tq-link-")), "repo");
  symlinkSync(real, link, "dir");

  assert.equal(toRepoRelative(join(real, "src", "a.test.ts"), link), "src/a.test.ts");
});

test("a file genuinely outside the repo is still reported as outside", () => {
  const root = mkdtempSync(join(tmpdir(), "tq-outside-root-"));
  const other = mkdtempSync(join(tmpdir(), "tq-outside-other-"));
  writeFileSync(join(other, "a.test.ts"), "");

  assert.ok(toRepoRelative(join(other, "a.test.ts"), root).startsWith("../"));
});

test("the repo root is found by walking up to the workspace marker", () => {
  const root = mkdtempSync(join(tmpdir(), "tq-paths-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  const nested = join(root, "libs", "example", "src");
  mkdirSync(nested, { recursive: true });

  assert.equal(findRepoRoot(nested), root);
});

test("a directory outside any workspace resolves to undefined", () => {
  const orphan = mkdtempSync(join(tmpdir(), "tq-orphan-"));
  assert.equal(findRepoRoot(orphan), undefined);
});

test("QUARANTINE_REPO_ROOT wins over discovery", () => {
  assert.equal(repoRoot({ QUARANTINE_REPO_ROOT: "/pinned" }, "/somewhere/else"), "/pinned");
});

test("the cwd is the fallback when no workspace marker exists", () => {
  const orphan = mkdtempSync(join(tmpdir(), "tq-fallback-"));
  assert.equal(repoRoot({}, orphan), orphan);
});
