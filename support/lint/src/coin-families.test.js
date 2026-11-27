import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import plugin, { classifyImport, isCoinFamiliesDisable } from "./coin-families.js";

const RULE = "no-coin-specific-import";

/**
 * @param {Record<string, string>} files paths relative to the returned root
 * @returns {string} a temporary directory holding `files`
 */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coin-families-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

// One app, with its families folder. Only the package.json matters to the classifier.
const APP = fixture({ "app/package.json": "{}" });
const generic = path.join(APP, "app", "src", "renderer", "Generic.ts");
const modalsIndex = path.join(APP, "app", "src", "renderer", "modals", "index.ts");
const inFamilies = path.join(APP, "app", "src", "renderer", "families", "aptos", "index.ts");

const CONTRACT = {
  familiesDir: "src/renderer/families",
  barrel: "contract",
  allow: ["modals-loaders"],
};
const FORBIDDEN = { familiesDir: "src/renderer/families", barrel: "forbidden" };

/** @param {string} specifier @param {string} file @param {object} options */
const classify = (specifier, file = generic, options = CONTRACT) =>
  classifyImport(specifier, file, options);

test("coin-package: reports a coin module, a live-signer, a device signer kit or wallet-btc, and their subpaths", () => {
  for (const specifier of [
    "@ledgerhq/coin-evm",
    "@ledgerhq/coin-evm/types",
    "@ledgerhq/coin-evm/lib/api",
    "@ledgerhq/live-signer-evm",
    "@ledgerhq/live-signer-tron/something",
    "@ledgerhq/device-signer-kit-ethereum",
    "@ledgerhq/device-signer-kit-solana/internal",
    "@ledgerhq/wallet-btc",
    "@ledgerhq/wallet-btc/crypto/secp256k1",
  ]) {
    assert.equal(classify(specifier), "coin-package", specifier);
  }
});

test("coin-package: excludes by full package name, not by the prefix capture", () => {
  for (const specifier of [
    "@ledgerhq/coin-module-framework",
    "@ledgerhq/coin-module-framework/api",
    "@ledgerhq/coin-framework",
    "@ledgerhq/coin-framework/account",
    "@ledgerhq/coin-modules-monitoring",
    "@ledgerhq/coin-module-boilerplate",
    "@ledgerhq/coin-tester",
    "@ledgerhq/coin-tester-evm",
    "@ledgerhq/live-common/currencies",
    "@ledgerhq/hw-app-eth",
    "@ledgerhq/device-management-kit",
    "@ledgerhq/wallet-api-client",
    "react",
  ]) {
    assert.equal(classify(specifier), null, specifier);
  }
});

test("live-common-family: reports a live-common family subpath, with or without lib or lib-es", () => {
  for (const specifier of [
    "@ledgerhq/live-common/families/evm/types",
    "@ledgerhq/live-common/lib/families/evm/types",
    "@ledgerhq/live-common/lib-es/families/evm",
  ]) {
    assert.equal(classify(specifier), "live-common-family", specifier);
  }
  assert.equal(classify("@ledgerhq/live-common/account/index"), null);
});

test("app-family: reports a family folder reached by alias, bare src or a relative path", () => {
  assert.equal(classify("~/renderer/families/aptos/x"), "app-family");
  assert.equal(classify("src/renderer/families/aptos"), "app-family");
  assert.equal(
    classify("./families/aptos", path.join(path.dirname(generic), "x.ts")),
    "app-family",
  );
  assert.equal(classify("../families/aptos", modalsIndex), "app-family");
});

test("app-family: a file below the folder that is no family is reported unless allowed", () => {
  assert.equal(classify("~/renderer/families/registry"), "app-family");
  assert.equal(classify("../families/modals-loaders", modalsIndex), null);
  assert.equal(classify("../families/modals-loaders", modalsIndex, FORBIDDEN), "app-family");
});

test("app-family: the barrel stays importable in contract mode and is reported in forbidden mode", () => {
  for (const specifier of [
    "~/renderer/families",
    "~/renderer/families/",
    "~/renderer/families/index",
    "~/renderer/families/index.ts",
  ]) {
    assert.equal(classify(specifier, generic, CONTRACT), null, `contract ${specifier}`);
    assert.equal(classify(specifier, generic, FORBIDDEN), "app-family", `forbidden ${specifier}`);
  }
});

