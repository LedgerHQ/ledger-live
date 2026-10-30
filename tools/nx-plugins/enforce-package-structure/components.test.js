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

/**
 * A universal `Card` whose implementations import their props from `importFrom`.
 *
 * @param {Record<string, string>} files contract modules and overrides, relative to src/
 * @param {{ web?: string, native?: string }} [props] the props annotation per platform
 */
function card(files, props = {}) {
  const web = props.web ?? "Readonly<CardProps>";
  const native = props.native ?? "CardProps";
  return {
    "package.json": { exports: UNIVERSAL },
    "src/index.ts": 'export * from "./Card";\n',
    "src/index.native.ts": 'export * from "./Card";\n',
    "src/Card.web.tsx": `import type { CardProps } from "./Card.types";\nexport function Card(props: ${web}) { return null; }\n`,
    "src/Card.native.tsx": `import type { CardProps } from "./Card.types";\nexport function Card(props: ${native}) { return null; }\n`,
    ...Object.fromEntries(Object.entries(files).map(([file, content]) => [`src/${file}`, content])),
  };
}

/**
 * @param {string} props members of `CardProps`
 * @param {string} [header] lines above the type
 */
function contract(props, header = "") {
  return { "Card.types.ts": `${header}export type CardProps = Readonly<{\n${props}\n}>;\n` };
}

test("R2 passes: both implementations take one contract, Readonly accepted", () => {
  assert.deepEqual(check(card(contract("title: string;"))), []);
});

test("R2 passes: no props on either platform, forwardRef props, one shared implementation", () => {
  assert.deepEqual(
    check({
      "package.json": { exports: UNIVERSAL },
      "src/index.ts":
        'export * from "./Banner";\nexport * from "./Field";\nexport * from "./Shared";\n',
      "src/index.native.ts":
        'export * from "./Banner";\nexport * from "./Field";\nexport * from "./Shared";\n',
      "src/Banner.web.tsx": button("Banner"),
      "src/Banner.native.tsx": button("Banner"),
      "src/Field.types.ts": "export interface FieldProps { label: string }\n",
      "src/Field.web.tsx":
        'import { forwardRef } from "react";\nimport type { FieldProps } from "./Field.types";\nexport const Field = forwardRef<unknown, FieldProps>((props, ref) => null);\n',
      "src/Field.native.tsx":
        'import { forwardRef } from "react";\nimport type { FieldProps } from "./Field.types";\nexport const Field = forwardRef<unknown, FieldProps>((props, ref) => null);\n',
      "src/Shared.tsx": "export const Shared = ({ a }: { a: string }) => null;\n",
    }),
    [],
  );
});

/**
 * @param {string} callback the render callback of a `forwardRef<unknown, CardProps>` `Card`
 */
function forwardRefCard(callback) {
  return `import { forwardRef } from "react";\nimport type { CardProps } from "./Card.types";\nexport const Card = forwardRef<unknown, CardProps>(${callback});\n`;
}

test("R2 reads the forwardRef props type when the render callback takes no parameter", () => {
  const files = {
    ...card(contract("onPress: () => void;")),
    "src/Card.web.tsx": forwardRefCard("() => null"),
    "src/Card.native.tsx": forwardRefCard("(props, ref) => null"),
  };
  assert.deepEqual(check(files), ["R3 contract-gesture-callback Card"]);
});

/**
 * @param {string} props the forwardRef props argument; the render callback takes `SharedProps`
 */
function annotatedForwardRefCard(props) {
  return `import { forwardRef } from "react";\nimport type { ${props}, SharedProps } from "./Card.types";\nexport const Card = forwardRef<unknown, ${props}>((props: SharedProps, ref) => null);\n`;
}

/**
 * @param {string} platform suffix of the module that declares the render function
 */
function memoCard(platform) {
  return `import { memo } from "react";\nimport { CardImpl } from "./CardImpl.${platform}";\nexport const Card = memo(CardImpl);\n`;
}

/**
 * @param {string} props the memo props argument; the render callback takes no parameter
 */
function memoPropsCard(props) {
  return `import { memo } from "react";\nimport type { ${props} } from "./Card.types";\nexport const Card = memo<${props}>(() => null);\n`;
}

test("R2 reads the forwardRef props argument before the render function's annotation", () => {
  const files = {
    ...card({
      "Card.types.ts":
        "export type SharedProps = { title: string };\nexport type WebProps = SharedProps;\nexport type NativeProps = SharedProps;\n",
    }),
    "src/Card.web.tsx": annotatedForwardRefCard("WebProps"),
    "src/Card.native.tsx": annotatedForwardRefCard("NativeProps"),
  };
  assert.deepEqual(check(files), ["R2 props-name-mismatch Card"]);
});

test("R2 reads the props argument of memo when the render callback takes no parameter", () => {
  const files = {
    ...card({
      "Card.types.ts":
        "export type WebProps = { onPress(): void };\nexport type NativeProps = WebProps;\n",
    }),
    "src/Card.web.tsx": memoPropsCard("WebProps"),
    "src/Card.native.tsx": memoPropsCard("NativeProps"),
  };
  assert.deepEqual(check(files), [
    "R2 props-name-mismatch Card",
    "R3 contract-gesture-callback Card",
  ]);
});

