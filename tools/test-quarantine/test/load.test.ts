import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRegistry } from "../src/load.ts";

function tmpRegistry(files: Record<string, string>): { repoRoot: string; registryDir: string } {
  const repoRoot = mkdtempSync(join(tmpdir(), "tq-load-"));
  const registryDir = join(repoRoot, "quarantine");
  mkdirSync(registryDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(registryDir, name), content, "utf8");
  }
  return { repoRoot, registryDir };
}

const valid = `
mode: skip
reason: flaky thing
owner: "@LedgerHQ/team"
expiry: "2999-01-01"
filter:
  file: "a/b/c.test.ts"
  title: "does a thing"
`;

test("loads a valid entry as active", () => {
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": valid });
  const { active, expired } = loadRegistry({ repoRoot, registryDir, warn: () => {} });
  assert.equal(active.length, 1);
  assert.equal(expired.length, 0);
  assert.equal(active[0].entry.mode, "skip");
  assert.equal(active[0].entry.filter.title, "does a thing");
});

test("mode defaults to skip when omitted", () => {
  const noMode = valid.replace("mode: skip\n", "");
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": noMode });
  const { active } = loadRegistry({ repoRoot, registryDir, warn: () => {} });
  assert.equal(active[0].entry.mode, "skip");
});

test("expired entry is warned and not applied", () => {
  const expiredYaml = valid.replace("2999-01-01", "2020-01-01");
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": expiredYaml });
  const warnings: string[] = [];
  const { active, expired } = loadRegistry({
    repoRoot,
    registryDir,
    warn: m => warnings.push(m),
  });
  assert.equal(active.length, 0);
  assert.equal(expired.length, 1);
  assert.match(warnings[0], /EXPIRED/);
});

test("entry expiring today is still active", () => {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const todayYaml = valid.replace("2999-01-01", iso);
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": todayYaml });
  const { active } = loadRegistry({ repoRoot, registryDir, now: today, warn: () => {} });
  assert.equal(active.length, 1);
});

test("missing required field throws loudly", () => {
  const bad = valid.replace('owner: "@LedgerHQ/team"\n', "");
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": bad });
  assert.throws(
    () => loadRegistry({ repoRoot, registryDir, warn: () => {} }),
    /Invalid quarantine entry/,
  );
});

test("title + titlePattern together is rejected", () => {
  const bad = valid + '  titlePattern: "^x"\n';
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": bad });
  assert.throws(
    () => loadRegistry({ repoRoot, registryDir, warn: () => {} }),
    /mutually exclusive/,
  );
});

test("bad expiry date format throws", () => {
  const bad = valid.replace("2999-01-01", "not-a-date");
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": bad });
  assert.throws(
    () => loadRegistry({ repoRoot, registryDir, warn: () => {} }),
    /Invalid quarantine entry/,
  );
});

test("invalid regex in titlePattern throws", () => {
  const bad = `
mode: skip
reason: r
owner: o
expiry: "2999-01-01"
filter:
  file: "a.ts"
  titlePattern: "("
`;
  const { repoRoot, registryDir } = tmpRegistry({ "x.yaml": bad });
  assert.throws(() => loadRegistry({ repoRoot, registryDir, warn: () => {} }), /not a valid regex/);
});

test("empty registry dir returns no entries", () => {
  const { repoRoot, registryDir } = tmpRegistry({});
  const { active, expired } = loadRegistry({ repoRoot, registryDir, warn: () => {} });
  assert.equal(active.length, 0);
  assert.equal(expired.length, 0);
});
