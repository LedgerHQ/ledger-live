import assert from "node:assert/strict";
import test from "node:test";
import { FOOTER, FOOTER_TOKEN, pruneChangelog, stripFooter } from "../src/prune.ts";
import { splitChangelog } from "../src/split.ts";
import { changelog, HEADER, versions } from "./fixtures.ts";

const pruned = (text: string, keep: number) => {
  const outcome = pruneChangelog(text, keep);
  assert.ok(outcome.changed, "expected the changelog to be pruned");
  return outcome;
};

test("keeps exactly `keep` newest sections and reports the rest as dropped", () => {
  const outcome = pruned(changelog(versions(50)), 20);

  assert.equal(outcome.kept, 20);
  assert.equal(outcome.dropped, 30);
  assert.equal(splitChangelog(outcome.text).sections.length, 20);
});

test("retains the newest sections, not the oldest", () => {
  const outcome = pruned(changelog(["9.0.0", "8.0.0", ...versions(20)]), 2);
  const { sections } = splitChangelog(outcome.text);

  assert.equal(sections.length, 2);
  assert.ok(sections[0].startsWith("## 9.0.0"));
  assert.ok(sections[1].startsWith("## 8.0.0"));
  assert.ok(!outcome.text.includes("## 1.0.0"));
});

test("skips a changelog too short for the footer to pay for itself", () => {
  const outcome = pruneChangelog(changelog(["3.0.0", "2.0.0", "1.0.0"]), 2);

  assert.equal(outcome.changed, false);
  if (!outcome.changed) assert.equal(outcome.reason, "no-saving");
  assert.equal(outcome.text, changelog(["3.0.0", "2.0.0", "1.0.0"]));
});

test("leaves a changelog already within the limit byte-identical", () => {
  const original = changelog(versions(5));
  const outcome = pruneChangelog(original, 20);

  assert.equal(outcome.changed, false);
  assert.equal(outcome.text, original);
  if (!outcome.changed) assert.equal(outcome.reason, "under-limit");
});

test("is a no-op at exactly the limit", () => {
  const original = changelog(versions(20));
  assert.equal(pruneChangelog(original, 20).changed, false);
});

test("is idempotent: pruning the output again changes nothing", () => {
  const once = pruned(changelog(versions(50)), 20).text;
  const twice = pruneChangelog(once, 20);

  assert.equal(twice.changed, false);
  assert.equal(twice.text, once);
});

test("preserves the header byte-exactly", () => {
  const outcome = pruned(changelog(versions(30)), 10);
  assert.ok(outcome.text.startsWith(`${HEADER}\n`));
  assert.equal(outcome.header, `${HEADER}\n`);
});

test("preserves the newest entry byte-exactly", () => {
  const original = changelog(versions(30));
  const newest = splitChangelog(original).sections[0];

  const outcome = pruned(original, 10);
  assert.ok(outcome.text.includes(newest.trimEnd()));
  assert.equal(outcome.newestSection, newest.trimEnd());
});

test("appends the footer exactly once, ending with a single newline", () => {
  const outcome = pruned(changelog(versions(30)), 10);
  const occurrences = outcome.text.split(FOOTER_TOKEN).length - 1;

  assert.equal(occurrences, 1);
  assert.ok(outcome.text.endsWith(`${FOOTER}\n`));
  assert.ok(!outcome.text.endsWith("\n\n"));
});

test("re-pruning does not accumulate footers", () => {
  const once = pruned(changelog(versions(50)), 20).text;
  const twice = pruned(once, 5).text;

  assert.equal(twice.split(FOOTER_TOKEN).length - 1, 1);
});

test("always shrinks the file", () => {
  const original = changelog(versions(40));
  const outcome = pruned(original, 5);

  assert.ok(outcome.bytesAfter < outcome.bytesBefore);
  assert.equal(outcome.bytesBefore, original.length);
  assert.equal(outcome.bytesAfter, outcome.text.length);
});

test("refuses a changelog without an h1 header", () => {
  const outcome = pruneChangelog(changelog(versions(30)).replace(`${HEADER}\n`, ""), 10);

  assert.equal(outcome.changed, false);
  if (!outcome.changed) assert.equal(outcome.reason, "malformed-header");
});

test("rejects a non-positive or fractional keep", () => {
  for (const keep of [0, -1, 1.5, Number.NaN]) {
    assert.throws(() => pruneChangelog(changelog(versions(5)), keep), RangeError);
  }
});

test("stripFooter removes only the generated footer line", () => {
  const body = `${HEADER}\n\n## 1.0.0\n\n- abc1234: a real <!-- comment --> in an entry\n\n${FOOTER}\n`;
  const stripped = stripFooter(body);

  assert.ok(!stripped.includes(FOOTER_TOKEN));
  assert.ok(stripped.includes("a real <!-- comment --> in an entry"));
});