test("R2 passes: memo typed with the component it wraps", () => {
  const implementation =
    'import { memo } from "react";\nimport type { CardProps } from "./Card.types";\nfunction CardImpl(props: CardProps) { return null; }\nexport const Card = memo<typeof CardImpl>(CardImpl);\n';
  const files = {
    ...card(contract("title: string;")),
    "src/Card.web.tsx": implementation,
    "src/Card.native.tsx": implementation,
  };
  assert.deepEqual(check(files), []);
});

test("R2 keeps the forwardRef props argument when the render function is imported", () => {
  const imported = `import { forwardRef } from "react";\nimport { render } from "./render";\nimport type { CardProps } from "./Card.types";\nexport const Card = forwardRef<unknown, CardProps>(render);\n`;
  const files = {
    ...card(contract("onPress: () => void;")),
    "src/Card.web.tsx": imported,
    "src/Card.native.tsx": imported,
  };
  assert.deepEqual(check(files), ["R3 contract-gesture-callback Card"]);
});

test("R2 fails: a component that wraps a render function declared in another module", () => {
  const files = {
    ...card(contract("title: string;")),
    "src/Card.web.tsx": memoCard("web"),
    "src/Card.native.tsx": memoCard("native"),
  };
  assert.deepEqual(check(files), ["R2 props-unreadable Card"]);
});

test("R2 passes: a default-exported contract imported by both implementations", () => {
  for (const contractModule of [
    "export default interface CardProps { title: string }\n",
    "type CardProps = { title: string };\nexport { CardProps as default };\n",
    "type CardProps = { title: string };\nexport type { CardProps as default };\n",
    "type CardProps = { title: string };\nexport { type CardProps as default };\n",
  ]) {
    const implementation =
      'import type CardProps from "./Card.types";\nexport function Card(props: CardProps) { return null; }\n';
    const files = {
      ...card({ "Card.types.ts": contractModule }),
      "src/Card.web.tsx": implementation,
      "src/Card.native.tsx": implementation,
    };
    assert.deepEqual(check(files), [], contractModule);
  }
});

test("R2 fails: one shared implementation whose contract resolves per platform", () => {
  const props = "export type CardProps = { title: string };\n";
  assert.deepEqual(
    check({
      "package.json": { exports: UNIVERSAL },
      "src/index.ts": 'export * from "./Card";\n',
      "src/index.native.ts": 'export * from "./Card";\n',
      "src/Card.tsx":
        'import type { CardProps } from "./Card.types";\nexport function Card(props: CardProps) { return null; }\n',
      "src/Card.types.web.ts": props,
      "src/Card.types.native.ts": props,
    }),
    ["R2 contract-mismatch Card"],
  );
});

test("R2 to R4 check same-named components of two universal entries", () => {
  const files = {
    ...card(contract("title: string;")),
    "package.json": {
      exports: {
        ...UNIVERSAL,
        "./compact": { "react-native": "./src/compact.native.ts", default: "./src/compact.ts" },
      },
    },
    "src/compact.ts": 'export * from "./compact/Card";\n',
    "src/compact.native.ts": 'export * from "./compact/Card";\n',
    "src/compact/Card.web.tsx": "export function Card(props: CompactProps) { return null; }\n",
    "src/compact/Card.native.tsx": "export function Card(props: CompactProps) { return null; }\n",
  };
  assert.deepEqual(check(files), ["R2 contract-not-found Card"]);
  const reversed = {
    ...files,
    "package.json": {
      exports: { "./compact": files["package.json"].exports["./compact"], ...UNIVERSAL },
    },
  };
  assert.deepEqual(check(reversed), ["R2 contract-not-found Card"]);
});

test("R2 fails: props on one platform, two names, an inline type", () => {
  assert.deepEqual(
    check({
      ...card(contract("title: string;"), { native: "CardNativeProps" }),
      "src/Card.native.tsx":
        'import type { CardNativeProps } from "./Card.types";\nexport function Card(props: CardNativeProps) { return null; }\n',
    }),
    ["R2 props-name-mismatch Card"],
  );
  assert.deepEqual(
    check({ ...card(contract("title: string;")), "src/Card.native.tsx": button("Card") }),
    ["R2 props-parameter-mismatch Card"],
  );
  assert.deepEqual(check(card(contract("title: string;"), { native: "{ title: string }" })), [
    "R2 props-unnamed Card",
  ]);
});

test("R2 fails: a props type declared in each implementation, or out of reach", () => {
  const local = "export type CardProps = { title: string };\n";
  assert.deepEqual(
    check({
      ...card({}),
      "src/Card.web.tsx": `${local}export function Card(props: CardProps) { return null; }\n`,
      "src/Card.native.tsx": `${local}export function Card(props: CardProps) { return null; }\n`,
    }),
    [
      "R2 contract-mismatch Card",
      "R4 platform-module-export Card",
      "R4 platform-module-export Card",
    ],
  );
  assert.deepEqual(
    check({
      ...card({}),
      "src/Card.web.tsx": "export function Card(props: CardProps) { return null; }\n",
    }),
    ["R2 contract-not-found Card"],
  );
  assert.deepEqual(
    check({
      ...card({}),
      "src/Card.web.tsx":
        'import type { CardProps } from "@shared/cards";\nexport function Card(props: CardProps) { return null; }\n',
    }),
    ["R2 contract-outside-package Card"],
  );
});

