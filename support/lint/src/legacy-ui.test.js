import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import plugin, { globToRegExp, isLegacyModule } from "./legacy-ui.js";

/**
 * @param {Record<string, string>} files paths relative to the returned root
 * @returns {string} a temporary directory holding `files`
 */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-ui-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

const MOBILE = { modules: ["@ledgerhq/native-ui", "styled-components"] };
const DESKTOP = {
  modules: [
    "@ledgerhq/react-ui",
    "styled-components",
    "~/renderer/components/Box",
    "~/renderer/components/Text",
  ],
};

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    module: "esnext",
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    paths: {
      "*": ["./*"],
      "~/*": ["./src/*"],
      "legacy-layout": ["./src/renderer/components/Box/index.ts"],
    },
  },
});

const APPS = fixture({
  "apps/ledger-live-desktop/package.json": "{}",
  "apps/ledger-live-desktop/tsconfig.json": TSCONFIG,
  "apps/ledger-live-desktop/src/renderer/components/Box/index.ts": "export default 1;\n",
  "apps/ledger-live-desktop/src/renderer/components/Box/Box.ts": "export default 1;\n",
  "apps/ledger-live-desktop/src/renderer/components/Box/Card.tsx": "export default 1;\n",
  "apps/ledger-live-desktop/src/renderer/components/Text.ts": "export default 1;\n",
  "apps/ledger-live-desktop/src/renderer/components/BoxedValue.tsx": "export default 1;\n",
  "apps/ledger-live-desktop/src/renderer/components/TextArea.tsx": "export default 1;\n",
  "apps/ledger-live-desktop/src/renderer/screens/Home.tsx": "export default 1;\n",
  "apps/ledger-live-mobile/package.json": "{}",
});
/** @param {string} file @returns {string} */
const desktop = file => path.join(APPS, "apps/ledger-live-desktop/src", file);
/** @param {string} file @returns {string} */
const mobile = file => path.join(APPS, "apps/ledger-live-mobile/src", file);

test("a module matches itself and its subpaths, not a package that shares its prefix", () => {
  const file = mobile("screens/Home.tsx");
  assert.equal(isLegacyModule("@ledgerhq/native-ui", file, MOBILE.modules), true);
  assert.equal(isLegacyModule("@ledgerhq/native-ui/assets/icons", file, MOBILE.modules), true);
  assert.equal(isLegacyModule("styled-components/native", file, MOBILE.modules), true);
  assert.equal(isLegacyModule("@ledgerhq/native-ui-extra", file, MOBILE.modules), false);
  assert.equal(isLegacyModule("@ledgerhq/lumen-ui-rnative", file, MOBILE.modules), false);
  assert.equal(isLegacyModule(undefined, file, MOBILE.modules), false);
});

test("a ~/ entry matches any specifier the app's tsconfig resolves to it", () => {
  const file = desktop("renderer/screens/Home.tsx");
  for (const specifier of [
    "~/renderer/components/Box",
    "~/renderer/components/Box/Box",
    "src/renderer/components/Box",
    "src/renderer/components/Text",
    "../components/Box",
    "../components/Box/index.ts",
    "../components/Text",
    "../components/Text.ts",
    "legacy-layout",
  ]) {
    assert.equal(isLegacyModule(specifier, file, DESKTOP.modules), true, specifier);
  }
  for (const specifier of [
    "../components/BoxedValue",
    "../components/TextArea",
    "./Box",
    "src/renderer/components/BoxedValue",
  ]) {
    assert.equal(isLegacyModule(specifier, file, DESKTOP.modules), false, specifier);
  }
});

test("the files of a ~/ entry may import each other", () => {
  const file = desktop("renderer/components/Box/Card.tsx");
  assert.equal(isLegacyModule("./Box", file, DESKTOP.modules), false);
  assert.equal(isLegacyModule("~/renderer/components/Box/Box", file, DESKTOP.modules), false);
  assert.equal(isLegacyModule("@ledgerhq/react-ui", file, DESKTOP.modules), true);
});

