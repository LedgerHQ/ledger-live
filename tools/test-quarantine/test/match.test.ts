import test from "node:test";
import assert from "node:assert/strict";
import { matchEntry } from "../src/match.ts";
import { matchGlob, globToRegExpSource } from "../src/glob.ts";
import type { LoadedEntry, QuarantineEntry } from "../src/schema.ts";

function entry(
  partial: Partial<QuarantineEntry["filter"]> & { mode?: "skip" | "ignore" },
): LoadedEntry {
  return {
    entry: {
      mode: partial.mode ?? "skip",
      reason: "r",
      owner: "o",
      expiry: "2999-01-01",
      filter: {
        file: partial.file ?? "a/b.test.ts",
        title: partial.title,
        titlePattern: partial.titlePattern,
      },
    },
    sourcePath: "/tmp/x.yaml",
    sourceRelative: "quarantine/x.yaml",
    titleRegex: partial.titlePattern !== undefined ? new RegExp(partial.titlePattern) : undefined,
  };
}

test("matchGlob: * does not cross slash", () => {
  assert.ok(matchGlob("a/*.ts", "a/b.ts"));
  assert.ok(!matchGlob("a/*.ts", "a/b/c.ts"));
});

test("matchGlob: ** crosses slashes (incl. zero segments)", () => {
  assert.ok(matchGlob("a/**/c.ts", "a/b/d/c.ts"));
  assert.ok(matchGlob("a/**/c.ts", "a/c.ts"));
});

test("matchGlob: normalises backslashes on both sides", () => {
  assert.ok(matchGlob("a/*.ts", "a\\b.ts"));
});

test("globToRegExpSource (jest boundary): a run of 3+ stars collapses", () => {
  // `***` must behave like `**` (cross slashes) and must NOT emit `[^]*[^/]*`,
  // which would be a polynomial-backtracking shape.
  const src = globToRegExpSource("a/***/c.ts");
  assert.ok(!/\[\^\]\*\[\^\/\]\*/.test(src), "no adjacent unbounded quantifiers emitted");
  assert.ok(new RegExp(`^${src}$`).test("a/b/d/c.ts"));
});

test("globToRegExpSource (jest boundary): rejects a pathologically long glob", () => {
  assert.throws(() => globToRegExpSource("a".repeat(600)), /too long/);
});

test("glob parity: matchGlob agrees with the jest-boundary regex (dotfiles aside)", () => {
  // The jest `--testPathIgnorePatterns` string is built from globToRegExpSource
  // while all in-process matching uses matchGlob (path.matchesGlob). They must
  // agree so a glob entry skips the same files jest ignores. The one KNOWN
  // divergence — leading-dot segments (matchGlob excludes them, the regex does
  // not) — is intentional and unobservable (runners never collect dotfiles).
  const patterns = ["a/*.ts", "apps/**/*.test.tsx", "a/**/c.ts", "libs/x/y.spec.ts", "a/b?.ts"];
  const files = [
    "a/b.ts",
    "a/b/c.ts",
    "apps/x/a.test.tsx",
    "apps/x/y/a.test.tsx",
    "a/c.ts",
    "a/b/d/c.ts",
    "libs/x/y.spec.ts",
    "a/bc.ts",
  ];
  for (const p of patterns) {
    const re = new RegExp(`^${globToRegExpSource(p)}$`);
    for (const f of files) {
      assert.equal(matchGlob(p, f), re.test(f), `parity for pattern ${p} vs file ${f}`);
    }
  }
});

test("exact file + exact title matches", () => {
  const e = entry({ file: "a/b.test.ts", title: "does X" });
  assert.equal(matchEntry([e], "a/b.test.ts", "does X"), e);
  assert.equal(matchEntry([e], "a/b.test.ts", "does Y"), undefined);
  assert.equal(matchEntry([e], "other.ts", "does X"), undefined);
});

test("file-only entry matches every title in the file", () => {
  const e = entry({ file: "a/b.test.ts" });
  assert.equal(matchEntry([e], "a/b.test.ts", "anything"), e);
  assert.equal(matchEntry([e], "a/b.test.ts", "else"), e);
});

test("titlePattern matches resolved title", () => {
  const e = entry({ file: "a/b.test.ts", titlePattern: "^OnboardModal > should" });
  assert.equal(matchEntry([e], "a/b.test.ts", "OnboardModal > should open"), e);
  assert.equal(matchEntry([e], "a/b.test.ts", "Other > should open"), undefined);
});

test("glob file matches", () => {
  const e = entry({ file: "apps/**/*.test.tsx", title: "t" });
  assert.equal(matchEntry([e], "apps/desktop/src/Foo.test.tsx", "t"), e);
});

test("resolved .each title matches exactly (not the template)", () => {
  const e = entry({ file: "a.ts", title: "should open dialog-foo" });
  assert.equal(matchEntry([e], "a.ts", "should open dialog-foo"), e);
  assert.equal(matchEntry([e], "a.ts", "should open %s"), undefined);
});