test("R2 fails: a contract that re-exports, carries a suffix or has a suffixed sibling", () => {
  assert.deepEqual(
    check(
      card({
        "Card.types.ts": 'export type { CardProps } from "./props";\n',
        "props.ts": "export type CardProps = { title: string };\n",
      }),
    ),
    ["R2 contract-reexported Card"],
  );
  assert.deepEqual(
    check({
      ...card({ "types.web.ts": "export type CardProps = { title: string };\n" }),
      "src/Card.web.tsx":
        'import type { CardProps } from "./types.web";\nexport function Card(props: CardProps) { return null; }\n',
      "src/Card.native.tsx":
        'import type { CardProps } from "./types.web";\nexport function Card(props: CardProps) { return null; }\n',
    }),
    ["R2 contract-suffixed Card"],
  );
  assert.deepEqual(
    check(
      card({
        ...contract("title: string;"),
        "Card.types.native.ts": "export type CardProps = { title: string };\n",
      }),
    ),
    ["R2 contract-mismatch Card"],
  );
  // Re.Pack ranks `.ts` before `.native.tsx`, so this sibling waits for a rename to shadow it.
  assert.deepEqual(
    check(card({ ...contract("title: string;"), "Card.types.native.tsx": "export {};\n" })),
    ["R2 contract-shadowed Card"],
  );
});

test("R3 fails: a contract that imports a platform package", () => {
  for (const specifier of [
    "react-native",
    "react-native-svg",
    "@ledgerhq/lumen-ui-react",
    "@ledgerhq/lumen-utils-shared",
    "react-dom",
  ]) {
    assert.deepEqual(
      check(card(contract("title: string;", `import type { X } from "${specifier}";\n`))),
      ["R3 contract-platform-import Card"],
      specifier,
    );
  }
  assert.deepEqual(check(card(contract('icon: import("@ledgerhq/lumen-ui-rnative").Icon;'))), [
    "R3 contract-platform-import Card",
  ]);
});

test("R3 passes: a type-only import of a neutralImportTypes name", () => {
  for (const specifier of ["@ledgerhq/lumen-ui-react", "@ledgerhq/lumen-ui-rnative"]) {
    for (const [props, header] of [
      ["value: FormattedValue;", `import type { FormattedValue } from "${specifier}";\n`],
      ["value: FormattedValue;", `import { type FormattedValue } from "${specifier}";\n`],
      ["value: Amount;", `import type { FormattedValue as Amount } from "${specifier}";\n`],
      [`value: import("${specifier}").FormattedValue;`, ""],
    ]) {
      assert.deepEqual(
        check(card(contract(props, header))),
        [],
        `${specifier}: ${header || props}`,
      );
    }
  }
});

test("R3 fails: a Lumen import that is not a type-only neutralImportTypes name", () => {
  for (const [props, header] of [
    // A web component in a platform-neutral contract.
    ["icon: typeof Bell;", 'import { Bell } from "@ledgerhq/lumen-ui-react/symbols";\n'],
    ["icon: Bell;", 'import type { Bell } from "@ledgerhq/lumen-ui-react/symbols";\n'],
    ["value: FormattedValue;", 'import { FormattedValue } from "@ledgerhq/lumen-ui-react";\n'],
    [
      "value: FormattedValue;",
      'import type { FormattedValue, ButtonProps } from "@ledgerhq/lumen-ui-react";\n',
    ],
    ["value: Lumen.FormattedValue;", 'import type * as Lumen from "@ledgerhq/lumen-ui-react";\n'],
    [
      "value: FormattedValue;",
      'import type { FormattedValue } from "@ledgerhq/lumen-utils-shared";\n',
    ],
    ['button: import("@ledgerhq/lumen-ui-react").ButtonProps;', ""],
    ['format: typeof import("@ledgerhq/lumen-ui-react").FormattedValue;', ""],
  ]) {
    assert.deepEqual(
      check(card(contract(props, header))),
      ["R3 contract-platform-import Card"],
      header || props,
    );
  }
});

test("R3 fails: a contract that references a global DOM type, once per name", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          [
            "ref?: Ref<HTMLElement>;",
            "anchor?: Ref<Element>;",
            "target?: Ref<HTMLElement>;",
            "onHover: (event: MouseEvent) => void;",
            "onSearch: (event: Event) => void;",
            "source?: EventTarget;",
            "layout: CSSStyleDeclaration;",
          ].join("\n"),
          'import type { Ref } from "react";\n',
        ),
      ),
    ),
    [
      "R3 contract-global-type Card",
      "R3 contract-global-type Card",
      "R3 contract-global-type Card",
      "R3 contract-global-type Card",
      "R3 contract-global-type Card",
      "R3 contract-global-type Card",
    ],
  );
});

test("R3 fails: a typeof query on a DOM global", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          "target?: typeof document;\nref?: Ref<InstanceType<typeof HTMLInputElement>>;",
          'import type { Ref } from "react";\n',
        ),
      ),
    ),
    ["R3 contract-global-type Card", "R3 contract-global-type Card"],
  );
});

test("R3 fails: a typeof query on a global that only a type declaration shares a name with", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          "eventConstructor: typeof Event;\nwrapped: Wrap<string>;",
          "type Event = { value: string };\ntype Wrap<HTMLElement> = { node: typeof HTMLElement };\n",
        ),
      ),
    ),
    ["R3 contract-global-type Card", "R3 contract-global-type Card"],
  );
});

