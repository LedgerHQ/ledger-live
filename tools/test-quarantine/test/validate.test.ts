import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateRegistry, expiryCheck } from "../src/validate.ts";

function tmpRegistry(files: Record<string, string>): { repoRoot: string; registryDir: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-validate-"));
  const registryDir = join(repoRoot, "quarantine");
  mkdirSync(registryDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(registryDir, name), content, "utf8");
  }
  return { repoRoot, registryDir };
}

const entry = (over: Partial<{ file: string; title: string; expiry: string }> = {}) =>
  `mode: skip\nreason: r\nowner: "@o"\nexpiry: "${over.expiry ?? "2999-01-01"}"\nfilter:\n  file: "${over.file ?? "a.test.ts"}"\n  title: "${over.title ?? "flaky"}"\n`;

test("validate: green on a clean registry", () => {
  const { repoRoot, registryDir } = tmpRegistry({ "a.yaml": entry() });
  const r = validateRegistry({ repoRoot, registryDir, warn: () => {} });
  assert.equal(r.ok, true);
  assert.equal(r.problems.length, 0);
});

test("validate: throws on a schema-invalid entry", () => {
  // missing required `owner`
  const bad = `mode: skip\nreason: r\nexpiry: "2999-01-01"\nfilter:\n  file: "a.test.ts"\n`;
  const { repoRoot, registryDir } = tmpRegistry({ "bad.yaml": bad });
  assert.throws(() => validateRegistry({ repoRoot, registryDir, warn: () => {} }), /owner/);
});

test("validate: throws on a bad date", () => {
  const { repoRoot, registryDir } = tmpRegistry({ "bad.yaml": entry({ expiry: "2026-13-40" }) });
  assert.throws(() => validateRegistry({ repoRoot, registryDir, warn: () => {} }));
});

test("validate: fails on a non-unique title-level title across files", () => {
  const { repoRoot, registryDir } = tmpRegistry({
    "a.yaml": entry({ file: "a.test.ts", title: "shared title" }),
    "b.yaml": entry({ file: "b.test.ts", title: "shared title" }),
  });
  const r = validateRegistry({ repoRoot, registryDir, warn: () => {} });
  assert.equal(r.ok, false);
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /Non-unique title-level title/);
});

test("validate: distinct titles in different files are fine", () => {
  const { repoRoot, registryDir } = tmpRegistry({
    "a.yaml": entry({ file: "a.test.ts", title: "title A" }),
    "b.yaml": entry({ file: "b.test.ts", title: "title B" }),
  });
  assert.equal(validateRegistry({ repoRoot, registryDir, warn: () => {} }).ok, true);
});

test("validate: a duplicate title that is expired still counts (catches it before it un-expires)", () => {
  // Even expired duplicates are reported so a stale collision can't merge.
  const { repoRoot, registryDir } = tmpRegistry({
    "a.yaml": entry({ file: "a.test.ts", title: "dup", expiry: "2000-01-01" }),
    "b.yaml": entry({ file: "b.test.ts", title: "dup" }),
  });
  assert.equal(validateRegistry({ repoRoot, registryDir, warn: () => {} }).ok, false);
});

test("validate: WARNS (not fails) when a title also appears in another test file", () => {
  // A title-level entry whose title exists in a DIFFERENT test file is a
  // warn-level advisory (global --testNamePattern would skip both).
  const { repoRoot, registryDir } = tmpRegistry({
    "a.yaml": entry({ file: "libs/a/x.test.ts", title: "flaky thing" }),
  });
  // Injected grep: the title also lives in libs/b/y.test.ts (another file).
  const grep = () => ["libs/a/x.test.ts", "libs/b/y.test.ts"];
  const r = validateRegistry({ repoRoot, registryDir, warn: () => {} }, grep);
  assert.equal(r.ok, true, "title-in-other-file is a warning, not a failure");
  assert.equal(r.problems.length, 0);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0], /also\s+appears in 1 other test file/);
  assert.match(r.warnings[0], /libs\/b\/y\.test\.ts/);
});

test("validate: NO warning when the title only appears in the entry's own file", () => {
  const { repoRoot, registryDir } = tmpRegistry({
    "a.yaml": entry({ file: "libs/a/x.test.ts", title: "unique thing" }),
  });
  const grep = () => ["libs/a/x.test.ts"]; // only its own file
  const r = validateRegistry({ repoRoot, registryDir, warn: () => {} }, grep);
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 0);
});

test("validate: a GLOB filter.file excludes its own covered files from the advisory", () => {
  // `filter.file` may be a glob (schema §5.2), so the own-file exclusion is
  // glob-aware — files the glob covers are the entry's own, not "another file".
  const { repoRoot, registryDir } = tmpRegistry({
    "a.yaml": entry({ file: "apps/**/*.test.tsx", title: "shared title" }),
  });
  // Both hits are covered by the glob -> should NOT warn.
  const grep = () => ["apps/x/a.test.tsx", "apps/y/b.test.tsx"];
  const r = validateRegistry({ repoRoot, registryDir, warn: () => {} }, grep);
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 0, "glob-covered files are the entry's own, not 'other' files");
});

test("expiry-check: green when nothing is expired", () => {
  const { repoRoot, registryDir } = tmpRegistry({ "a.yaml": entry() });
  const r = expiryCheck({ repoRoot, registryDir });
  assert.equal(r.ok, true);
  assert.equal(r.expired.length, 0);
});

test("expiry-check: red and lists the expired entry", () => {
  const { repoRoot, registryDir } = tmpRegistry({
    "old.yaml": entry({ expiry: "2000-01-01" }),
    "ok.yaml": entry({ file: "b.test.ts", title: "other" }),
  });
  const r = expiryCheck({ repoRoot, registryDir });
  assert.equal(r.ok, false);
  assert.equal(r.expired.length, 1);
  assert.equal(r.expired[0].entry.expiry, "2000-01-01");
});

test("expiry-check: a malformed entry surfaces as a thrown error (not a silent pass)", () => {
  const bad = `mode: skip\nreason: r\nexpiry: "2000-01-01"\nfilter:\n  file: "a.test.ts"\n`; // no owner
  const { repoRoot, registryDir } = tmpRegistry({ "bad.yaml": bad });
  assert.throws(() => expiryCheck({ repoRoot, registryDir }));
});
