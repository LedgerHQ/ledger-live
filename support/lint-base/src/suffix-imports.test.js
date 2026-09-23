import test from "node:test";
import assert from "node:assert/strict";

import plugin, { findPlatformSuffix } from "./suffix-imports.js";

test("strips a trailing platform suffix from a relative specifier", () => {
  assert.deepEqual(findPlatformSuffix("./Foo.native"), {
    kind: "relative",
    fixed: "./Foo",
  });
  assert.deepEqual(findPlatformSuffix("../hooks/useBar.web"), {
    kind: "relative",
    fixed: "../hooks/useBar",
  });
  assert.deepEqual(findPlatformSuffix("./steps/Detail/index.native"), {
    kind: "relative",
    fixed: "./steps/Detail/index",
  });
});

test("strips a /native or /web subpath from a workspace package", () => {
  assert.deepEqual(findPlatformSuffix("@features/flow-contacts-list/native"), {
    kind: "subpath",
    fixed: "@features/flow-contacts-list",
  });
  assert.deepEqual(findPlatformSuffix("@shared/ui-info-state/web"), {
    kind: "subpath",
    fixed: "@shared/ui-info-state",
  });
  assert.deepEqual(findPlatformSuffix("@domain/entity-contact/native"), {
    kind: "subpath",
    fixed: "@domain/entity-contact",
  });
});

test("leaves third-party platform entry points alone", () => {
  for (const specifier of [
    "styled-components/native",
    "@ledgerhq/crypto-icons/native",
    "@react-navigation/native",
    "react-native",
  ]) {
    assert.equal(findPlatformSuffix(specifier), null, specifier);
  }
});

test("leaves @support/* subpaths alone, they are its documented API", () => {
  assert.equal(findPlatformSuffix("@support/jest-devtools/native"), null);
  assert.equal(findPlatformSuffix("@support/jest-devtools/web"), null);
});

test("flags a relative web.ts or native.ts module, without offering a fix", () => {
  for (const specifier of ["./web", "./steps/Detail/native", "../screens/AddContact/web"]) {
    assert.deepEqual(findPlatformSuffix(specifier), { kind: "module", fixed: null }, specifier);
  }
});

test("matches only a suffix at the end of the specifier", () => {
  for (const specifier of [
    "./webview",
    "./x.webview",
    "./config.website",
    "./native-helpers",
    "@features/flow-contacts",
    "@features/flow-contacts/native/extra",
  ]) {
    assert.equal(findPlatformSuffix(specifier), null, specifier);
  }
});

test("rewrites only the trailing suffix, not the first one it finds", () => {
  assert.deepEqual(findPlatformSuffix("./a.native/b.native"), {
    kind: "relative",
    fixed: "./a.native/b",
  });
});

test("ignores anything that is not a string", () => {
  for (const value of [undefined, null, 42, {}, ["./Foo.native"]]) {
    assert.equal(findPlatformSuffix(value), null);
  }
});

test("registers the rule under the plugin name oxlint expects", () => {
  assert.equal(plugin.meta.name, "suffix-imports");
  assert.equal(typeof plugin.rules["no-platform-suffix"].createOnce, "function");
  assert.equal(plugin.rules["no-platform-suffix"].meta.fixable, "code");
});

test("visits every shape a specifier can appear in", () => {
  const visitors = plugin.rules["no-platform-suffix"].createOnce({ report() {} });
  for (const shape of [
    "ImportDeclaration",
    "ExportNamedDeclaration",
    "ExportAllDeclaration",
    "ImportExpression",
    "CallExpression",
  ]) {
    assert.equal(typeof visitors[shape], "function", shape);
  }
});

test("reports require() and the jest mocking helpers, but not other calls", () => {
  const call = (callee, specifier) => ({
    type: "CallExpression",
    callee,
    arguments: [{ type: "Literal", value: specifier }],
  });
  const identifier = name => ({ type: "Identifier", name });
  const jestMember = name => ({
    type: "MemberExpression",
    object: identifier("jest"),
    property: identifier(name),
  });

  const reported = [];
  const visitors = plugin.rules["no-platform-suffix"].createOnce({
    report: descriptor => reported.push(descriptor.node.value),
  });

  visitors.CallExpression(call(identifier("require"), "./Foo.native"));
  visitors.CallExpression(call(jestMember("mock"), "./internals/digest.native"));
  visitors.CallExpression(call(jestMember("requireActual"), "./store.native"));
  visitors.CallExpression(call(identifier("describe"), "cardSession.native"));
  visitors.CallExpression(call(jestMember("fn"), "./Foo.native"));

  assert.deepEqual(reported, ["./Foo.native", "./internals/digest.native", "./store.native"]);
});

test("the autofix replaces the literal with a quoted suffix-free specifier", () => {
  const literal = { type: "Literal", value: "./Foo.native" };
  const replaced = [];
  const visitors = plugin.rules["no-platform-suffix"].createOnce({
    report: descriptor => {
      replaced.push(descriptor.fix({ replaceText: (node, text) => ({ node, text }) }));
    },
  });

  visitors.ImportDeclaration({ type: "ImportDeclaration", source: literal });

  assert.deepEqual(replaced, [{ node: literal, text: '"./Foo"' }]);
});

test("omits the fix entirely for a web.ts or native.ts module", () => {
  const descriptors = [];
  const visitors = plugin.rules["no-platform-suffix"].createOnce({
    report: descriptor => descriptors.push(descriptor),
  });

  visitors.ExportAllDeclaration({
    type: "ExportAllDeclaration",
    source: { type: "Literal", value: "./steps/Detail/native" },
  });

  assert.equal(descriptors.length, 1);
  assert.equal(descriptors[0].fix, undefined);
  assert.match(descriptors[0].message, /Rename it to index\.ts/);
});