test("a file inside the families folder is not checked, for any category", () => {
  assert.equal(classify("@ledgerhq/coin-aptos", inFamilies), null);
  assert.equal(classify("@ledgerhq/live-common/families/aptos/types", inFamilies), null);
  assert.equal(classify("~/renderer/families/evm", inFamilies), null);
});

test("without familiesDir only A and B are checked", () => {
  assert.equal(classifyImport("@ledgerhq/coin-evm", generic, {}), "coin-package");
  assert.equal(
    classifyImport("@ledgerhq/live-common/families/evm/x", generic, {}),
    "live-common-family",
  );
  assert.equal(classifyImport("~/renderer/families/evm", generic, {}), null);
});

test("ignores a specifier that is not a string and a file that has no name", () => {
  assert.equal(classify(undefined), null);
  assert.equal(classifyImport("@ledgerhq/coin-evm", undefined, CONTRACT), null);
});

/**
 * @param {object} options
 * @param {string} filename
 * @param {{ value: string }[]} [comments]
 */
function setup(options, filename, comments = []) {
  const descriptors = [];
  const visitors = plugin.rules[RULE].createOnce({
    filename,
    options: [options],
    report: descriptor => descriptors.push(descriptor),
    sourceCode: { getAllComments: () => comments },
  });
  visitors.before();
  return { visitors, descriptors };
}

const source = value => ({ type: "Literal", value });

const jestCallee = name => ({
  type: "MemberExpression",
  object: { type: "Identifier", name: "jest" },
  property: { type: "Identifier", name },
});

test("reads its options in before() and links the contract skill in every message", () => {
  const { visitors, descriptors } = setup(FORBIDDEN, generic);

  visitors.ImportDeclaration({ source: source("@ledgerhq/coin-evm") });
  visitors.ExportAllDeclaration({ source: source("@ledgerhq/live-common/families/evm/x") });
  visitors.ImportExpression({ source: source("~/renderer/families") });

  assert.equal(descriptors.length, 3);
  for (const descriptor of descriptors) {
    assert.match(descriptor.message, /coin-families-contract\/SKILL\.md/);
  }
  assert.match(descriptors[0].message, /coin module/);
  assert.match(descriptors[1].message, /live-common family/);
  assert.match(descriptors[2].message, /families folder/);
});

test("reports require() and the jest helpers, but not other calls", () => {
  const { visitors, descriptors } = setup(CONTRACT, generic);
  const call = (callee, value) =>
    visitors.CallExpression({ callee, arguments: [{ type: "Literal", value }] });

  call({ type: "Identifier", name: "require" }, "@ledgerhq/coin-evm");
  call(jestCallee("mock"), "@ledgerhq/coin-evm");
  call(jestCallee("requireActual"), "@ledgerhq/coin-evm");
  call({ type: "Identifier", name: "load" }, "@ledgerhq/coin-evm");

  assert.equal(descriptors.length, 3);
});

test("reports an inline disable that names a coin-families rule, and only those", () => {
  const comments = [
    { value: " oxlint-disable-next-line coin-families/no-coin-specific-import" },
    { value: " eslint-disable coin-families/no-family-branch" },
    { value: " oxlint-disable-next-line eslint/no-console" },
    { value: " the coin-families/ folder holds the families" },
  ];
  const { visitors, descriptors } = setup(CONTRACT, generic, comments);

  visitors.Program({ type: "Program" });

  assert.deepEqual(
    descriptors.map(descriptor => descriptor.node),
    [comments[0], comments[1]],
  );
  assert.match(descriptors[0].message, /Inline disables/);
});

test("declares a schema that accepts its options and refuses an unknown one", () => {
  const [schema] = plugin.rules[RULE].meta.schema;
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(Object.keys(schema.properties).sort(), ["allow", "barrel", "familiesDir"]);
  assert.deepEqual(schema.properties.barrel.enum, ["contract", "forbidden"]);
});

// The end-to-end tests run the real binary, which the agent sandbox does not allow.
const OXLINT = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
const PLUGIN = fileURLToPath(new URL("./coin-families.js", import.meta.url));

