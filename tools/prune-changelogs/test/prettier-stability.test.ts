import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import prettier from "prettier";
import { pruneChangelog } from "../src/prune.ts";
import { changelog, versions } from "./fixtures.ts";

/**
 * `changeset version` rewrites these files through prettier on every release.
 * If pruned output were not already prettier-clean, the next release would
 * reformat it — and that reformatting would touch the top of the file, where
 * changesets inserts, turning every develop/main merge into a conflict.
 *
 * These tests pin that property so the tool can safely skip formatting.
 */

const filePath = path.join(import.meta.dirname, "CHANGELOG.md");

async function formatMarkdown(content: string): Promise<string> {
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(content, { ...config, filepath: filePath, parser: "markdown" });
}

test("prettier leaves pruned output byte-identical", async () => {
  const original = await formatMarkdown(changelog(versions(40)));
  const outcome = pruneChangelog(original, 10);
  assert.ok(outcome.changed);

  assert.equal(await formatMarkdown(outcome.text), outcome.text);
});

test("the header and newest entry survive a prettier round-trip", async () => {
  const original = await formatMarkdown(changelog(versions(40)));
  const outcome = pruneChangelog(original, 10);
  assert.ok(outcome.changed);

  const formatted = await formatMarkdown(outcome.text);
  assert.ok(formatted.startsWith(outcome.header));
  assert.ok(formatted.includes(outcome.newestSection));
});

test("pruning stays idempotent through prettier", async () => {
  const original = await formatMarkdown(changelog(versions(40)));
  const once = pruneChangelog(original, 10);
  assert.ok(once.changed);

  assert.equal(pruneChangelog(await formatMarkdown(once.text), 10).changed, false);
});

test("prettier-clean input with a fenced `## ` line stays intact", async () => {
  const body = ["- abc1234: shows a heading", "", "```md", "## 9.9.9", "```"].join("\n");
  const withFence = changelog(versions(30)).replace("- abc1234: change for 1.0.29", body);

  const original = await formatMarkdown(withFence);
  const outcome = pruneChangelog(original, 10);
  assert.ok(outcome.changed);

  assert.ok(outcome.text.includes("## 9.9.9"), "fenced heading must not be treated as a section");
  assert.equal(await formatMarkdown(outcome.text), outcome.text);
});
