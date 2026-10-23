"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  checkBarrel,
  checkBarrelLocation,
  checkReachedModule,
  isBarrelFile,
  isInternalSpecifier,
  isInRepoSpecifier,
  starReexportTargets,
  stripComments,
} = require("./rules");

const codes = source => checkBarrel(source).map(v => v.code);

test("isBarrelFile matches index.* and skips its tests", () => {
  assert.ok(isBarrelFile("domain/entity/contact/src/index.ts"));
  assert.ok(isBarrelFile("features/flow/contacts/src/index.native.ts"));
  assert.ok(isBarrelFile("features/platform/style/src/hoc/index.tsx"));
  assert.ok(!isBarrelFile("domain/entity/contact/src/index.test.ts"));
  assert.ok(!isBarrelFile("domain/entity/contact/src/index.spec.tsx"));
  assert.ok(!isBarrelFile("domain/entity/contact/src/schema.ts"));
  // A file merely starting with "index" is not a barrel.
  assert.ok(!isBarrelFile("shared/env/src/indexing.ts"));
});

test("isInternalSpecifier recognises the three private forms at any depth", () => {
  assert.ok(isInternalSpecifier("./internals"));
  assert.ok(isInternalSpecifier("./internals/utils"));
  assert.ok(isInternalSpecifier("./data/internals"));
  assert.ok(isInternalSpecifier("./slice.internals"));
  assert.ok(isInternalSpecifier("./state/slice.internals.ts"));
  assert.ok(!isInternalSpecifier("./schema"));
  // Substring matches must not count.
  assert.ok(!isInternalSpecifier("./internalsHelper"));
  assert.ok(!isInternalSpecifier("./myinternals"));
});

test("isInRepoSpecifier covers the workspace scopes only", () => {
  assert.ok(isInRepoSpecifier("@shared/schema-primitives"));
  assert.ok(isInRepoSpecifier("@domain/entity-currency-crypto"));
  assert.ok(isInRepoSpecifier("@features/platform-contacts"));
  assert.ok(isInRepoSpecifier("@support/jest/devtools"));
  assert.ok(isInRepoSpecifier("@ledgerhq/live-env"));
  assert.ok(!isInRepoSpecifier("zod"));
  assert.ok(!isInRepoSpecifier("./schema"));
});

test("a pure barrel produces no violation", () => {
  const source = [
    "export * from './schema';",
    'export * from "./registry";',
    'export type * from "./types";',
  ].join("\n");
  assert.deepEqual(checkBarrel(source), []);
});

test("comments and blank lines are ignored", () => {
  const source = [
    "// Public API of the package.",
    "",
    "/* block",
    "   comment */",
    'export * from "./schema"; // trailing',
  ].join("\n");
  assert.deepEqual(checkBarrel(source), []);
});

test("a default re-export is tolerated in both forms", () => {
  assert.deepEqual(checkBarrel('export { default } from "./useEnv";'), []);
  assert.deepEqual(checkBarrel('export { featureFlagsReducer as default } from "./data";'), []);
  // Real shape of features/platform/env once the hook moves out of the index.
  const source = ['export * from "./useEnv";', 'export { default } from "./useEnv";'].join("\n");
  assert.deepEqual(checkBarrel(source), []);
});

test("named re-export is a violation — the target file mixes public and private", () => {
  // domain/entity/account-name
  const source =
    'export { accountNamesSlice, bulkSetAccountNames as setAccountNames } from "./slice";';
  assert.deepEqual(codes(source), ["not-a-barrel"]);
});

test("a multi-line named re-export is reported once, at its first line", () => {
  const source = ["export {", "  a,", "  b,", '} from "./x";'].join("\n");
  const found = checkBarrel(source);
  assert.equal(found.length, 1);
  assert.equal(found[0].code, "not-a-barrel");
  assert.equal(found[0].line, 1);
});

test("`export * as ns` is a violation — namespacing is still sorting", () => {
  assert.deepEqual(codes('export * as helpers from "./helpers";'), ["not-a-barrel"]);
});

test("declarations, imports and a local default are violations", () => {
  // domain/entity/currency
  assert.deepEqual(codes('import { z } from "zod";'), ["not-a-barrel"]);
  assert.deepEqual(codes("export const Schema = z.object({});"), ["not-a-barrel"]);
  assert.deepEqual(codes("export type EnvName = keyof typeof allDefinitions;"), ["not-a-barrel"]);
  assert.deepEqual(codes("export function getEnv() {}"), ["not-a-barrel"]);
  // shared/env/src/definitions/team-*/index.ts — a local default needs an import above it.
  assert.deepEqual(codes("export default teamWalletXp;"), ["not-a-barrel"]);
});

test("an empty export is a violation", () => {
  // features/platform/aggregated-assets
  assert.deepEqual(codes("export {};"), ["not-a-barrel"]);
});

test("re-exporting an internals location is a violation", () => {
  assert.deepEqual(codes('export * from "./internals";'), ["internals-reexport"]);
  assert.deepEqual(codes('export * from "./state/slice.internals";'), ["internals-reexport"]);
  assert.deepEqual(codes('export { default } from "./internals";'), ["internals-reexport"]);
});