/**
 * @param {object} options the rule options
 * @returns {string} the .oxlintrc.json of a fixture
 */
function oxlintrc(options) {
  return JSON.stringify({
    plugins: [],
    jsPlugins: [PLUGIN],
    rules: { [`coin-families/${RULE}`]: ["error", options] },
  });
}

/**
 * @param {string} cwd
 * @param {string[]} [args]
 * @returns {string[]} `file:line` of each report of the rule, sorted
 */
function reports(cwd, args = []) {
  const { stdout } = spawnSync(OXLINT, ["--format", "unix", ...args, "app"], {
    cwd,
    encoding: "utf8",
  });
  return stdout
    .split("\n")
    .filter(line => line.includes(RULE))
    .map(line => line.split(":").slice(0, 2).join(":"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

test("oxlint runs the rule end to end on every import shape", () => {
  const root = fixture({
    ".oxlintrc.json": oxlintrc(CONTRACT),
    "app/package.json": "{}",
    "app/src/renderer/Generic.ts": [
      'import a from "@ledgerhq/live-signer-evm";',
      'import type { B } from "@ledgerhq/coin-evm/types";',
      'export * from "@ledgerhq/live-common/families/evm/types";',
      'const c = require("~/renderer/families/aptos");',
      'jest.mock("@ledgerhq/coin-evm");',
      'void import("src/renderer/families/aptos");',
      'type D = typeof import("@ledgerhq/coin-evm");',
      'import coin = require("@ledgerhq/coin-evm");',
      "const tpl = require(`@ledgerhq/coin-evm`);",
      "void import(`@ledgerhq/coin-evm`);",
      'const dynamic = require(`@ledgerhq/coin-${"evm"}`);',
      'import ok1 from "@ledgerhq/coin-module-framework";',
      'import ok2 from "@ledgerhq/coin-tester-evm";',
      'import ok3 from "~/renderer/families";',
      'import ok4 from "../renderer/families/modals-loaders";',
      "",
    ].join("\n"),
    "app/src/renderer/families/aptos/index.ts": 'import a from "@ledgerhq/coin-aptos";\n',
  });

  assert.deepEqual(reports(root), [
    "app/src/renderer/Generic.ts:1",
    "app/src/renderer/Generic.ts:2",
    "app/src/renderer/Generic.ts:3",
    "app/src/renderer/Generic.ts:4",
    "app/src/renderer/Generic.ts:5",
    "app/src/renderer/Generic.ts:6",
    "app/src/renderer/Generic.ts:7",
    "app/src/renderer/Generic.ts:8",
    "app/src/renderer/Generic.ts:9",
    "app/src/renderer/Generic.ts:10",
  ]);
});

test("oxlint reports the contract entry point in forbidden mode, require() included", () => {
  const root = fixture({
    ".oxlintrc.json": oxlintrc({ familiesDir: "src/families", barrel: "forbidden" }),
    "app/package.json": "{}",
    "app/src/Nav.tsx":
      'import * as families from "~/families";\nconst f = require("~/families");\n',
  });

  assert.deepEqual(reports(root), ["app/src/Nav.tsx:1", "app/src/Nav.tsx:2"]);
});

/**
 * @param {string} cwd
 * @param {string[]} args
 * @returns {{ status: number | null, stdout: string }}
 */
function oxlint(cwd, args) {
  const { status, stdout } = spawnSync(OXLINT, [...args, "app"], { cwd, encoding: "utf8" });
  return { status, stdout };
}

const LEAK_A = 'import a from "@ledgerhq/coin-evm";\n';
const LEAK_B = 'import b from "@ledgerhq/live-signer-evm";\n';
const LEAK_C = 'import c from "@ledgerhq/coin-tron";\n';

/**
 * A fixture with a baseline of today's leaks, written by oxlint itself: `Two.ts` holds two and
 * `Other.ts` one.
 */
function baselined() {
  const root = fixture({
    ".oxlintrc.json": oxlintrc({ familiesDir: "src/families", barrel: "forbidden" }),
    "app/package.json": "{}",
    "app/src/Two.ts": LEAK_A + LEAK_B,
    "app/src/Other.ts": LEAK_A,
  });
  assert.equal(oxlint(root, ["--suppress-all"]).status, 0);
  return root;
}

const write = (root, file, content) => fs.writeFileSync(path.join(root, "app/src", file), content);
const ruleReports = stdout => stdout.split("\n").filter(line => line.includes(RULE));

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
  assert.equal(oxlint(root, ["--quiet"]).status, 1);

  assert.equal(oxlint(root, ["--prune-suppressions"]).status, 0);
  assert.equal(oxlint(root, []).status, 0);
});

test("a baselined file that was deleted does not fail, and the prune drops its entry", () => {
  const root = baselined();
  fs.rmSync(path.join(root, "app/src/Other.ts"));
  const baseline = path.join(root, "oxlint-suppressions.json");

  assert.equal(oxlint(root, []).status, 0);
  assert.ok("app/src/Other.ts" in JSON.parse(fs.readFileSync(baseline, "utf8")));

  assert.equal(oxlint(root, ["--prune-suppressions"]).status, 0);
  assert.ok(!("app/src/Other.ts" in JSON.parse(fs.readFileSync(baseline, "utf8"))));
});

test("oxlint reports the inline disable of the rule, as far as a directive cannot hide it", () => {
  const root = fixture({
    ".oxlintrc.json": oxlintrc({ familiesDir: "src/families", barrel: "forbidden" }),
    "app/package.json": "{}",
    "app/src/NextLine.ts": `// oxlint-disable-next-line coin-families/${RULE}\n${LEAK_A}`,
    "app/src/WholeFile.ts": `/* oxlint-disable coin-families/${RULE} */\n${LEAK_A}`,
    "app/src/Multiline.ts": `/* oxlint-disable\n   coin-families/${RULE} */\n${LEAK_A}`,
  });

  const { stdout } = oxlint(root, ["--format", "unix"]);

  // The next-line directive silences the import but not the comment above it. A directive for the
  // whole file silences the report about itself too, also when it spans several lines: only the script
  // next to `lint:arch` catches it.
  assert.deepEqual(
    ruleReports(stdout).map(line => line.split(":").slice(0, 2).join(":")),
    ["app/src/NextLine.ts:1"],
  );
});

// The leaks and the legal imports the task names as fixtures, at the paths of the apps they come from.
const APPS = fixture({
  "apps/ledger-live-desktop/package.json": "{}",
  "apps/ledger-live-mobile/package.json": "{}",
});
const desktop = file => path.join(APPS, "apps/ledger-live-desktop/src", file);
const mobile = file => path.join(APPS, "apps/ledger-live-mobile/src", file);
const MOBILE = { familiesDir: "src/families", barrel: "forbidden" };

test("reports the real leaks listed as fixtures", () => {
  const evm = "@ledgerhq/live-signer-evm";
  const tron = "@ledgerhq/live-signer-tron";

  assert.equal(classifyImport(evm, desktop("renderer/init.tsx"), CONTRACT), "coin-package");
  assert.equal(classifyImport(tron, desktop("renderer/init.tsx"), CONTRACT), "coin-package");
  assert.equal(
    classifyImport(evm, mobile("components/EvmAddressBookSetup.tsx"), MOBILE),
    "coin-package",
  );
  assert.equal(
    classifyImport(tron, mobile("components/TronAddressBookSetup.tsx"), MOBILE),
    "coin-package",
  );
  assert.equal(
    classifyImport("~/families", mobile("components/RootNavigator/BaseNavigator.tsx"), MOBILE),
    "app-family",
  );
});

test("reports the baselined wallet-btc and device-signer-kit leaks", () => {
  const walletBtc = "@ledgerhq/wallet-btc/crypto/secp256k1";
  const signerKit = "@ledgerhq/device-signer-kit-ethereum";
  const desktopDemo =
    "renderer/screens/settings/sections/Developer/DeviceIntentExecutorDevTool/intents/getEthAddressDMKSignerDemoIntent/job.ts";
  const mobileDemo =
    "screens/Settings/Debug/Features/DeviceIntentExecutor/intents/getEthAddressDMKSignerDemoIntent/job.ts";

  assert.equal(
    classifyImport(
      walletBtc,
      desktop("renderer/webworkers/workers/publicKeyTweakAdd.ts"),
      CONTRACT,
    ),
    "coin-package",
  );
  assert.equal(classifyImport(signerKit, desktop(desktopDemo), CONTRACT), "coin-package");
  assert.equal(classifyImport(signerKit, mobile(mobileDemo), MOBILE), "coin-package");
});

test("passes the negative fixtures: Desktop barrel, modals-loaders, framework, tester, families files", () => {
  const init = desktop("renderer/init.tsx");

  assert.equal(classifyImport("~/renderer/families", init, CONTRACT), null);
  assert.equal(
    classifyImport("../families/modals-loaders", desktop("renderer/modals/index.ts"), CONTRACT),
    null,
  );
  assert.equal(
    classifyImport("../families/modals-loaders", desktop("renderer/modals/types.ts"), CONTRACT),
    null,
  );
  assert.equal(classifyImport("@ledgerhq/coin-module-framework", init, CONTRACT), null);
  assert.equal(classifyImport("@ledgerhq/coin-tester-evm", init, CONTRACT), null);
  assert.equal(
    classifyImport("@ledgerhq/coin-evm", desktop("renderer/families/evm/index.ts"), CONTRACT),
    null,
  );
  assert.equal(
    classifyImport("@ledgerhq/coin-aptos", mobile("families/aptos/index.ts"), MOBILE),
    null,
  );
  assert.equal(
    classifyImport(
      "@ledgerhq/wallet-btc/crypto/secp256k1",
      desktop("renderer/families/bitcoin/live-common-setup.ts"),
      CONTRACT,
    ),
    null,
  );
});

test("reports the specifier of import x = require(), a form no other visitor sees", () => {
  const { visitors, descriptors } = setup(CONTRACT, generic);

  visitors.TSExternalModuleReference({ expression: source("@ledgerhq/coin-evm") });
  visitors.TSExternalModuleReference({ expression: source("@ledgerhq/coin-module-framework") });

  assert.equal(descriptors.length, 1);
  assert.match(descriptors[0].message, /coin module/);
});

// The forms oxlint honours as a directive were measured on oxlint 1.93.0: a comment that starts
// with the directive, with a leading newline, a comma list, several lines or a `--` description.
test("a directive is a comment that starts with it and names a coin-families rule before `--`", () => {
  const rule = "coin-families/no-coin-specific-import";

  for (const comment of [
    ` oxlint-disable-next-line ${rule}`,
    `\n eslint-disable-next-line ${rule} `,
    ` eslint-disable-next-line no-console, ${rule}`,
    ` eslint-disable-next-line no-console,\n ${rule} `,
    ` oxlint-disable\n ${rule} `,
    ` eslint-disable-line ${rule} -- a reason`,
  ]) {
    assert.equal(isCoinFamiliesDisable(comment), true, JSON.stringify(comment));
  }

  for (const comment of [
    ` Never use oxlint-disable for ${rule}`,
    " eslint-disable-next-line no-console -- report coin-families/ violations",
    ` note eslint-disable-next-line ${rule}`,
    `* eslint-disable ${rule}`,
    " eslint-disable-next-line eslint/no-console",
    " the coin-families/ folder holds the families",
  ]) {
    assert.equal(isCoinFamiliesDisable(comment), false, JSON.stringify(comment));
  }
});

const template = (cooked, expressions = []) => ({
  type: "TemplateLiteral",
  expressions,
  quasis: [{ type: "TemplateElement", value: { cooked, raw: cooked } }],
});

test("reports a template literal specifier without substitution, and skips one with substitution", () => {
  const { visitors, descriptors } = setup(CONTRACT, generic);

  visitors.CallExpression({
    callee: { type: "Identifier", name: "require" },
    arguments: [template("@ledgerhq/coin-evm")],
  });
  visitors.ImportExpression({ source: template("@ledgerhq/live-common/families/evm/types") });
  visitors.CallExpression({
    callee: { type: "Identifier", name: "require" },
    arguments: [template("@ledgerhq/coin-", [{ type: "Literal", value: "evm" }])],
  });
  visitors.CallExpression({
    callee: { type: "Identifier", name: "require" },
    arguments: [template("@ledgerhq/coin-module-framework")],
  });

  assert.equal(descriptors.length, 2);
  assert.match(descriptors[0].message, /coin module/);
  assert.match(descriptors[1].message, /live-common family/);
});