test("R3 fails: a global hidden only by a type parameter of another declaration", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          "onInspect(value: Event): void;\nhandle: Handler<string>;",
          "type Handler<Event> = (value: Event) => void;\n",
        ),
      ),
    ),
    ["R3 contract-global-type Card"],
  );
});

test("R3 fails: a React type outside the neutral ones, however it is reached", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          [
            "layout?: Styles;",
            "onSearch: (event: R.ChangeEvent<string>) => void;",
            "onShortcut: React.KeyboardEventHandler;",
            'attributes: import("react").HTMLAttributes<object>;',
          ].join("\n"),
          [
            'import type { CSSProperties as Styles } from "react";',
            'import * as R from "react";',
            "interface Extra extends React.ButtonHTMLAttributes<object> {}",
            "",
          ].join("\n"),
        ),
      ),
    ),
    [
      "R3 contract-react-type Card",
      "R3 contract-react-type Card",
      "R3 contract-react-type Card",
      "R3 contract-react-type Card",
      "R3 contract-react-type Card",
    ],
  );
});

test("R3 fails: a React Native type through its import alone", () => {
  assert.deepEqual(
    check(card(contract("inset: ViewStyle;", 'import type { ViewStyle } from "react-native";\n'))),
    ["R3 contract-platform-import Card"],
  );
});

test("R3 passes: declared, imported, ECMAScript and neutral React types", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          [
            "ref?: Ref<CardHandle>;",
            "event: TrackingEvent;",
            "node: ReactNode;",
            "icon: JSX.Element;",
            "badge: React.JSX.Element;",
            'footer: import("react").JSX.Element;',
            "items: ReadonlyArray<Record<string, Date>>;",
            "load: () => Promise<Map<string, Set<number>>>;",
            "pick: <T extends string>(value: T) => Partial<{ [K in T]: Uppercase<K> }>;",
            "value: Unwrap<Promise<string>>;",
            "size: (typeof sizes)[number];",
            "timer?: ReturnType<typeof setTimeout>;",
          ].join("\n"),
          [
            'import type { JSX, ReactNode, Ref } from "react";',
            'import type { TrackingEvent } from "./tracking";',
            "interface CardHandle { focus(): void }",
            "type Unwrap<T> = T extends Promise<infer U> ? U : T;",
            'const sizes = ["s", "m"] as const;',
            "",
          ].join("\n"),
        ),
      ),
    ),
    [],
  );
});

test("R3 fails: a contract that declares className or style", () => {
  assert.deepEqual(check(card(contract("className?: string;\nstyle?: object;"))), [
    "R3 contract-platform-prop Card",
    "R3 contract-platform-prop Card",
  ]);
});

test("R3 fails: gesture and DOM event callback names, on whole camelCase words", () => {
  const rejected = [
    "onPress",
    "onEditPress",
    "onClick",
    "onDoubleTap",
    "onTouchStart",
    "onMouseEnter",
    "onPointerDown",
    "onChange",
    "onChangeText",
    "onSubmit",
    "onFocus",
    "onBlur",
    "onKey",
    "onKeyDown",
  ];
  for (const name of rejected) {
    assert.deepEqual(
      check(card(contract(`${name}: () => void;`))),
      ["R3 contract-gesture-callback Card"],
      name,
    );
  }
  assert.deepEqual(check(card(contract("select(): void;"))), []);
  assert.deepEqual(check(card(contract("press(): void;"))), ["R3 contract-gesture-callback Card"]);
});

test("R3 passes: intent callbacks, and gesture words inside a longer word or outside callbacks", () => {
  const accepted = [
    "onEdit: () => void;",
    "onPressureChange: (value: number) => void;",
    "onKeyboardShow: () => void;",
    "onSearchQueryChange: (query: string) => void;",
    "onTapestryOpen: () => void;",
    "touchCount: number;",
  ];
  assert.deepEqual(check(card(contract(accepted.join("\n")))), []);
});

test("R3 follows the contract's own types, not imported ones", () => {
  assert.deepEqual(
    check(
      card({
        "Card.types.ts": [
          'import type { Remote } from "./remote";',
          "type Base = { onPress: () => void };",
          "interface Extra extends Base { className?: string }",
          "export type CardProps = Readonly<Extra & Remote & { title: string }>;",
        ].join("\n"),
        "remote.ts": "export type Remote = { onClick: () => void };\n",
      }),
    ),
    ["R3 contract-platform-prop Card", "R3 contract-gesture-callback Card"],
  );
});

test("R3 checks the local types a contract's props hold, at any depth", () => {
  assert.deepEqual(
    check(
      card({
        "Card.types.ts": [
          "type Tile = { onPress: () => void; children?: readonly Tile[] };",
          "interface Group { items: Array<{ style?: object }> }",
          "export type CardProps = Readonly<{",
          "  tiles: readonly Tile[];",
          "  groups: Group[];",
          "  onSelect: (tile: { onClick(): void }) => void;",
          "}>;",
        ].join("\n"),
      }),
    ),
    ["R3 contract-gesture-callback Card", "R3 contract-platform-prop Card"],
  );
});

