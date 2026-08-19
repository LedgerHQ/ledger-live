import test from "node:test";
import assert from "node:assert/strict";
import {
  buildJestFilterArgs,
  buildPlaywrightFilterArgs,
  buildDetoxFilterArgs,
  filterSpecFiles,
  filterPlaywrightSpecArgs,
} from "../src/input/filter-args.ts";
import type { LoadedEntry } from "../src/schema.ts";

function make(
  mode: "skip" | "ignore",
  file: string,
  title?: string,
  titlePattern?: string,
): LoadedEntry {
  return {
    entry: {
      mode,
      reason: "r",
      owner: "o",
      expiry: "2999-01-01",
      filter: { file, title, titlePattern },
    },
    sourcePath: "/tmp/x.yaml",
    sourceRelative: "quarantine/x.yaml",
  };
}

test("jest: file-only skip -> testPathIgnorePatterns (end-anchored)", () => {
  const { args } = buildJestFilterArgs([make("skip", "a/b.test.ts")]);
  assert.deepEqual(args, ["--testPathIgnorePatterns", "a/b\\.test\\.ts$"]);
});

test("jest: whole-file skip is end-anchored so a .tsx sibling is not over-matched", () => {
  const { args } = buildJestFilterArgs([make("skip", "a/b.test.ts")]);
  const re = new RegExp(args[1]);
  assert.ok(re.test("/repo/a/b.test.ts"), "the quarantined file matches the path tail");
  assert.ok(!re.test("/repo/a/b.test.tsx"), "the `.tsx` sibling is NOT skipped");
});

test("jest: title skip -> negative testNamePattern", () => {
  const { args } = buildJestFilterArgs([make("skip", "a.ts", "does X")]);
  assert.equal(args[0], "--testNamePattern");
  const re = new RegExp(args[1]);
  assert.ok(!re.test("does X"), "quarantined title is excluded");
  assert.ok(re.test("does Y"), "other title runs");
});

test("jest: ignore entries are NOT turned into skip filters", () => {
  const { args } = buildJestFilterArgs([make("ignore", "a.ts", "does X")]);
  assert.deepEqual(args, []);
});

test("jest: multiple titles combine into one negative pattern", () => {
  const { args } = buildJestFilterArgs([
    make("skip", "a.ts", "alpha"),
    make("skip", "b.ts", "beta"),
  ]);
  const re = new RegExp(args[1]);
  assert.ok(!re.test("alpha"));
  assert.ok(!re.test("beta"));
  assert.ok(re.test("gamma"));
});

test("playwright: title skip -> grep-invert", () => {
  const { args } = buildPlaywrightFilterArgs([make("skip", "a.spec.ts", "flaky e2e")]);
  assert.equal(args[0], "--grep-invert");
  const re = new RegExp(args[1]);
  // `--grep-invert <P>` runs tests whose title does NOT match P: the quarantined
  // title must match P (dropped), a kept title must not (runs).
  assert.ok(re.test("flaky e2e"), "quarantined title matches grep-invert => dropped");
  assert.ok(!re.test("stable e2e"), "other title does not match => runs");
});

test("playwright: titlePattern skip -> grep-invert matches substring", () => {
  const { args } = buildPlaywrightFilterArgs([make("skip", "a.spec.ts", undefined, "DEMO_SKIP")]);
  assert.equal(args[0], "--grep-invert");
  const re = new RegExp(args[1]);
  assert.ok(re.test("some DEMO_SKIP test"), "title containing the pattern is dropped");
  assert.ok(!re.test("unrelated test"), "title without the pattern runs");
});

test("playwright: EXACT title skip is anchored (no substring over-match)", () => {
  // `--grep-invert` tests the drop-set unanchored, so an exact `title` must be
  // anchored at both ends — else `title: "Foo"` would also drop "xFoo"/"Foo bar".
  const { args } = buildPlaywrightFilterArgs([make("skip", "a.spec.ts", "Foo")]);
  const re = new RegExp(args[1]);
  assert.ok(re.test("Foo"), "exact title is dropped");
  assert.ok(!re.test("xFoo"), "title with a prefix is NOT dropped");
  assert.ok(!re.test("Foo bar"), "title with a suffix is NOT dropped");
});