test("a glob spans folders with ** and stays within one with *", () => {
  assert.equal(globToRegExp("src/screens/Settings/**").test("src/screens/Settings/a/b.tsx"), true);
  assert.equal(globToRegExp("src/screens/Settings/**").test("src/screens/SettingsX/a.tsx"), false);
  assert.equal(globToRegExp("src/*.tsx").test("src/a/b.tsx"), false);
  assert.equal(globToRegExp("src/**/x.tsx").test("src/x.tsx"), true);
  assert.equal(globToRegExp("src/a.tsx").test("src/aXtsx"), false);
});

test("the default plugin has the two rules", () => {
  assert.deepEqual(Object.keys(plugin.rules).sort(), ["no-banned-component", "no-legacy-import"]);
});

// The end-to-end tests spawn the oxlint binary on a temporary repo, whose plugin file builds the rules
// with the test's waivers.
const OXLINT = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
const PLUGIN_URL = new URL("./legacy-ui.js", import.meta.url).href;

/**
 * @param {Record<string, string>} files paths below `app/`
 * @param {object} options
 * @param {{ fileWaivers?: Record<string, string>, folderWaivers?: Record<string, string> }} [waivers] keyed by
 *   path from the temporary repo root, `app/src/...`
 * @returns {string[]} `rule file:line` of each legacy-ui report, sorted
 */