test("R3 checks the values of an index signature", () => {
  for (const contractModule of [
    "export type CardProps = { items: { [id: string]: { onPress(): void } } };\n",
    "interface Tiles { [id: string]: { onPress(): void } }\nexport type CardProps = { items: Tiles };\n",
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": contractModule })),
      ["R3 contract-gesture-callback Card"],
      contractModule,
    );
  }
});

test("R3 checks the value a getter returns", () => {
  for (const contractModule of [
    "export type CardProps = { item: { get value(): { onPress(): void } } };\n",
    "interface Item { get value(): { onPress(): void } }\nexport type CardProps = { item: Item };\n",
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": contractModule })),
      ["R3 contract-gesture-callback Card"],
      contractModule,
    );
  }
});

test("R3 checks the local types a prop holds behind a local alias", () => {
  for (const aliases of [
    "type Tile = { onPress(): void };\ntype Tiles = Tile[];",
    "type Tiles = ReadonlyArray<{ onPress(): void }>;",
    "type List<T> = Array<T & { onPress(): void }>;\ntype Tiles = List<{ title: string }>;",
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": `${aliases}\nexport type CardProps = { items: Tiles };\n` })),
      ["R3 contract-gesture-callback Card"],
      aliases,
    );
  }
});

test("R3 follows cyclic local aliases once", () => {
  assert.deepEqual(
    check(
      card({
        "Card.types.ts": [
          "type Tiles = Tile[];",
          "type Tile = Tiles | { onPress(): void };",
          "export type CardProps = { items: Tiles };",
        ].join("\n"),
      }),
    ),
    ["R3 contract-gesture-callback Card"],
  );
});

test("R3 does not resolve a type parameter to the module-level type it shadows", () => {
  for (const contractModule of [
    "type List<Tile> = Tile[];\nexport type CardProps = { items: List<string> };\n",
    "type Box<Tile> = { value: Tile };\nexport type CardProps = Box<string>;\n",
    "type Identity<Tile> = Tile;\ntype Tiles = Identity<string>[];\nexport type CardProps = { items: Tiles };\n",
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": `type Tile = { onPress(): void };\n${contractModule}` })),
      [],
      contractModule,
    );
  }
});

test("R3 does not check the type arguments of a local callback alias", () => {
  for (const contractModule of [
    "type Handler<T> = (value: T) => void;\nexport type CardProps = { onSelect: Handler<{ onPress(): void }> };\n",
    "type Handler<T> = (value: T) => void;\ntype SelectHandler = Handler<{ onPress(): void }>;\nexport type CardProps = { onSelect: SelectHandler };\n",
    "type Handler<T> = (value: T) => void;\ntype Relay<T> = Handler<T>;\nexport type CardProps = { onSelect: Relay<{ onPress(): void }> };\n",
    "type Handler<T> = ((value: T) => void) | undefined;\ntype SelectHandler = Handler<{ onPress(): void }>;\nexport type CardProps = { onSelect: SelectHandler };\n",
    "type Handler<T> = ((value: T) => void) | null;\nexport type CardProps = { onSelect: Handler<{ onPress(): void }> };\n",
  ]) {
    assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [], contractModule);
  }
});

test("R3 does not check a type argument a local generic drops", () => {
  const argument = "{ title: string; onPress(): void }";
  for (const contractModule of [
    `type WithoutPress<T> = Omit<T, "onPress">;\ntype Tiles = WithoutPress<${argument}>[];\nexport type CardProps = { items: Tiles };\n`,
    `type WithoutPress<T> = Omit<T, "onPress">;\nexport type CardProps = { items: WithoutPress<${argument}>[] };\n`,
    `type Label<T> = { text: string };\nexport type CardProps = { label: Label<${argument}> };\n`,
    `type Keys<T> = keyof T;\nexport type CardProps = { sortBy: Keys<${argument}> };\n`,
    `type Keys<T> = keyof (T);\ntype SortKeys = Keys<${argument}>;\nexport type CardProps = { sortBy: SortKeys };\n`,
    `type Keys<T> = keyof Readonly<T>;\nexport type CardProps = { sortBy: Keys<${argument}> };\n`,
    `type Identity<T> = T extends infer U ? string : never;\nexport type CardProps = { item: Identity<${argument}> };\n`,
    `type Keys<T> = T extends infer U ? keyof U : never;\nexport type CardProps = { sortBy: Keys<${argument}> };\n`,
    `type Handler<T> = T extends infer U ? (value: U) => void : never;\nexport type CardProps = { onSelect: Handler<${argument}> };\n`,
    `type Pressable<T> = T extends ${argument} ? "button" : "text";\nexport type CardProps = { role: Pressable<string> };\n`,
    `type Pressable<T> = [T] extends [${argument}] ? "button" : "text";\nexport type CardProps = { role: Pressable<string> };\n`,
    `type Box<T, U = T> = { value: U };\nexport type CardProps = { a: Box<string>; b: Box<${argument}, string> };\n`,
    `type Box<T, U = { item: T }> = { value: U };\nexport type CardProps = { a: Box<string>; b: Box<${argument}, string> };\n`,
    "type Chain<T = { next?: Chain }> = { value: T };\nexport type CardProps = Chain;\n",
    `type Chain<A, T = { next?: Chain<{ wrap: A }> }> = { value: T };\nexport type CardProps = { chain: Chain<${argument}> };\n`,
  ]) {
    assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [], contractModule);
  }
});

