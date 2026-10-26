import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { findDirectives } from "./disable-directives.js";

const oxlint = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));

/**
 * @param {object} config the oxlint config, its `jsPlugins` relative to this folder
 * @param {Record<string, string>} files
 * @returns {string[]} the `file:line: plugin(rule)` of each reported problem
 */
function lint(config, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "js-plugins-test-"));
  const jsPlugins = config.jsPlugins.map(plugin => fileURLToPath(new URL(plugin, import.meta.url)));
  fs.writeFileSync(
    path.join(root, ".oxlintrc.json"),
    JSON.stringify({ ...config, plugins: [], jsPlugins }),
  );
  for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, file), content);
  }
  const { stdout } = spawnSync(oxlint, ["--format", "unix", "."], { cwd: root, encoding: "utf8" });
  return stdout
    .split("\n")
    .filter(line => /^\S+:\d+:\d+:/.test(line))
    .map(line => line.replace(/^(\S+?):(\d+):\d+: .*\[Error\/(\S+)\]$/, "$1:$2: $3"))
    .sort();
}

test("restricted-syntax reports every node matched by a selector", () => {
  const reported = lint(
    {
      jsPlugins: ["./restricted-syntax.js"],
      rules: {
        "restricted-syntax/no-restricted-syntax": [
          "error",
          { selector: "ImportDeclaration[source.value=/^@ledgerhq\\/coin-/]", message: "coin" },
          {
            selector: "ExportNamedDeclaration[source.value=/^@ledgerhq\\/coin-/]",
            message: "coin",
          },
          { selector: "ExportAllDeclaration[source.value=/^@ledgerhq\\/coin-/]", message: "coin" },
          {
            selector:
              "CallExpression[callee.object.name='shell'][callee.property.name='openExternal']",
            message: "shell",
          },
        ],
      },
    },
    {
      "send.ts": [
        'import a from "@ledgerhq/coin-evm";',
        'export { b } from "@ledgerhq/coin-evm/lib/b";',
        'export * from "@ledgerhq/coin-solana";',
        'import c from "@ledgerhq/live-common";',
        'shell.openExternal("https://ledger.com");',
        "export { a, c };",
        "",
      ].join("\n"),
    },
  );
  assert.deepEqual(reported, [
    "send.ts:1: restricted-syntax(no-restricted-syntax)",
    "send.ts:2: restricted-syntax(no-restricted-syntax)",
    "send.ts:3: restricted-syntax(no-restricted-syntax)",
    "send.ts:5: restricted-syntax(no-restricted-syntax)",
  ]);
});

test("i18next reports untranslated JSX text and keeps the allowed words", () => {
  const reported = lint(
    {
      jsPlugins: ["./i18next.js"],
      rules: { "i18next/no-literal-string": ["error", { words: { exclude: ["&minus;"] } }] },
    },
    {
      "View.tsx": [
        "export function View() {",
        "  return <Text>Hello world</Text>;",
        "}",
        "export function Minus() {",
        "  return <Text>&minus;</Text>;",
        "}",
        "export function Translated({ t }) {",
        '  return <Text>{t("key")}</Text>;',
        "}",
        "",
      ].join("\n"),
    },
  );
  assert.deepEqual(reported, ["View.tsx:2: i18next(no-literal-string)"]);
});

test("disable-directives finds bare comments and comments naming a guarded rule", () => {
  const guarded = new Set(["i18next/no-literal-string"]);
  const text = [
    "/* eslint-disable i18next/no-literal-string */",
    "// oxlint-disable-next-line",
    "a(); // eslint-disable-line no-console, i18next/no-literal-string -- reason",
    "// eslint-disable-next-line no-console",
    "/* oxlint-disable-next-line no-console -- i18next/no-literal-string */",
    "// eslint-enable i18next/no-literal-string",
    "/* eslint-disable no-console,",
    "   i18next/no-literal-string */",
    'const example = "// eslint-disable no-console"; /* eslint-disable */',
    "",
  ].join("\n");
  assert.deepEqual(
    findDirectives(text, guarded).map(({ line }) => line),
    [1, 2, 3, 7, 9],
  );
});
