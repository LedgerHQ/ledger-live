import assert from "node:assert/strict";
import test from "node:test";
import { hasValidHeader, joinChangelog, splitChangelog } from "../src/split.ts";
import { changelog, HEADER, section } from "./fixtures.ts";

test("splits a canonical changelog into header and newest-first sections", () => {
  const { header, sections } = splitChangelog(changelog(["1.2.0", "1.1.0", "1.0.0"]));

  assert.equal(header, `${HEADER}\n`);
  assert.equal(sections.length, 3);
  assert.ok(sections[0].startsWith("## 1.2.0"));
  assert.ok(sections[2].startsWith("## 1.0.0"));
});

test("split then join is an identity", () => {
  const original = changelog(["2.0.0", "1.9.1", "1.9.0"]);
  assert.equal(joinChangelog(splitChangelog(original)), original);
});

test("identity holds for a single-section changelog", () => {
  const original = changelog(["1.0.0"]);
  assert.equal(joinChangelog(splitChangelog(original)), original);
});

test("a `## ` line inside a backtick fence is not a section boundary", () => {
  const body = ["- abc1234: documented a heading", "", "  ```md", "  ## 9.9.9", "  ```"].join("\n");
  const text = [`${HEADER}\n`, section("1.1.0", body), section("1.0.0")].join("\n");

  const { sections } = splitChangelog(text);
  assert.equal(sections.length, 2);
  assert.ok(sections[0].includes("## 9.9.9"), "fenced heading stays inside its section");
});

test("a `## ` line inside a tilde fence is not a section boundary", () => {
  const body = ["- abc1234: tilde fence", "", "~~~md", "## 9.9.9", "~~~"].join("\n");
  const text = [`${HEADER}\n`, section("1.1.0", body), section("1.0.0")].join("\n");

  assert.equal(splitChangelog(text).sections.length, 2);
});

test("a longer closing fence still closes the block", () => {
  const body = ["- abc1234: nested fences", "", "````md", "```", "## 9.9.9", "````"].join("\n");
  const text = [`${HEADER}\n`, section("1.1.0", body), section("1.0.0")].join("\n");

  assert.equal(splitChangelog(text).sections.length, 2);
});

test("non-semver `## ` headings are not section boundaries", () => {
  const body = ["- abc1234: notes", "", "## Unreleased", "", "## Notes"].join("\n");
  const text = [`${HEADER}\n`, section("1.1.0", body), section("1.0.0")].join("\n");

  assert.equal(splitChangelog(text).sections.length, 2);
});

test("prerelease and build-metadata versions are recognised", () => {
  const { sections } = splitChangelog(
    changelog(["2.0.0-next.4", "2.0.0-nightly.20260814", "1.0.0+build.1"]),
  );
  assert.equal(sections.length, 3);
});

test("a header-only changelog yields no sections", () => {
  const { header, sections } = splitChangelog(`${HEADER}\n`);
  assert.equal(sections.length, 0);
  assert.equal(header, `${HEADER}\n`);
});

test("hasValidHeader distinguishes h1 headers from anything else", () => {
  assert.ok(hasValidHeader(`${HEADER}\n`));
  assert.ok(!hasValidHeader(""));
  assert.ok(!hasValidHeader("## 1.0.0"));
  assert.ok(!hasValidHeader("no heading at all"));
});