test("R3 checks a type argument where a local generic places it in props", () => {
  const argument = "{ onPress(): void }";
  for (const contractModule of [
    `type Wrap<T> = { item: T };\ntype Tiles = Wrap<${argument}>[];\nexport type CardProps = { items: Tiles };\n`,
    `type Handler<T> = ((value: T) => void) | T;\nexport type CardProps = { onSelect: Handler<${argument}> };\n`,
    `type Wrap<T> = { item: T };\ntype Relay<U> = Wrap<U>;\nexport type CardProps = { items: Relay<${argument}> };\n`,
    `interface Box<T> { value: T }\ninterface Wrapper<T> extends Box<T> {}\nexport type CardProps = { box: Wrapper<${argument}> };\n`,
    `type Tree<T> = { value: T; children: Tree<T>[] };\nexport type CardProps = { tree: Tree<${argument}> };\n`,
    `type Nest<T> = { value: T; next: Nest<{ wrap: T }> };\nexport type CardProps = { nest: Nest<${argument}> };\n`,
    `type Wrap<T> = { item: T };\ntype Outer<X> = Wrap<{ value: X }>;\nexport type CardProps = { a: Outer<string>; b: Outer<${argument}> };\n`,
    `type Outer<T> = Box<{ item: T }>;\ntype Box<T> = { value: T; next?: Outer<${argument}> };\nexport type CardProps = Outer<string>;\n`,
    `type Box<T, U = T> = { value: U };\nexport type CardProps = Box<${argument}>;\n`,
    `type Rotate<A, B, C> = { value: A; next?: Rotate<B, C, A> };\nexport type CardProps = { item: Rotate<string, number, ${argument}> };\n`,
    `type Rotate<A, B, C> = { value: A; next?: Rotate<B, C, { wrap: A }> };\nexport type CardProps = { item: Rotate<string, number, ${argument}> };\n`,
    "type Chain<T = { next?: Chain; onPress(): void }> = { value: T };\nexport type CardProps = { chain: Chain };\n",
    `type Chain<A, T = { item: A; next?: Chain<A> }> = { value: T };\nexport type CardProps = { chain: Chain<${argument}> };\n`,
    `type Chain<A, B, C, D = { item: A; next?: Chain<B, C, A> }> = { value: D };\nexport type CardProps = Chain<string, number, ${argument}>;\n`,
    `type Identity<T> = T extends infer U ? U : never;\nexport type CardProps = { item: Identity<${argument}> };\n`,
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": contractModule })),
      ["R3 contract-gesture-callback Card"],
      contractModule,
    );
  }
});

test("R3 expands a repeated instantiation of a local generic once", () => {
  // Expanding `left` and `right` separately doubles the work at every level: about a minute here.
  const nested = Array.from({ length: 24 }).reduce(
    inner => `Pair<${inner}>`,
    "{ onPress(): void }",
  );
  const contractModule = `type Pair<T> = { left: T; right: T };\nexport type CardProps = { pair: ${nested} };\n`;
  const start = Date.now();
  assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [
    "R3 contract-gesture-callback Card",
  ]);
  assert.ok(Date.now() - start < 5000);
});

test("R3 follows a rotation of many parameters in linear time", () => {
  // Keying each instantiation on the bindings of the one before grows tenfold per parameter.
  const parameters = Array.from({ length: 12 }, (_, index) => `P${index}`);
  const rotated = [...parameters.slice(1), parameters[0]];
  const values = [...parameters.slice(1).map(() => "string"), "{ onPress(): void }"];
  const contractModule = `type Rotate<${parameters}> = { value: P0; next?: Rotate<${rotated}> };\nexport type CardProps = { item: Rotate<${values}> };\n`;
  const start = Date.now();
  assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [
    "R3 contract-gesture-callback Card",
  ]);
  assert.ok(Date.now() - start < 5000);
});

test("R3 reads a default shared down a chain of types once", () => {
  // Keying a default on the whole chain of references doubles the work at every level.
  const aliases = ["type D0<T = { onPress(): void }> = T;"];
  for (let level = 1; level <= 24; level++) {
    aliases.push(`type D${level}<T = [D${level - 1}, D${level - 1}]> = T;`);
  }
  const contractModule = `${aliases.join("\n")}\nexport type CardProps = { d: D24 };\n`;
  const start = Date.now();
  assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [
    "R3 contract-gesture-callback Card",
  ]);
  assert.ok(Date.now() - start < 5000);
});

test("R3 follows a long chain of local types without overflowing the stack", () => {
  // A recursive walk overflows the stack at about a thousand levels.
  for (const declare of [
    level => `interface T${level} { next?: T${level + 1} }`,
    level => `type T${level} = { next?: T${level + 1} };`,
  ]) {
    const types = Array.from({ length: 5000 }, (_, level) => declare(level));
    const contractModule = `${types.join("\n")}\ninterface T5000 { onPress(): void }\nexport type CardProps = { head: T0 };\n`;
    assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [
      "R3 contract-gesture-callback Card",
    ]);
  }
});

