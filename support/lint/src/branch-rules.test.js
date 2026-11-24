import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import plugin from "./coin-families.js";

const OXLINT = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
const COIN_FAMILIES_PLUGIN = fileURLToPath(new URL("./coin-families.js", import.meta.url));
const RULE = "no-family-branch";

/**
 * @param {Record<string, string>} files paths relative to the returned root
 * @returns {string} a temporary directory holding `files`
 */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "branch-rules-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

const oxlintrc = options =>
  JSON.stringify({
    jsPlugins: [COIN_FAMILIES_PLUGIN],
    rules: { [`coin-families/${RULE}`]: options ? ["error", options] : "error" },
  });

/**
 * @param {string} cwd
 * @param {string[]} args
 * @returns {{ status: number | null, stdout: string }}
 */
function oxlint(cwd, args) {
  const { status, stdout, stderr } = spawnSync(OXLINT, [...args, "app"], {
    cwd,
    encoding: "utf8",
  });
  assert.ok(status === 0 || status === 1, `oxlint exited ${status}: ${stderr}${stdout}`);
  return { status, stdout };
}

const ruleReports = stdout => stdout.split("\n").filter(line => line.includes(RULE));

/**
 * @param {string[]} lines the source of `app/src/Generic.ts`, one entry per line
 * @returns {number[]} the lines that are reported
 */
function reportedLines(lines) {
  const root = fixture({
    ".oxlintrc.json": oxlintrc(),
    "app/package.json": "{}",
    "app/src/Generic.ts": lines.join("\n") + "\n",
  });
  const { stdout } = oxlint(root, ["--format", "unix"]);
  return ruleReports(stdout)
    .map(line => Number(line.split(":")[1]))
    .sort((a, b) => a - b);
}

test("registers the rule with a schema, so that oxlint accepts it", () => {
  assert.deepEqual(Object.keys(plugin.rules[RULE].meta.schema[0].properties), ["familiesDir"]);
});