test("re-exporting a workspace package is a proxy", () => {
  // features/flow/contacts
  assert.deepEqual(codes('export * from "@features/flow-contacts-add-contact";'), [
    "cross-package-reexport",
  ]);
  const found = checkBarrel('export * from "@ledgerhq/live-env";');
  assert.equal(found[0].code, "cross-package-reexport");
  assert.match(found[0].message, /original provider/);
});

test("re-exporting a third-party package is reported separately", () => {
  assert.deepEqual(codes('export * from "zod";'), ["external-reexport"]);
});

test("allowNonRelative lifts the proxy rule for a sanctioned facade", () => {
  // shared/env wraps the legacy @ledgerhq/live-env behind the repo's only boundary exception.
  const source = 'export * from "@ledgerhq/live-env";';
  assert.deepEqual(checkBarrel(source, { allowNonRelative: true }), []);
  // The exception does not weaken the other rules.
  assert.deepEqual(codes('export { changes } from "@ledgerhq/live-env";'), ["not-a-barrel"]);
  assert.deepEqual(
    checkBarrel('export * from "./internals";', { allowNonRelative: true }).map(v => v.code),
    ["internals-reexport"],
  );
});

test("each offending statement is reported once, with its line", () => {
  const source = [
    'export * from "./schema";',
    'export { a } from "./a";',
    'export { b } from "./b";',
  ].join("\n");
  const found = checkBarrel(source);
  assert.deepEqual(
    found.map(v => v.line),
    [2, 3],
  );
});

test("stripComments preserves line numbers", () => {
  const source = ["/* a", "   b */", 'export * from "./x";'].join("\n");
  assert.equal(stripComments(source).split("\n").length, 3);
  assert.equal(checkBarrel(source).length, 0);
});

test("a `//` inside a specifier is not treated as a comment", () => {
  const found = checkBarrel('export * from "https://example.com/mod";');
  assert.equal(found.length, 1);
  assert.equal(found[0].code, "external-reexport");
});

const reachedCodes = source => checkReachedModule(source).map(v => v.code);

test("a reached module may declare anything and `export *` relative files", () => {
  const source = [
    'import { z } from "zod";',
    "export const Schema = z.object({});",
    "export function helper() {}",
    "export default Schema;",
    'export * from "./schema";',
    'export type * from "./types";',
    'export { default } from "./useEnv";',
  ].join("\n");
  assert.deepEqual(checkReachedModule(source), []);
});

test("a named re-export in a reached module is a hidden barrel", () => {
  // features/flow/flow-contacts-detail/src/web.ts
  assert.deepEqual(reachedCodes('export { ContactDetailView } from "./ContactDetailView.web";'), [
    "hidden-barrel",
  ]);
  assert.deepEqual(reachedCodes('export type { Props } from "./types";'), ["hidden-barrel"]);
  assert.deepEqual(reachedCodes('export * as helpers from "./helpers";'), ["hidden-barrel"]);
  const multiLine = ["export {", "  a,", "  b,", '} from "./x";'].join("\n");
  assert.deepEqual(
    checkReachedModule(multiLine).map(v => [v.code, v.line]),
    [["hidden-barrel", 1]],
  );
});

test("a reached module re-exporting a package or internals is reported like a barrel", () => {
  // features/flow/contacts/src/hooks/contactsHooks.ts
  assert.deepEqual(reachedCodes('export { useContacts } from "@features/platform-contacts";'), [
    "cross-package-reexport",
  ]);
  assert.deepEqual(reachedCodes('export * from "@features/platform-contacts";'), [
    "cross-package-reexport",
  ]);
  assert.deepEqual(reachedCodes('export { useTheme } from "styled-components/native";'), [
    "external-reexport",
  ]);
  assert.deepEqual(reachedCodes('export * from "./internals";'), ["internals-reexport"]);
  assert.deepEqual(
    checkReachedModule('export * from "@ledgerhq/live-env";', { allowNonRelative: true }),
    [],
  );
});

test("a commented-out re-export in a reached module is ignored", () => {
  assert.deepEqual(
    checkReachedModule('// export { a } from "./a";\n/* export * from "zod"; */'),
    [],
  );
});

test("starReexportTargets keeps the relative, public `export *` only", () => {
  const source = [
    'export * from "./schema";',
    'export type * from "./types";',
    'export * from "./internals";',
    'export * from "@shared/other";',
    'export * as ns from "./ns";',
    'export { a } from "./a";',
  ].join("\n");
  assert.deepEqual(starReexportTargets(source), ["./schema", "./types"]);
});

test("re-exports are found wherever a top-level statement can start", () => {
  // Indented, after a block comment, and a second statement on the same line.
  const source = [
    '  export * from "./indented";',
    '/* note */ export { a } from "./a";',
    'export * from "./first"; export { b } from "./b";',
  ].join("\n");
  assert.deepEqual(starReexportTargets(source), ["./indented", "./first"]);
  assert.deepEqual(
    checkReachedModule(source).map(v => [v.code, v.line]),
    [
      ["hidden-barrel", 2],
      ["hidden-barrel", 3],
    ],
  );
});