function lint(files, options, waivers = {}) {
  const rules = Object.fromEntries(
    Object.keys(plugin.rules).map(rule => [`legacy-ui/${rule}`, ["error", options]]),
  );
  const app = Object.fromEntries(Object.entries(files).map(([f, c]) => [`app/${f}`, c]));
  const root = fixture({
    ".oxlintrc.json": JSON.stringify({ plugins: [], jsPlugins: ["./plugin.js"], rules }),
    "app/package.json": "{}",
    "app/tsconfig.json": TSCONFIG,
    ...app,
  });
  const pluginSource = [
    `import { createLegacyUiPlugin } from ${JSON.stringify(PLUGIN_URL)};`,
    "export default createLegacyUiPlugin(",
    JSON.stringify({
      repoRoot: root,
      fileWaivers: {},
      folderWaivers: {},
      ...waivers,
    }),
    ");",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(root, "plugin.js"), pluginSource);
  const { stdout, stderr } = spawnSync(OXLINT, ["--format", "unix", "app"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.doesNotMatch(stdout + stderr, /Failed to load JS plugin/);
  return stdout
    .split("\n")
    .filter(line => line.includes("legacy-ui("))
    .map(line => {
      const [file, row] = line.split(":");
      return `${/legacy-ui\(([a-z-]+)\)/.exec(line)[1]} ${file}:${row}`;
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

test("no-legacy-import reports each import and re-export declaration, import type included", () => {
  const reports = lint(
    {
      "src/A.tsx": [
        'import { Flex } from "@ledgerhq/native-ui";',
        'import type { Theme } from "@ledgerhq/native-ui/styles/theme";',
        'export { Text } from "@ledgerhq/native-ui";',
        'export * from "styled-components/native";',
        'import { Button } from "@ledgerhq/lumen-ui-rnative";',
        "export const x = 1;",
        "",
      ].join("\n"),
    },
    MOBILE,
  );

  assert.deepEqual(reports, [
    "no-legacy-import app/src/A.tsx:1",
    "no-legacy-import app/src/A.tsx:2",
    "no-legacy-import app/src/A.tsx:3",
    "no-legacy-import app/src/A.tsx:4",
  ]);
});

test("no-legacy-import reports require, import(), import types and jest mocks of a legacy module", () => {
  const reports = lint(
    {
      "src/A.ts": [
        'const ui = require("@ledgerhq/native-ui");',
        'export const load = () => import("styled-components/native");',
        'export type Theme = import("styled-components").DefaultTheme;',
        'import native = require("@ledgerhq/native-ui");',
        'jest.mock("styled-components");',
        'const lumen = require("@ledgerhq/lumen-ui-rnative");',
        "export { ui, native, lumen };",
        "",
      ].join("\n"),
    },
    MOBILE,
  );

  assert.deepEqual(reports, [
    "no-legacy-import app/src/A.ts:1",
    "no-legacy-import app/src/A.ts:2",
    "no-legacy-import app/src/A.ts:3",
    "no-legacy-import app/src/A.ts:4",
    "no-legacy-import app/src/A.ts:5",
  ]);
});

test("no-legacy-import reports a relative import of the desktop Box", () => {
  const reports = lint(
    {
      "src/renderer/components/Box/index.ts": "export default 1;\n",
      "src/renderer/screens/Home.tsx": 'import Box from "../components/Box";\nexport { Box };\n',
    },
    DESKTOP,
  );

  assert.deepEqual(reports, ["no-legacy-import app/src/renderer/screens/Home.tsx:1"]);
});

const LEGACY_FILE = [
  'import styled from "styled-components/native";',
  'import { Flex } from "@ledgerhq/native-ui";',
  "export const A = styled.View``;",
  "export const B = () => <Flex />;",
  "",
].join("\n");

test("no-legacy-import skips a waived file and reports one that is not", () => {
  const reports = lint({ "src/Waived.tsx": LEGACY_FILE, "src/New.tsx": LEGACY_FILE }, MOBILE, {
    fileWaivers: { "app/src/Waived.tsx": "TEMPORARY." },
  });

  assert.deepEqual(reports, [
    "no-legacy-import app/src/New.tsx:1",
    "no-legacy-import app/src/New.tsx:2",
  ]);
});

test("no-banned-component reports the import and the JSX of a banned component, in a waived file too", () => {
  const reports = lint(
    {
      "src/A.tsx": [
        'import { Flex, Text } from "@ledgerhq/native-ui";',
        "export const A = () => (",
        "  <Flex>",
        "    <Text />",
        "  </Flex>",
        ");",
        "",
      ].join("\n"),
    },
    { ...MOBILE, bannedComponents: ["Flex"] },
    { fileWaivers: { "app/src/A.tsx": "TEMPORARY." } },
  );

  assert.deepEqual(reports, [
    "no-banned-component app/src/A.tsx:1",
    "no-banned-component app/src/A.tsx:3",
  ]);
});

test("no-banned-component reports a member of a namespace import, not a shadowed name", () => {
  const reports = lint(
    {
      "src/A.tsx": [
        'import * as UI from "@ledgerhq/native-ui";',
        'import { Flex } from "@ledgerhq/native-ui";',
        "export const A = () => (",
        "  <UI.Flex>",
        "    <UI.Text />",
        "  </UI.Flex>",
        ");",
        "export function Render(Flex) {",
        "  return <Flex />;",
        "}",
        "",
      ].join("\n"),
    },
    { ...MOBILE, bannedComponents: ["Flex"] },
  ).filter(line => line.startsWith("no-banned-component"));

  assert.deepEqual(reports, [
    "no-banned-component app/src/A.tsx:2",
    "no-banned-component app/src/A.tsx:4",
  ]);
});

test("no rule reports a file under a folder waiver", () => {
  const reports = lint(
    { "src/screens/Settings/A.tsx": LEGACY_FILE, "src/screens/Home/A.tsx": LEGACY_FILE },
    { ...MOBILE, bannedComponents: ["Flex"] },
    { folderWaivers: { "app/src/screens/Settings/**": "TEMPORARY." } },
  );

  assert.ok(reports.length > 0);
  assert.ok(
    reports.every(line => line.includes("app/src/screens/Home/")),
    reports.join("\n"),
  );
});

test("declares a schema that requires modules and refuses an unknown option", () => {
  const [schema] = plugin.rules["no-legacy-import"].meta.schema;
  assert.deepEqual(schema.required, ["modules"]);
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(Object.keys(schema.properties).sort(), ["bannedComponents", "modules"]);
});