test("D1: reports an equality between a family expression and a family literal, whatever the operator and the side", () => {
  assert.deepEqual(
    reportedLines([
      'const a = currencyFamily === "bitcoin";',
      'const b = currencyFamily !== "evm";',
      'const c = account.currency.family == "evm";',
      'const d = "evm" != transaction.family;',
      'const e = (transaction as Transaction)?.family === "tezos";',
      'const f = mainCurrencyFamily === "solana";',
      'const g = family === "xrp";',
      "const h = family === `ton`;",
    ]),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
});

test("D2: reports each case of a switch on a family expression that holds a family literal", () => {
  assert.deepEqual(
    reportedLines([
      "switch (family) {",
      '  case "xrp":',
      "    break;",
      '  case "not-a-family":',
      "    break;",
      '  case "ton":',
      "    break;",
      "  default:",
      "}",
      "switch (transaction.family) {",
      '  case "evm":',
      "    break;",
      "}",
    ]),
    [2, 6, 11],
  );
});

test("D3: reports a membership check on a list literal, a Set literal or a same-file list", () => {
  assert.deepEqual(
    reportedLines([
      'const CHAINS_WITH_FEE_DRAWER = ["evm", "tron"];',
      "const check = () => CHAINS_WITH_FEE_DRAWER.includes(transaction.family);",
      'const a = ["evm", "tron"].includes(family);',
      'const b = new Set(["evm"]).has(transaction.family);',
      'const c = ["evm"].indexOf(family) !== -1;',
      'const FAMILIES = new Set(["evm"] as const);',
      "const d = FAMILIES.has(currencyFamily);",
      'const e = (["evm"] as const).includes(family);',
    ]),
    [2, 3, 4, 5, 7, 8],
  );
});

test("D3: a same-file list declared below the function that reads it is reported too", () => {
  assert.deepEqual(
    reportedLines([
      "function isFeeDrawerChain(family: string) {",
      "  return CHAINS_WITH_FEE_DRAWER.includes(family);",
      "}",
      'const CHAINS_WITH_FEE_DRAWER = ["evm"];',
    ]),
    [2],
  );
});

test("D3: a list held by a `let` or a `var` is not tracked, as it can be reassigned", () => {
  assert.deepEqual(
    reportedLines([
      'let allowed = ["evm"];',
      'allowed = ["not-a-family"];',
      "const a = allowed.includes(family);",
      'var legacy = new Set(["evm"]);',
      "const b = legacy.has(family);",
      'const fixed = ["evm"];',
      "const c = fixed.includes(family);",
    ]),
    [7],
  );
});

test("does not report what is not a family branch", () => {
  assert.deepEqual(
    reportedLines([
      "const a = left.family === right.family;",
      'const b = typeof transaction.family === "string";',
      'const c = typeof currency === "string";',
      'const d = fontFamily === "bitcoin";',
      'const e = deviceFamily === "nanoX";',
      'const f = family === "not-a-family";',
      "const g = family === undefined;",
      "const h = byFamily[mainAccount.currency.family as keyof typeof byFamily];",
      "const i = allowedFamilies.includes(family);",
      "const j = right.every(family => leftFamilies.has(family));",
      "const k = MEMO_TAG_COINS.includes(transaction.family);",
      'const l = ["evm"].includes(currency.id);',
      'const m = currencyId === "evm";',
      'const NOT_FAMILIES = ["not-a-family"];',
      "const n = NOT_FAMILIES.includes(family);",
      "switch (kind) {",
      '  case "evm":',
      "    break;",
      "}",
      "const o = left === right;",
    ]),
    [],
  );
});

test("reports the real leaks listed as fixtures", () => {
  assert.deepEqual(
    reportedLines([
      'const isBitcoin = currencyFamily === "bitcoin";',
      "export const getMemoTagValue = (transaction: Transaction) => {",
      "  const { family } = transaction;",
      "  switch (family) {",
      '    case "xrp":',
      "      return transaction.tag;",
      '    case "ton":',
      "      return transaction.comment;",
      "  }",
      "};",
      'const CHAINS_WITH_FEE_DRAWER = ["evm", "tron"];',
      "export const hasFeeDrawer = (transaction: Transaction) =>",
      "  CHAINS_WITH_FEE_DRAWER.includes(transaction.family);",
    ]),
    [1, 5, 7, 13],
  );
});

test("a file of the families folder is not checked, the same comparison elsewhere is", () => {
  const root = fixture({
    ".oxlintrc.json": oxlintrc({ familiesDir: "src/families" }),
    "app/package.json": "{}",
    "app/src/families/bitcoin/Fees.ts": 'const a = transaction.family === "bitcoin";\n',
    "app/src/Generic.ts": 'const a = transaction.family === "bitcoin";\n',
  });

  const { stdout } = oxlint(root, ["--format", "unix"]);

  assert.deepEqual(
    ruleReports(stdout).map(line => line.split(":")[0]),
    ["app/src/Generic.ts"],
  );
});

const LEAK_A = 'const a = family === "evm";\n';
const LEAK_B = 'const b = family === "tron";\n';
const LEAK_C = 'const c = family === "xrp";\n';

/**
 * A fixture with a baseline of today's leaks, written by oxlint itself: `Two.ts` holds two and
 * `Other.ts` one.
 */
function baselined() {
  const root = fixture({
    ".oxlintrc.json": oxlintrc(),
    "app/package.json": "{}",
    "app/src/Two.ts": LEAK_A + LEAK_B,
    "app/src/Other.ts": LEAK_A,
  });
  assert.equal(oxlint(root, ["--suppress-all"]).status, 0);
  return root;
}

const write = (root, file, content) => fs.writeFileSync(path.join(root, "app/src", file), content);

test("a baselined file at its count passes", () => {
  const { status, stdout } = oxlint(baselined(), ["--format", "unix"]);

  assert.equal(status, 0);
  assert.deepEqual(ruleReports(stdout), []);
});

test("a baselined file with one violation more fails, and lists all of the file's violations", () => {
  const root = baselined();
  write(root, "Two.ts", LEAK_A + LEAK_B + LEAK_C);

  const { status, stdout } = oxlint(root, ["--format", "unix"]);

  assert.equal(status, 1);
  assert.equal(ruleReports(stdout).length, 3);
  assert.ok(ruleReports(stdout).every(line => line.startsWith("app/src/Two.ts:")));
});

test("a baselined file with one violation less fails, until the baseline is pruned", () => {
  const root = baselined();
  write(root, "Two.ts", LEAK_A);

  const stale = oxlint(root, []);
  assert.equal(stale.status, 1);
  assert.match(stale.stdout, /suppressions that do not occur anymore/);

  assert.equal(oxlint(root, ["--prune-suppressions"]).status, 0);
  assert.equal(oxlint(root, []).status, 0);
});

test("oxlint reports the inline disable of the rule, as far as a directive cannot hide it", () => {
  const root = fixture({
    ".oxlintrc.json": oxlintrc(),
    "app/package.json": "{}",
    "app/src/NextLine.ts": `// oxlint-disable-next-line coin-families/${RULE}\n${LEAK_A}`,
    "app/src/WholeFile.ts": `/* oxlint-disable coin-families/${RULE} */\n${LEAK_A}`,
  });

  const { stdout } = oxlint(root, ["--format", "unix"]);

  assert.deepEqual(
    ruleReports(stdout).map(line => line.split(":").slice(0, 2).join(":")),
    ["app/src/NextLine.ts:1"],
  );
});
