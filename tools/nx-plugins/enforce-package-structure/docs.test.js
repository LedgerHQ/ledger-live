"use strict";

// The docs that cite this plugin's code cite what exists.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const rules = require("./rules");

const SKILL = path.resolve(__dirname, "../../../.agents/skills/package-public-api/SKILL.md");

/**
 * The backticked UPPER_SNAKE names in the sentence that leads to each link to `target`.
 *
 * @param {string} docFile absolute path of a markdown file
 * @param {string} target absolute path the links resolve to
 * @returns {string[]}
 */
function constantsCitedWith(docFile, target) {
  const doc = fs.readFileSync(docFile, "utf8");
  const cited = [];
  for (const link of doc.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (path.resolve(path.dirname(docFile), link[1]) !== target) continue;
    const before = doc.slice(0, link.index);
    const sentenceEnds = [...before.matchAll(/[.:]\s/g)];
    const sentence = before.slice(sentenceEnds.at(-1)?.index ?? 0);
    cited.push(...[...sentence.matchAll(/`([A-Z][A-Z0-9_]+)`/g)].map(match => match[1]));
  }
  return cited;
}

test("every rules.js constant the package-public-api skill cites exists", () => {
  const cited = constantsCitedWith(SKILL, require.resolve("./rules"));
  assert.ok(cited.length > 0, "the skill cites no rules.js constant");
  for (const name of cited) assert.ok(Object.hasOwn(rules, name), name);
});