test("detox: title skip -> negative testNamePattern", () => {
  const { args } = buildDetoxFilterArgs([make("skip", "a.spec.ts", "flaky")]);
  assert.equal(args[0], "--testNamePattern");
  assert.ok(!new RegExp(args[1]).test("flaky"));
});

test("filterSpecFiles drops whole-file skip entries", () => {
  const files = ["e2e/specs/a.spec.ts", "e2e/specs/b.spec.ts"];
  const out = filterSpecFiles([make("skip", "e2e/specs/a.spec.ts")], files);
  assert.deepEqual(out, ["e2e/specs/b.spec.ts"]);
});

test("filterSpecFiles keeps files when only title entries present", () => {
  const files = ["e2e/specs/a.spec.ts"];
  const out = filterSpecFiles([make("skip", "e2e/specs/a.spec.ts", "some title")], files);
  assert.deepEqual(out, files);
});

test("title escaping handles regex metachars", () => {
  const { args } = buildJestFilterArgs([make("skip", "a.ts", "open (x) [y]")]);
  const re = new RegExp(args[1]);
  assert.ok(!re.test("open (x) [y]"));
  assert.ok(re.test("open x y"));
});

// --- blocker 1: literal title must be EXACT full-name match, not a substring ---
test("jest: literal title skip does NOT over-exclude by substring (alpha vs 'alpha beta')", () => {
  const { args } = buildJestFilterArgs([make("skip", "a.ts", "alpha")]);
  const re = new RegExp(args[1]);
  assert.ok(!re.test("alpha"), "exact title 'alpha' is excluded");
  assert.ok(re.test("alpha beta"), "'alpha beta' must STILL RUN (not over-excluded)");
  assert.ok(re.test("prefix alpha"), "'prefix alpha' must STILL RUN (not over-excluded)");
  assert.ok(re.test("alphabet"), "'alphabet' must STILL RUN");
});

test("jest: exclusion matches the shared matcher's exact-title semantics", () => {
  // The runner's --testNamePattern must exclude exactly the titles match.ts
  // would match (filter.title === title), no more.
  const { args } = buildJestFilterArgs([make("skip", "a.ts", "should open dialog-foo")]);
  const re = new RegExp(args[1]);
  assert.ok(!re.test("should open dialog-foo"));
  assert.ok(re.test("should open dialog-foo bar"), "longer title is a different test, runs");
});

test("detox: exact-title anchoring (no substring over-exclusion)", () => {
  // Detox `--testNamePattern` is positive-match: the keep-pattern must EXCLUDE
  // the exact title but NOT its substring sibling.
  const { args } = buildDetoxFilterArgs([make("skip", "a.spec.ts", "flaky")]);
  const re = new RegExp(args[1]);
  assert.ok(!re.test("flaky"), "exact title excluded");
  assert.ok(re.test("flaky and slow"), "substring sibling must run");
});

test("playwright: exact-title anchoring (no substring over-exclusion)", () => {
  // Playwright `--grep-invert` is negative-match: the drop-pattern must MATCH
  // the exact title (dropped) but NOT its substring sibling (which then runs).
  const { args } = buildPlaywrightFilterArgs([make("skip", "a.spec.ts", "flaky")]);
  const re = new RegExp(args[1]);
  assert.ok(re.test("flaky"), "exact title dropped");
  assert.ok(!re.test("flaky and slow"), "substring sibling must run");
});

test("jest: titlePattern stays SUBSTRING (unanchored by design)", () => {
  const { args } = buildJestFilterArgs([make("skip", "a.ts", undefined, "OnboardModal")]);
  const re = new RegExp(args[1]);
  assert.ok(!re.test("OnboardModal > opens"), "pattern matches anywhere -> excluded");
  assert.ok(!re.test("X OnboardModal Y"), "pattern matches anywhere -> excluded");
  assert.ok(re.test("Other > opens"), "non-matching title runs");
});

