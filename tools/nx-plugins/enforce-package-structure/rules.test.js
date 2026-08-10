"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  checkBarrel,
  isBarrelFile,
  isInternalSpecifier,
  isInRepoSpecifier,
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
  assert.ok(isInRepoSpecifier("@support/jest-devtools"));
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
