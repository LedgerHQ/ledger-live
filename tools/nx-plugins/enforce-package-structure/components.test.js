"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  checkComponents,
  classifyEntries,
  collectEntryComponents,
  resolveRelative,
} = require("./components");

const UNIVERSAL = { ".": { "react-native": "./src/index.native.ts", default: "./src/index.ts" } };

/**
 * @param {Record<string, string | object>} files paths relative to the package root
 * @returns {string} workspace root holding the package at `shared/thing`
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "package-components-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, "shared/thing", file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(
      full,
      typeof content === "string" ? content : JSON.stringify(content, null, 2),
    );
  }
  return root;
}

/**
 * @param {Record<string, string | object>} files
 * @returns {string[]} `rule code subject` per violation
 */
function check(files) {
  return checkComponents(workspace(files), "shared/thing").map(
    v => `${v.rule} ${v.code} ${v.subject}`,
  );
}

/**
 * @param {Record<string, string | object>} files
 */
function universalComponents(files) {
  const root = workspace(files);
  const pkg = path.join(root, "shared/thing");
  const manifest = JSON.parse(fs.readFileSync(path.join(pkg, "package.json"), "utf8"));
  const [entry] = collectEntryComponents(pkg, manifest.exports).universal;
  return { web: [...entry.components.web.keys()], native: [...entry.components.native.keys()] };
}

function button(name) {
  return `export function ${name}() { return null; }\n`;
}

test("R1 passes: a universal component exported on both platforms under one name", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: UNIVERSAL },
      "src/index.ts": 'export * from "./Button";\n',
      "src/index.native.ts": 'export * from "./Button";\n',
      "src/Button.web.tsx": button("Button"),
      "src/Button.native.tsx": button("Button"),
    }),
    [],
  );
});

test("R1 fails: a component on one platform, and a pair renamed per platform", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: UNIVERSAL },
      "src/index.ts": 'export * from "./Actions";\n',
      "src/index.native.ts": 'export * from "./Actions";\nexport * from "./Sheet";\n',
      "src/Actions.web.tsx": button("Actions"),
      "src/Actions.native.tsx": button("ActionsMenu"),
      "src/Sheet.native.tsx": button("Sheet"),
    }),
    ["R1 universal-parity Actions", "R1 universal-parity ActionsMenu", "R1 universal-parity Sheet"],
  );
});

test("R5 passes: a platform entry on a suffixed module of its own, with its own components", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: { ...UNIVERSAL, "./native": "./src/nativeExports.native.ts" } },
      "src/index.ts": 'export * from "./Widget";\n',
      "src/index.native.ts": 'export * from "./Widget";\n',
      "src/Widget.tsx": button("Widget"),
      "src/nativeExports.native.ts": 'export * from "./WalletCta.native";\n',
      "src/WalletCta.native.tsx": button("WalletCta"),
    }),
    [],
  );
});

test("R5 passes: platform entries only, each with its own props", () => {
  assert.deepEqual(
    check({
      "package.json": {
        exports: { "./web": "./src/index.web.ts", "./native": "./src/index.native.ts" },
      },
      "src/index.web.ts": 'export * from "./Lottie";\n',
      "src/index.native.ts": 'export * from "./Lottie";\n',
      "src/Lottie.web.tsx": button("Lottie"),
      "src/Lottie.native.tsx": button("Lottie"),
    }),
    [],
  );
});

test("R5 fails: a component exported from a universal entry and a platform entry", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: { ...UNIVERSAL, "./native": "./src/nativeExports.native.ts" } },
      "src/index.ts": 'export * from "./Widget";\n',
      "src/index.native.ts": 'export * from "./Widget";\n',
      "src/Widget.tsx": button("Widget"),
      "src/nativeExports.native.ts": 'export { Widget } from "./Widget";\n',
    }),
    ["R5 component-in-both-entries Widget"],
  );
});

test("R5 fails: a platform entry that re-exports a universal component under another name", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: { ...UNIVERSAL, "./native": "./src/nativeExports.native.ts" } },
      "src/index.ts": 'export * from "./Widget";\n',
      "src/index.native.ts": 'export * from "./Widget";\n',
      "src/Widget.tsx": button("Widget"),
      "src/nativeExports.native.ts": 'export { Widget as NativeWidget } from "./Widget";\n',
    }),
    ["R5 component-in-both-entries NativeWidget"],
  );
});

test("R5 fails: a platform entry that repeats the universal entry", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: { ...UNIVERSAL, "./native": "./src/index.native.ts" } },
      "src/index.ts": 'export * from "./Widget";\n',
      "src/index.native.ts": 'export * from "./Widget";\n',
      "src/Widget.tsx": button("Widget"),
    }),
    ["R5 platform-entry-shared-module ./native", "R5 component-in-both-entries Widget"],
  );
});