test("jest: mixed literal + pattern entries combine correctly", () => {
  const { args } = buildJestFilterArgs([
    make("skip", "a.ts", "alpha"),
    make("skip", "b.ts", undefined, "Foo.*Bar"),
  ]);
  const re = new RegExp(args[1]);
  assert.ok(!re.test("alpha"), "exact literal excluded");
  assert.ok(re.test("alpha beta"), "literal does NOT over-exclude");
  assert.ok(!re.test("my FooQBar end"), "pattern substring excluded");
  assert.ok(re.test("Foo only"), "non-matching runs");
});

// --- blocker 2: whole-file glob skip must produce a matching jest regex ---
test("jest: whole-file glob skip -> testPathIgnorePatterns regex matches the real path", () => {
  const { args } = buildJestFilterArgs([make("skip", "apps/**/Foo.test.tsx")]);
  const idx = args.indexOf("--testPathIgnorePatterns");
  assert.notEqual(idx, -1);
  const re = new RegExp(args[idx + 1]);
  assert.ok(
    re.test("apps/ledger-live-desktop/src/renderer/Foo.test.tsx"),
    "glob file entry must match the nested real path (not be escaped literally)",
  );
  assert.ok(re.test("apps/x/Foo.test.tsx"));
  assert.ok(!re.test("libs/x/Foo.test.tsx"), "non-matching path is not excluded");
  // It must NOT be the broken literal-escaped form.
  assert.ok(!args[idx + 1].includes("\\*"), "glob is converted to regex, not escaped literally");
});

test("jest: single-star glob does not cross slashes in testPathIgnorePatterns", () => {
  const { args } = buildJestFilterArgs([make("skip", "apps/*/Foo.test.tsx")]);
  const idx = args.indexOf("--testPathIgnorePatterns");
  const re = new RegExp(args[idx + 1]);
  assert.ok(re.test("apps/desktop/Foo.test.tsx"));
  assert.ok(!re.test("apps/a/b/Foo.test.tsx"), "* must not cross a slash");
});

// --- whole-file Playwright skip: drop the spec positional before launch ---
const REPO = "/repo";
const PW_CWD = "/repo/apps/ledger-live-desktop";

test("playwright: whole-file skip drops the matching spec positional, keeps others", () => {
  const active = [
    // file-only skip (no title), repo-relative filter.file (the documented contract)
    make("skip", "apps/ledger-live-desktop/tests/specs/general/pw-sweep-wholefile.spec.ts"),
  ];
  const args = [
    "test",
    "--config=tests/playwright.config.ts",
    "tests/specs/general/pw-sweep-wholefile.spec.ts", // dropped (matches the entry)
    "tests/specs/general/pw-sweep.spec.ts", // kept (no entry)
    "--project=mocked_tests",
    "--workers=1",
    "--retries=2",
  ];
  const out = filterPlaywrightSpecArgs(args, active, REPO, PW_CWD, () => {});
  assert.ok(
    !out.includes("tests/specs/general/pw-sweep-wholefile.spec.ts"),
    "the whole-file-skip spec positional is removed",
  );
  assert.ok(out.includes("tests/specs/general/pw-sweep.spec.ts"), "non-matched spec is kept");
  // flags + their values + the `test` token are all preserved.
  for (const a of [
    "test",
    "--config=tests/playwright.config.ts",
    "--project=mocked_tests",
    "--workers=1",
    "--retries=2",
  ]) {
    assert.ok(out.includes(a), `must preserve ${a}`);
  }
});

test("playwright: whole-file skip does NOT mistake a space-form flag value for a spec", () => {
  const active = [make("skip", "apps/ledger-live-desktop/tests/a.spec.ts")];
  // `--project mocked_tests` (space form): "mocked_tests" must not be treated as a spec.
  const args = ["test", "--project", "mocked_tests", "tests/a.spec.ts"];
  const out = filterPlaywrightSpecArgs(args, active, REPO, PW_CWD, () => {});
  assert.ok(out.includes("mocked_tests"), "space-form flag value is preserved");
  assert.ok(!out.includes("tests/a.spec.ts"), "the matched spec is dropped");
});