test("export-looking text inside literals and nested blocks is not a statement", () => {
  const source = [
    "const doc = `",
    'export { a } from "./a";',
    'export * from "./b";',
    "${`nested ${'export * from \"./c\"'}`}",
    "`;",
    "const s = 'export { d } from \"./d\"';",
    'declare module "m" {',
    '  export * from "./e";',
    "}",
  ].join("\n");
  assert.deepEqual(checkReachedModule(source), []);
  assert.deepEqual(starReexportTargets(source), []);
});

test("a stray apostrophe in JSX text does not hide the statements below it", () => {
  const source = ["const A = () => <p>Don't</p>;", 'export { a } from "./a";'].join("\n");
  assert.deepEqual(
    checkReachedModule(source).map(v => [v.code, v.line]),
    [["hidden-barrel", 2]],
  );
});

test("a regular expression literal neither hides nor fakes a re-export", () => {
  // An unbalanced bracket inside a pattern must not push the statements below out of scope.
  const hidden = ["const open = /\\{/;", 'export { a } from "./a";', 'export * from "./b";'].join(
    "\n",
  );
  assert.deepEqual(
    checkReachedModule(hidden).map(v => [v.code, v.line]),
    [["hidden-barrel", 2]],
  );
  assert.deepEqual(starReexportTargets(hidden), ["./b"]);
  // A `/*` inside a pattern is not a comment opening.
  const slashes = ["const trailing = /\\/*$/;", 'export { a } from "./a";'].join("\n");
  assert.deepEqual(
    checkReachedModule(slashes).map(v => v.line),
    [2],
  );
  // Export-looking text inside a pattern is not a statement.
  assert.deepEqual(checkReachedModule('const p = /export { a } from "zod"/;'), []);
  // A division is still a division.
  const division = ["const half = total / 2, ratio = a / b;", 'export { c } from "./c";'].join(
    "\n",
  );
  assert.deepEqual(
    checkReachedModule(division).map(v => v.line),
    [2],
  );
});

test("JSX closing tags do not hide the re-exports below them", () => {
  const source = [
    "const A = () => (<p>Hello</p>);",
    "const B = ({ on }) => on && <p>{on}/{on}</p>;",
    "const C = ({ items }) => items.map(i => (<li key={i}>{i}</li>));",
    "const D = ({ x }) => (<Foo bar={x} />);",
    'export { a } from "./a";',
    'export * from "./deeper";',
  ].join("\n");
  assert.deepEqual(
    checkReachedModule(source).map(v => [v.code, v.line]),
    [["hidden-barrel", 5]],
  );
  assert.deepEqual(starReexportTargets(source), ["./deeper"]);
  // Patterns are still read as patterns where a JSX tag cannot appear.
  const patterns = ["const f = s => /[{(]/.test(s) && s.split(/>/);", 'export { b } from "./b";'];
  assert.deepEqual(
    checkReachedModule(patterns.join("\n")).map(v => v.line),
    [2],
  );
});

test("a nested template holding a URL does not hide the re-exports below it", () => {
  const source = [
    "export const url = `outer ${`https://example.com`}`;",
    'export { a } from "./a";',
    'export * from "./deeper";',
  ].join("\n");
  assert.deepEqual(
    checkReachedModule(source).map(v => [v.code, v.line]),
    [["hidden-barrel", 2]],
  );
  assert.deepEqual(starReexportTargets(source), ["./deeper"]);
});

test("JSX text is neither a violation nor a traversal target", () => {
  const source =
    'export const Help = () => <pre>export * from "zod"; export * from "./deeper";</pre>;';
  assert.deepEqual(checkReachedModule(source, {}, "Help.tsx"), []);
  assert.deepEqual(starReexportTargets(source, "Help.tsx"), []);
});

test("a `.ts` module is parsed without JSX, so a type assertion is not a tag", () => {
  const source = ["const n = <number>value;", 'export { a } from "./a";'].join("\n");
  assert.deepEqual(
    checkReachedModule(source, {}, "cast.ts").map(v => [v.code, v.line]),
    [["hidden-barrel", 2]],
  );
});

test("checkBarrelLocation allows an entry, a first-level barrel and an internals barrel", () => {
  for (const [file, depth] of [
    ["shared/thing/src/index.ts", 0],
    ["shared/thing/src/state/index.web.ts", 0],
    ["shared/thing/src/hooks/index.native.ts", 1],
    ["shared/thing/src/internals/index.ts", undefined],
    ["shared/thing/src/data/internals/deep/index.ts", 3],
  ]) {
    assert.deepEqual(checkBarrelLocation("shared/thing", file, depth), [], file);
  }
});

test("checkBarrelLocation reports an orphan and a nested barrel, with the package root", () => {
  for (const [depth, code] of [
    [undefined, "orphan-barrel"],
    [2, "nested-barrel"],
  ]) {
    const found = checkBarrelLocation("shared/thing", "shared/thing/src/hooks/index.ts", depth);
    assert.deepEqual(
      found.map(v => v.code),
      [code],
    );
    assert.match(found[0].message, /^shared\/thing: /);
  }
});