test("R5 fails: a platform entry on a module without its platform's suffix", () => {
  const found = checkComponents(
    workspace({
      "package.json": { exports: { "./web": "./src/web.ts" } },
      "src/web.ts": 'export * from "./Lottie";\n',
      "src/Lottie.web.tsx": button("Lottie"),
    }),
    "shared/thing",
  );
  assert.deepEqual(
    found.map(v => `${v.rule} ${v.code} ${v.subject}`),
    ["R5 platform-entry-unsuffixed ./web"],
  );
  assert.equal(found[0].file, "shared/thing/package.json");
  assert.equal(found[0].line, 3);
});

test("components: PascalCase functions of a .tsx module, memo and forwardRef included", () => {
  const source = [
    'import { createContext, forwardRef, memo } from "react";',
    "import * as React from 'react';",
    "export function Declared() { return null; }",
    "export const Arrow = () => null;",
    "export const Expression = function () { return null; };",
    "export const Memoised = memo(function Inner() { return null; });",
    "export const Forwarded = forwardRef((props, ref) => null);",
    "export const Namespaced = React.memo(() => null);",
    "export const Cast = (() => null) as unknown as () => null;",
    "export const ThingContext = createContext(null);",
    "export const Config = { a: 1 };",
    "export function useThing() { return null; }",
    "export class Legacy {}",
  ].join("\n");
  const files = {
    "package.json": { exports: UNIVERSAL },
    "src/index.ts": 'export * from "./all";\nexport * from "./plain";\n',
    "src/index.native.ts": 'export * from "./all";\nexport * from "./plain";\n',
    "src/all.tsx": source,
    "src/plain.ts": button("NotInTsx"),
  };
  const expected = [
    "Declared",
    "Arrow",
    "Expression",
    "Memoised",
    "Forwarded",
    "Namespaced",
    "Cast",
  ];
  assert.deepEqual(universalComponents(files), { web: expected, native: expected });
});

test("re-exports are followed to the declaring module", () => {
  const files = {
    "package.json": { exports: UNIVERSAL },
    "src/index.ts": [
      'export { default as Defaulted } from "./Defaulted";',
      'export { Original as Renamed } from "./Original";',
      'export * from "./nested";',
      'export type { Props } from "./types";',
      'export type * from "./types";',
      'export * as namespace from "./Original";',
    ].join("\n"),
    "src/index.native.ts": 'export * from "./nested";\n',
    "src/Defaulted.tsx": "export default function Defaulted() { return null; }\n",
    "src/Original.tsx": button("Original"),
    "src/nested/index.ts": 'import { Bound } from "./Bound";\nexport { Bound };\n',
    "src/nested/Bound.tsx": "const Bound = () => null;\nexport default Bound;\nexport { Bound };\n",
    "src/types.ts": "export type Props = {};\n",
  };
  assert.deepEqual(universalComponents(files), {
    web: ["Defaulted", "Renamed", "Bound"],
    native: ["Bound"],
  });
});

test("web resolution follows Rspack: .web first, then unsuffixed", () => {
  const root = workspace({
    "src/index.ts": "",
    "src/A.web.tsx": "",
    "src/A.tsx": "",
    "src/A.native.tsx": "",
    "src/B.tsx": "",
    "src/C/index.web.ts": "",
  });
  const from = path.join(root, "shared/thing/src/index.ts");
  function name(specifier) {
    return path.basename(resolveRelative(from, specifier, "web") ?? "none");
  }
  assert.equal(name("./A"), "A.web.tsx");
  assert.equal(name("./B"), "B.tsx");
  assert.equal(name("./C"), "index.web.ts");
  assert.equal(name("./A.native"), "A.native.tsx");
  assert.equal(name("./Missing"), "none");
  assert.equal(resolveRelative(from, "react", "web"), null);
});

test("native resolution follows Re.Pack: .ios or .android, then .native, then unsuffixed", () => {
  const root = workspace({
    "src/index.ts": "",
    "src/A.ios.tsx": "",
    "src/A.native.tsx": "",
    "src/A.tsx": "",
    "src/B.android.tsx": "",
    "src/B.tsx": "",
    "src/C.native.tsx": "",
    "src/C.web.tsx": "",
    "src/C.tsx": "",
    "src/D.native.tsx": "",
    "src/D.ts": "",
  });
  const from = path.join(root, "shared/thing/src/index.ts");
  function name(specifier) {
    return path.basename(resolveRelative(from, specifier, "native") ?? "none");
  }
  assert.equal(name("./A"), "A.ios.tsx");
  assert.equal(name("./B"), "B.android.tsx");
  assert.equal(name("./C"), "C.native.tsx");
  // Re.Pack ranks extensions before suffixes: `.ts` comes before `.native.tsx`.
  assert.equal(name("./D"), "D.ts");
});