test("playwright: whole-file skip with NO explicit spec files warns (not a silent no-op)", () => {
  const active = [make("skip", "apps/ledger-live-desktop/tests/a.spec.ts")];
  const args = ["test", "--project=mocked_tests"]; // no spec positionals
  const warnings: string[] = [];
  const out = filterPlaywrightSpecArgs(args, active, REPO, PW_CWD, m => warnings.push(m));
  assert.deepEqual(out, args, "args unchanged when nothing can be filtered");
  assert.equal(warnings.length, 1, "exactly one warning");
  assert.match(warnings[0], /whole-file skip entry\(ies\) NOT applied/);
  assert.match(warnings[0], /quarantine\/x\.yaml/, "names the affected entry");
});

test("playwright: no file-only entries -> args untouched", () => {
  const active = [make("skip", "a.spec.ts", "some title")]; // titled, not file-only
  const args = ["test", "tests/a.spec.ts", "--project=mocked_tests"];
  assert.deepEqual(
    filterPlaywrightSpecArgs(args, active, REPO, PW_CWD, () => {}),
    args,
  );
});

test("filterSpecFiles drops whole-file GLOB skip entries (Detox/Playwright)", () => {
  const files = ["e2e/specs/sub/a.spec.ts", "e2e/specs/b.spec.ts"];
  const out = filterSpecFiles([make("skip", "e2e/specs/**/a.spec.ts")], files);
  assert.deepEqual(out, ["e2e/specs/b.spec.ts"]);
});

// --- title-level skip scoped to the run's file set ---

test("jest: title skip is dropped when its filter.file is not in the run (no pollution)", () => {
  // A Playwright-spec entry must NOT contribute to the jest pattern when the
  // jest run's files don't include it (cross-runner pollution fix).
  const entry = make("skip", "apps/ledger-live-desktop/tests/specs/foo.spec.ts", "T");
  const runFiles = ["libs/a/x.test.ts", "libs/a/y.test.ts"]; // jest's actual files
  const { args } = buildJestFilterArgs([entry], runFiles);
  assert.deepEqual(args, [], "PW-spec entry contributes no jest filter when not in the run");
});

test("jest: title skip APPLIES when its filter.file IS in the run", () => {
  const entry = make("skip", "libs/a/x.test.ts", "T");
  const { args } = buildJestFilterArgs([entry], ["libs/a/x.test.ts", "libs/b/y.test.ts"]);
  assert.equal(args[0], "--testNamePattern");
  const re = new RegExp(args[1]);
  assert.ok(!re.test("T"), "quarantined title excluded (its file is in the run)");
  assert.ok(re.test("U"), "sibling runs");
});

test("jest: omitting runFiles keeps the legacy global behaviour (unscoped)", () => {
  const entry = make("skip", "apps/ledger-live-desktop/tests/specs/foo.spec.ts", "T");
  const { args } = buildJestFilterArgs([entry]); // no runFiles -> unscoped
  assert.equal(args[0], "--testNamePattern");
  assert.ok(!new RegExp(args[1]).test("T"), "unscoped: still excludes the title");
});

test("playwright: title skip scoped to spec files in the run (no jest pollution)", () => {
  const entry = make("skip", "libs/a/x.test.ts", "T"); // a jest test, not this PW run
  const pwRunFiles = ["apps/ledger-live-desktop/tests/specs/foo.spec.ts"];
  const { args } = buildPlaywrightFilterArgs([entry], pwRunFiles);
  assert.deepEqual(args, [], "jest entry contributes no --grep-invert to the PW run");
});

test("playwright: title skip APPLIES when its spec is in the run", () => {
  const entry = make("skip", "apps/ledger-live-desktop/tests/specs/foo.spec.ts", "T");
  const { args } = buildPlaywrightFilterArgs(
    [entry],
    ["apps/ledger-live-desktop/tests/specs/foo.spec.ts"],
  );
  assert.equal(args[0], "--grep-invert");
  assert.ok(new RegExp(args[1]).test("T"), "title in the run's spec is dropped by grep-invert");
});
