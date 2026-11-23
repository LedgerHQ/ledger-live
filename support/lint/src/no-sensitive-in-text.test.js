import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import plugin from "./no-sensitive-in-text.js";

const require = createRequire(import.meta.url);
const { Linter } = require("eslint");
const parser = require("@typescript-eslint/parser");

const FIXTURES = fileURLToPath(new URL("./__fixtures__/no-sensitive-in-text", import.meta.url));

function verify(file) {
  const filename = path.join(FIXTURES, file);
  const linter = new Linter({ configType: "flat" });
  const messages = linter.verify(
    fs.readFileSync(filename, "utf8"),
    [
      {
        files: ["**/*.ts"],
        languageOptions: {
          parser,
          parserOptions: { project: "./tsconfig.json", tsconfigRootDir: FIXTURES },
        },
        plugins: { sensitive: plugin },
        rules: { "sensitive/no-sensitive-in-text": "error" },
      },
    ],
    { filename },
  );
  for (const message of messages) assert.equal(message.ruleId, "sensitive/no-sensitive-in-text");
  return messages;
}

/** @returns {string[]} `line: where` of each report */
function lint(file) {
  return verify(file).map(m => `${m.line}: ${m.message.match(/\) (.*):/)?.[1]}`);
}

test("flags a Sensitive value in every sink, nested in an object or in an array", () => {
  assert.deepEqual(lint("sinks.ts"), [
    "14: in a template literal",
    "15: in a string concatenation",
    "16: passed to String()",
    "17: passed to JSON.stringify()",
    "18: passed to log()",
    "19: passed to console.error()",
    "20: passed to invariant()",
    "21: passed to new DescriptorError()",
    "22: passed to log()",
    "23: passed to log()",
  ]);
});

test("the message names the way out", () => {
  const [first] = verify("sinks.ts");
  assert.equal(
    first?.message,
    "Sensitive value (account key or address) in a template literal: pass its AccountUUID, or maskAccountKey() for display.",
  );
});

test("does nothing without type information", () => {
  const linter = new Linter({ configType: "flat" });
  const messages = linter.verify(
    "const key = 'k'; console.log(`${key}`);",
    [{ plugins: { sensitive: plugin }, rules: { "sensitive/no-sensitive-in-text": "error" } }],
    { filename: "plain.js" },
  );
  assert.deepEqual(messages, []);
});

test("walks a type cut by the depth bound elsewhere, dictionaries, loggers and member errors", () => {
  assert.deepEqual(lint("shapes.ts"), [
    "9: passed to log()",
    "10: passed to log()",
    "11: passed to log()",
    "16: passed to DdLogs.error()",
    "17: in a template literal",
    "18: passed to new errors.SyncError()",
  ]);
});