test("R3 checks a chain of inferred parameters in linear time", () => {
  // Rechecking the previous inferred parameter at each read doubles the work at every level.
  let body = "[A23, A23]";
  for (let level = 23; level >= 0; level--) {
    const previous = level === 0 ? "T" : `A${level - 1}`;
    body = `[${previous}, ${previous}] extends infer A${level} ? ${body} : never`;
  }
  const contractModule = `export type CardProps<T = string> = { k: ${body} };\n`;
  const start = Date.now();
  assert.deepEqual(check(card({ "Card.types.ts": contractModule })), []);
  assert.ok(Date.now() - start < 5000);
});

test("R3 reads a parameter's arguments once however often the type places it", () => {
  // Queueing every argument again at each read grows with reads times arguments.
  const references = Array.from({ length: 10000 }, (_, index) => `r${index}?: R<{ w: T }>;`);
  const reads = Array.from({ length: 10000 }, (_, index) => `v${index}: T;`);
  const contractModule = `type R<T> = { ${references.join(" ")} ${reads.join(" ")} };\nexport type CardProps = { r: R<{ onPress(): void }> };\n`;
  const start = Date.now();
  assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [
    "R3 contract-gesture-callback Card",
  ]);
  assert.ok(Date.now() - start < 5000);
});

test("R3 reads a wide default once for many sibling references, read or not", () => {
  // Visiting the default once per reference grows with references times fields.
  const fields = Array.from({ length: 10000 }, (_, index) => `f${index}: string;`).join(" ");
  const reading = Array.from({ length: 10000 }, (_, index) => `f${index}: A;`).join(" ");
  for (const [declaration, sibling, last, expected] of [
    [`type Box<T = { ${fields} }> = { value: T };`, "Box", "Box", []],
    [
      `type Box<A, T = { ${fields} first: A }> = { value: T };`,
      "Box<string>",
      "Box<{ onPress(): void }>",
      ["R3 contract-gesture-callback Card"],
    ],
    [
      `type Box<A, T = { ${reading} }> = { value: T };`,
      "Box<string>",
      "Box<{ onPress(): void }>",
      ["R3 contract-gesture-callback Card"],
    ],
  ]) {
    const siblings = Array.from({ length: 10000 }, (_, index) => `b${index}: ${sibling};`);
    const contractModule = `${declaration}\nexport type CardProps = { ${siblings.join(" ")} last: ${last} };\n`;
    const start = Date.now();
    assert.deepEqual(check(card({ "Card.types.ts": contractModule })), expected);
    assert.ok(Date.now() - start < 5000);
  }
});

test("R3 keeps many defaulted parameters and many references linear", () => {
  // Keeping each reference once per parameter it omits grows with references times parameters.
  const parameters = Array.from({ length: 10000 }, (_, index) => `P${index} = string`);
  const references = Array.from({ length: 10000 }, (_, index) => `b${index}: Box;`);
  for (const [body, last, expected] of [
    ["{ value: string }", "Box", []],
    ["{ value: P0 }", "Box<{ onPress(): void }>", ["R3 contract-gesture-callback Card"]],
  ]) {
    const contractModule = `type Box<${parameters.join(", ")}> = ${body};\nexport type CardProps = { ${references.join(" ")} last: ${last} };\n`;
    const start = Date.now();
    assert.deepEqual(check(card({ "Card.types.ts": contractModule })), expected);
    assert.ok(Date.now() - start < 5000);
  }
});

test("R3 follows a rotation of wrapped arguments in linear time", () => {
  // Expanding each instantiation with its own bindings grows factorially: a crash at 10.
  for (const length of [10, 20]) {
    const parameters = Array.from({ length }, (_, index) => `P${index}`);
    const wrapped = parameters.map((_, index) => `{ w${index}: P${(index + 1) % length} }`);
    const values = [...parameters.slice(1).map(() => "string"), "{ onPress(): void }"];
    const contractModule = `type Rotate<${parameters}> = { value: P0; next?: Rotate<${wrapped}> };\nexport type CardProps = { item: Rotate<${values}> };\n`;
    const start = Date.now();
    assert.deepEqual(check(card({ "Card.types.ts": contractModule })), [
      "R3 contract-gesture-callback Card",
    ]);
    assert.ok(Date.now() - start < 5000);
  }
});

test("R3 checks keyof, conditions and imported heritage arguments outside a local generic", () => {
  const tile = "type Tile = { onPress(): void };\n";
  for (const contractModule of [
    'import type { Base } from "./Base";\nexport interface CardProps extends Base<{ onPress(): void }> { title: string }\n',
    `${tile}export type CardProps = { sortBy: keyof Tile };\n`,
    `${tile}export type CardProps = { k: Tile extends string ? 1 : 2 };\n`,
    `${tile}export interface CardProps extends Omit<Tile, keyof Tile> {}\n`,
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": contractModule })),
      ["R3 contract-gesture-callback Card"],
      contractModule,
    );
  }
});

test("R3 checks the props a local generic contract receives as type arguments", () => {
  for (const contractModule of [
    "type Box<T> = { value: T };\nexport type CardProps = Box<{ onPress(): void }>;\n",
    "interface Box<T> { value: T }\nexport interface CardProps extends Box<{ onPress(): void }> {}\n",
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": contractModule })),
      ["R3 contract-gesture-callback Card"],
      contractModule,
    );
  }
});

