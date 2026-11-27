import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import plugin, { globToRegExp, isExempt, isLegacyModule } from "./legacy-ui.js";

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

const APPS = fixture({
  "apps/ledger-live-desktop/package.json": "{}",
  "apps/ledger-live-mobile/package.json": "{}",
});
const desktop = file => path.join(APPS, "apps/ledger-live-desktop/src", file);
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

test("a ~/ entry matches its alias and a relative import that resolves to it", () => {
  const file = desktop("renderer/screens/Home.tsx");
  for (const specifier of [
    "~/renderer/components/Box",
    "~/renderer/components/Box/Box",
    "../components/Box",
    "../components/Box/index.ts",
    "../components/Text",
    "../components/Text.ts",
  ]) {
    assert.equal(isLegacyModule(specifier, file, DESKTOP.modules), true, specifier);
  }
  for (const specifier of ["../components/BoxedValue", "../components/TextArea", "./Box"]) {
    assert.equal(isLegacyModule(specifier, file, DESKTOP.modules), false, specifier);
  }
});

test("the files of a ~/ entry may import each other", () => {
  const file = desktop("renderer/components/Box/Card.tsx");
  assert.equal(isLegacyModule("./Box", file, DESKTOP.modules), false);
});

test("a glob spans folders with ** and stays within one with *", () => {
  assert.equal(globToRegExp("src/screens/Settings/**").test("src/screens/Settings/a/b.tsx"), true);
  assert.equal(globToRegExp("src/screens/Settings/**").test("src/screens/SettingsX/a.tsx"), false);
  assert.equal(globToRegExp("src/*.tsx").test("src/a/b.tsx"), false);
  assert.equal(globToRegExp("src/**/x.tsx").test("src/x.tsx"), true);
  assert.equal(globToRegExp("src/a.tsx").test("src/aXtsx"), false);
});

test("an exempt path is matched relative to the app root", () => {
  const exemptPaths = [{ glob: "src/screens/Settings/**", reason: "newSettings" }];
  assert.equal(isExempt(mobile("screens/Settings/General/index.tsx"), exemptPaths), true);
  assert.equal(isExempt(mobile("screens/Portfolio/index.tsx"), exemptPaths), false);
  assert.equal(isExempt(mobile("screens/Portfolio/index.tsx"), undefined), false);
});

/**
 * @param {string} rule
 * @param {object} options
 * @param {string} filename
 */
function setup(rule, options, filename) {
  const descriptors = [];
  const visitors = plugin.rules[rule].createOnce({
    filename,
    options: [options],
    report: descriptor => descriptors.push(descriptor),
  });
  return { visitors, descriptors, skipped: visitors.before() === false };
}

test("every rule skips an exempt file", () => {
  const options = { ...MOBILE, exemptPaths: [{ glob: "src/screens/Account/**", reason: "x" }] };
  for (const rule of Object.keys(plugin.rules)) {
    assert.equal(setup(rule, options, mobile("screens/Account/index.tsx")).skipped, true, rule);
    assert.equal(setup(rule, options, mobile("screens/Home.tsx")).skipped, false, rule);
  }
});

// The end-to-end tests run the real binary, which the agent sandbox does not allow.
const OXLINT = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
const PLUGIN = fileURLToPath(new URL("./legacy-ui.js", import.meta.url));

/**
 * @param {Record<string, string>} files paths below `app/`
 * @param {object} options
 * @returns {string[]} `rule file:line` of each legacy-ui report, sorted
 */
function lint(files, options) {
  const rules = Object.fromEntries(
    Object.keys(plugin.rules).map(rule => [`legacy-ui/${rule}`, ["error", options]]),
  );
  const app = Object.fromEntries(Object.entries(files).map(([f, c]) => [`app/${f}`, c]));
  const root = fixture({
    ".oxlintrc.json": JSON.stringify({ plugins: [], jsPlugins: [PLUGIN], rules }),
    "app/package.json": "{}",
    ...app,
  });
  const { stdout } = spawnSync(OXLINT, ["--format", "unix", "app"], {
    cwd: root,
    encoding: "utf8",
  });
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
  ).filter(line => line.startsWith("no-legacy-import"));

  assert.deepEqual(reports, [
    "no-legacy-import app/src/A.tsx:1",
    "no-legacy-import app/src/A.tsx:2",
    "no-legacy-import app/src/A.tsx:3",
    "no-legacy-import app/src/A.tsx:4",
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

test("no-legacy-element reports a JSX element of a legacy binding, member names included", () => {
  const reports = lint(
    {
      "src/A.tsx": [
        'import { Flex, Icons } from "@ledgerhq/native-ui";',
        'import { Button } from "@ledgerhq/lumen-ui-rnative";',
        "export const A = () => (",
        "  <Flex>",
        "    <Icons.Close />",
        "    <Button />",
        "    <Flex />",
        "  </Flex>",
        ");",
        "",
      ].join("\n"),
    },
    MOBILE,
  ).filter(line => line.startsWith("no-legacy-element"));

  assert.deepEqual(reports, [
    "no-legacy-element app/src/A.tsx:4",
    "no-legacy-element app/src/A.tsx:5",
    "no-legacy-element app/src/A.tsx:7",
  ]);
});

test("no-styled-definition counts each definition once, attrs chains included", () => {
  const reports = lint(
    {
      "src/A.tsx": [
        'import styled from "styled-components/native";',
        'import { View } from "react-native";',
        "export const A = styled.View`flex: 1;`;",
        "export const B = styled(View)`flex: 1;`;",
        "export const C = styled.Text.attrs({ numberOfLines: 1 })`flex: 1;`;",
        "export const D = styled(View).attrs(() => ({}))`flex: 1;`;",
        "const other = { View: 1 };",
        "export const E = other.View;",
        "",
      ].join("\n"),
      "src/B.tsx": [
        'import s from "styled-components";',
        "export const A = s.div`color: red;`;",
        "",
      ].join("\n"),
      "src/C.tsx": "const styled = { div: 1 };\nexport const A = styled.div;\n",
    },
    MOBILE,
  ).filter(line => line.startsWith("no-styled-definition"));

  assert.deepEqual(reports, [
    "no-styled-definition app/src/A.tsx:3",
    "no-styled-definition app/src/A.tsx:4",
    "no-styled-definition app/src/A.tsx:5",
    "no-styled-definition app/src/A.tsx:6",
    "no-styled-definition app/src/B.tsx:2",
  ]);
});

test("no-banned-component reports the import and the JSX of a banned component only", () => {
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
  ).filter(line => line.startsWith("no-banned-component"));

  assert.deepEqual(reports, [
    "no-banned-component app/src/A.tsx:1",
    "no-banned-component app/src/A.tsx:3",
  ]);
});

test("no rule reports an exempt file", () => {
  const source = [
    'import styled from "styled-components/native";',
    'import { Flex } from "@ledgerhq/native-ui";',
    "export const A = styled.View``;",
    "export const B = () => <Flex />;",
    "",
  ].join("\n");
  const reports = lint(
    { "src/screens/Settings/A.tsx": source, "src/screens/Home/A.tsx": source },
    {
      ...MOBILE,
      exemptPaths: [{ glob: "src/screens/Settings/**", reason: "newSettings" }],
      bannedComponents: ["Flex"],
    },
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
  assert.deepEqual(Object.keys(schema.properties).sort(), [
    "bannedComponents",
    "exemptPaths",
    "modules",
  ]);
});
