"use strict";

// The docs that cite this plugin's code cite what exists.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const rules = require("./rules");

const SKILL = path.resolve(__dirname, "../../../.agents/skills/package-public-api/SKILL.md");

// A doc marks the rules.js constants it cites with `<!-- rules.js: NAME, OTHER_NAME -->`.
const RULES_MARKER = /<!--\s*rules\.js:\s*([^>]*?)\s*-->/g;

test("every rules.js constant the package-public-api skill cites exists", () => {
  const skill = fs.readFileSync(SKILL, "utf8");
  const markers = [...skill.matchAll(RULES_MARKER)];
  assert.ok(markers.length > 0, "the skill marks no rules.js constant");
  for (const name of markers.flatMap(marker => marker[1].split(/\s*,\s*/))) {
    assert.ok(Object.hasOwn(rules, name), `${name} is not exported by rules.js`);
    assert.ok(skill.includes(`\`${name}\``), `${name} is marked but not cited`);
  }
});