test("R3 passes: Pick and Omit drop the props they leave out", () => {
  const base = "type Base = { title: string; style?: string; onPress(): void };\n";
  for (const props of [
    'Pick<Base, "title">',
    'Omit<Base, "style" | "onPress">',
    'Readonly<{ header: Pick<Base, "title"> }>',
  ]) {
    assert.deepEqual(
      check(card({ "Card.types.ts": `${base}export type CardProps = ${props};\n` })),
      [],
      props,
    );
  }
});

test("R3 passes: platform-only props that are optional primitives or string literal unions", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          [
            "/** @platform native Space above the tab bar, in px. */",
            "bottomOffset?: number;",
            "/** @platform web */",
            "autoFocus?: boolean;",
            "/** @platform native */",
            "label?: string;",
            "/** @platform web */",
            'placement?: "top" | "bottom";',
          ].join("\n"),
        ),
      ),
    ),
    [],
  );
});

test("R3 fails: a platform-only prop that is required, not a primitive or wrongly tagged", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          [
            "/** @platform native */",
            "bottomInset: number;",
            "/** @platform web */",
            "anchor?: { x: number };",
            "/** @platform native */",
            "onReady?(): void;",
            "/** @platform mobile */",
            "inset?: number;",
          ].join("\n"),
        ),
      ),
    ),
    [
      "R3 platform-prop-shape Card",
      "R3 platform-prop-shape Card",
      "R3 platform-prop-shape Card",
      "R3 platform-prop-tag Card",
    ],
  );
});

test("R3 checks a component found on one platform only", () => {
  assert.deepEqual(
    check({
      ...card(contract("onPress: () => void;")),
      "src/index.ts": "export {};\n",
    }),
    ["R1 universal-parity Card", "R3 contract-gesture-callback Card"],
  );
});

test("R4 passes: a platform module that exports its component, also as default", () => {
  assert.deepEqual(
    check({
      ...card(contract("title: string;")),
      "src/Card.web.tsx":
        'import type { CardProps } from "./Card.types";\nfunction Card(props: CardProps) { return null; }\nexport { Card };\nexport default Card;\n',
    }),
    [],
  );
});

test("R4 passes: a component exported again as default in the same clause", () => {
  assert.deepEqual(
    check({
      ...card(contract("title: string;")),
      "src/Card.web.tsx":
        'import type { CardProps } from "./Card.types";\nfunction Card(props: CardProps) { return null; }\nexport { Card, Card as default };\n',
    }),
    [],
  );
});

test("R4 passes: a component exported under an alias", () => {
  assert.deepEqual(
    check({
      ...card(contract("title: string;")),
      "src/Card.web.tsx":
        'import type { CardProps } from "./Card.types";\nfunction renderCard(props: CardProps) { return null; }\nexport { renderCard as Card };\n',
    }),
    [],
  );
});

test("R4 fails: a platform module that exports a type, a hook, a re-export or a destructured value", () => {
  const found = checkComponents(
    workspace({
      ...card(contract("title: string;")),
      "src/Card.native.tsx": [
        'import type { CardProps } from "./Card.types";',
        "export function Card(props: CardProps) { return null; }",
        "export type CardLabels = { title: string };",
        "export function useCard() { return null; }",
        'export type { CardProps } from "./Card.types";',
        "export const { cardTitle, nested: [, cardIcon] } = helpers;",
      ].join("\n"),
    }),
    "shared/thing",
  );
  assert.deepEqual(
    found.map(v => `${v.rule} ${v.line} ${v.message.split(" ")[4]}`),
    [
      "R4 3 `CardLabels`",
      "R4 4 `useCard`",
      "R4 5 `CardProps`",
      "R4 6 `cardTitle`",
      "R4 6 `cardIcon`",
    ],
  );
  assert.equal(found[0].file, "shared/thing/src/Card.native.tsx");
});

test("R2 to R4 skip the components of platform entries and test entries", () => {
  assert.deepEqual(
    check({
      "package.json": {
        exports: {
          "./web": "./src/index.web.ts",
          "./native": "./src/index.native.ts",
          "./testing": { "react-native": "./src/testing.native.ts", default: "./src/testing.ts" },
        },
      },
      "src/index.web.ts": 'export * from "./Lottie";\n',
      "src/index.native.ts": 'export * from "./Lottie";\n',
      "src/Lottie.web.tsx":
        'import type { CSSProperties } from "react";\nexport type LottieProps = { style: CSSProperties; onClick(): void };\nexport function Lottie(props: LottieProps) { return null; }\n',
      "src/Lottie.native.tsx":
        "export type LottieNativeProps = { onPress(): void };\nexport function Lottie(props: LottieNativeProps) { return null; }\n",
      "src/testing.ts": 'export * from "./Mock.web";\n',
      "src/testing.native.ts": 'export * from "./Mock.native";\n',
      "src/Mock.web.tsx":
        "export type MockProps = { a: 1 };\nexport function Mock(props: MockProps) { return null; }\n",
      "src/Mock.native.tsx": "export function Mock() { return null; }\n",
    }),
    [],
  );
});

test("the config sets every setting its schema requires, and nothing else", () => {
  const schema = require("./components.config.schema.json");
  const config = require("./components.config.json");
  const settings = Object.keys(config).filter(key => key !== "$schema");
  assert.deepEqual(settings.toSorted(), schema.required.toSorted());
  assert.ok(settings.every(key => Object.hasOwn(schema.properties, key)));
});
