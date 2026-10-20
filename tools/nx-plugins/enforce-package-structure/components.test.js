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

test("R3 fails: a contract that references a DOM or React Native type", () => {
  assert.deepEqual(
    check(
      card(
        contract(
          [
            "onSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;",
            "ref?: Ref<HTMLElement>;",
            "layout: CSSProperties;",
            "inset: ViewStyle;",
          ].join("\n"),
        ),
      ),
    ).toSorted(),
    [
      "R3 contract-platform-type Card",
      "R3 contract-platform-type Card",
      "R3 contract-platform-type Card",
      "R3 contract-platform-type Card",
      "R3 contract-platform-type Card",
    ],
  );
});

test("R3 passes: neutral types that share a word with a banned one", () => {
  assert.deepEqual(
    check(card(contract("ref?: Ref<CardHandle>;\nevent: TrackingEvent;\nnode: ReactNode;"))),
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

test("R4 fails: a platform module that exports a type, a hook or a re-export", () => {
  const found = checkComponents(
    workspace({
      ...card(contract("title: string;")),
      "src/Card.native.tsx": [
        'import type { CardProps } from "./Card.types";',
        "export function Card(props: CardProps) { return null; }",
        "export type CardLabels = { title: string };",
        "export function useCard() { return null; }",
        'export type { CardProps } from "./Card.types";',
      ].join("\n"),
    }),
    "shared/thing",
  );
  assert.deepEqual(
    found.map(v => `${v.rule} ${v.line} ${v.message.split(" ")[4]}`),
    ["R4 3 `CardLabels`", "R4 4 `useCard`", "R4 5 `CardProps`"],
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