test("classifyEntries: a react-native condition makes a universal entry, a bare ./web or ./native a platform one", () => {
  const { universal, platform, unconditioned } = classifyEntries({
    ".": { "react-native": "./src/index.native.ts", default: "./src/index.ts" },
    "./hooks": {
      types: "./x.d.ts",
      "react-native": "./src/hooks.native.ts",
      default: "./src/hooks.ts",
    },
    "./native": "./src/nativeExports.native.ts",
    "./web": { "react-native": "./src/a.native.ts", default: "./src/a.ts" },
    "./state": "./src/state/index.ts",
    "./jest.native": "./src/jest.native.ts",
    "./testing": { "react-native": "./src/testing/index.native.ts", default: "./src/testing.ts" },
    "./testing/module-mock": "./src/testing/moduleMock.ts",
    "./mock/stocks": "./src/mock/stocks.ts",
    "./test": "./src/test.ts",
    "./package.json": "./package.json",
  });
  assert.deepEqual(universal, [
    { subpath: ".", web: "./src/index.ts", native: "./src/index.native.ts" },
    { subpath: "./hooks", web: "./src/hooks.ts", native: "./src/hooks.native.ts" },
    { subpath: "./web", web: "./src/a.ts", native: "./src/a.native.ts" },
  ]);
  assert.deepEqual(platform, [
    { subpath: "./native", platform: "native", target: "./src/nativeExports.native.ts" },
  ]);
  assert.deepEqual(unconditioned, [
    { subpath: "./state", target: "./src/state/index.ts" },
    { subpath: "./jest.native", target: "./src/jest.native.ts" },
  ]);
  assert.deepEqual(classifyEntries("./src/index.ts").unconditioned, [
    { subpath: ".", target: "./src/index.ts" },
  ]);
});

test("R1: root conditions without a `.` key are the root entry", () => {
  const files = {
    "src/index.ts": 'export * from "./Actions.web";\n',
    "src/index.native.ts": 'export * from "./Actions.native";\nexport * from "./Sheet.native";\n',
    "src/Actions.web.tsx": button("Actions"),
    "src/Actions.native.tsx": button("Actions"),
    "src/Sheet.native.tsx": button("Sheet"),
  };
  const expected = ["R1 universal-parity Sheet"];
  assert.deepEqual(check({ ...files, "package.json": { exports: UNIVERSAL } }), expected);
  assert.deepEqual(check({ ...files, "package.json": { exports: UNIVERSAL["."] } }), expected);
});

test("test support entries are not checked", () => {
  assert.deepEqual(
    check({
      "package.json": {
        exports: {
          ...UNIVERSAL,
          "./testing": { "react-native": "./src/testing.native.ts", default: "./src/testing.ts" },
        },
      },
      "src/index.ts": 'export * from "./Sheet";\n',
      "src/index.native.ts": 'export * from "./Sheet";\n',
      "src/Sheet.tsx": button("Sheet"),
      "src/testing.ts": "export {};\n",
      "src/testing.native.ts": 'export * from "./SheetMock";\n',
      "src/SheetMock.native.tsx": button("SheetMock"),
    }),
    [],
  );
});

test("R1 passes: an entry without a condition whose modules differ per platform, same names", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: { ".": "./src/index.ts" } },
      "src/index.ts": 'export { TrackPage } from "./TrackPage";\n',
      "src/TrackPage.web.tsx": button("TrackPage"),
      "src/TrackPage.native.tsx": button("TrackPage"),
    }),
    [],
  );
});

test("R1 fails: an entry without a condition whose modules differ per platform, one-sided", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: { ".": "./src/index.ts" } },
      "src/index.ts": 'export * from "./Only";\n',
      "src/Only.native.tsx": button("Only"),
    }),
    ["R1 universal-parity Only"],
  );
});

test("an entry without a condition that resolves the same on both platforms is not checked", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: { ".": "./src/index.ts" } },
      "src/index.ts": 'export * from "./View.web";\n',
      "src/View.web.tsx": button("View"),
    }),
    [],
  );
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "package-components-test-"));
  assert.deepEqual(checkComponents(empty, "shared/none"), []);
});

test("the config sets every setting its schema requires, and nothing else", () => {
  const schema = require("./components.config.schema.json");
  const config = require("./components.config.json");
  const settings = Object.keys(config).filter(key => key !== "$schema");
  assert.deepEqual(settings.toSorted(), schema.required.toSorted());
  assert.ok(settings.every(key => Object.hasOwn(schema.properties, key)));
});
