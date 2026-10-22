import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import plugin, { findPlatformSuffix } from "./suffix-imports.js";

/**
 * @param {Record<string, string>} files paths relative to the returned root
 * @returns {string} a temporary directory holding `files`
 */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suffix-imports-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

// One package per platform layout, as docs/tsconfig.md describes them.
const PACKAGES = fixture({
  "dual/package.json": "{}",
  "dual/tsconfig.native.json": "{}",
  "dual/tsconfig.web.json": "{}",
  "native-only/package.json": "{}",
  "native-only/tsconfig.native.json": "{}",
  "web-only/package.json": "{}",
  "web-only/tsconfig.web.json": "{}",
  "agnostic/package.json": "{}",
});

/**
 * @param {string} pkg
 * @param {string} file
 * @returns {string} an absolute file name inside a fixture package
 */
function inPackage(pkg, file) {
  return path.join(PACKAGES, pkg, "src", file);
}

test("strips a trailing platform suffix from a relative specifier", () => {
  assert.deepEqual(findPlatformSuffix("./Foo.native"), { kind: "relative", fixed: "./Foo" });
  assert.deepEqual(findPlatformSuffix("../hooks/useBar.web"), {
    kind: "relative",
    fixed: "../hooks/useBar",
  });
  assert.deepEqual(findPlatformSuffix("./steps/Detail/index.native"), {
    kind: "relative",
    fixed: "./steps/Detail/index",
  });
});

test("reports a platform entry of a workspace package from cross-platform code, without a fix", () => {
  for (const filename of [
    inPackage("dual", "Foo.tsx"),
    inPackage("agnostic", "foo.ts"),
    undefined,
  ]) {
    assert.deepEqual(
      findPlatformSuffix("@features/flow-contacts-list/native", filename),
      { kind: "native", fixed: null },
      String(filename),
    );
    assert.deepEqual(
      findPlatformSuffix("@shared/ui-info-state/web", filename),
      { kind: "web", fixed: null },
      String(filename),
    );
    assert.deepEqual(
      findPlatformSuffix("@domain/entity-contact/native", filename),
      { kind: "native", fixed: null },
      String(filename),
    );
  }
});

test("allows a /native platform entry from native code only", () => {
  for (const filename of [
    inPackage("dual", "Animation.native.tsx"),
    inPackage("dual", "Animation.native.test.tsx"),
    inPackage("native-only", "deep/Sheet.tsx"),
    "/repo/apps/ledger-live-mobile/src/components/Animation.tsx",
  ]) {
    assert.equal(findPlatformSuffix("@shared/lottie/native", filename), null, filename);
  }
  for (const filename of [
    inPackage("dual", "Animation.web.tsx"),
    inPackage("web-only", "Upsell.tsx"),
    "/repo/apps/ledger-live-desktop/src/renderer/animations/index.tsx",
  ]) {
    assert.deepEqual(
      findPlatformSuffix("@shared/lottie/native", filename),
      { kind: "native", fixed: null },
      filename,
    );
  }
});

test("allows a /web platform entry from web code only", () => {
  for (const filename of [
    inPackage("dual", "Animation.web.tsx"),
    inPackage("dual", "Animation.web.test.tsx"),
    inPackage("web-only", "Upsell.tsx"),
    "/repo/apps/ledger-live-desktop/src/renderer/animations/index.tsx",
  ]) {
    assert.equal(findPlatformSuffix("@shared/lottie/web", filename), null, filename);
  }
  for (const filename of [
    inPackage("dual", "Animation.native.tsx"),
    inPackage("native-only", "Sheet.tsx"),
    "/repo/apps/ledger-live-mobile/src/components/Animation.tsx",
  ]) {
    assert.deepEqual(
      findPlatformSuffix("@shared/lottie/web", filename),
      { kind: "web", fixed: null },
      filename,
    );
  }
});

test("leaves third-party platform entry points alone", () => {
  for (const specifier of [
    "styled-components/native",
    "@ledgerhq/crypto-icons/native",
    "@react-navigation/native",
    "react-native",
  ]) {
    assert.equal(findPlatformSuffix(specifier, inPackage("dual", "Foo.tsx")), null, specifier);
  }
});

test("leaves @support/* subpaths alone, they are its documented API", () => {
  assert.equal(
    findPlatformSuffix("@support/jest-devtools/native", inPackage("dual", "a.ts")),
    null,
  );
  assert.equal(findPlatformSuffix("@support/jest-devtools/web", inPackage("dual", "a.ts")), null);
});

test("flags a relative web.ts or native.ts module, without offering a fix", () => {
  for (const specifier of ["./web", "./steps/Detail/native", "../screens/AddContact/web"]) {
    for (const filename of [inPackage("dual", "index.ts"), inPackage("dual", "index.native.ts")]) {
      assert.deepEqual(
        findPlatformSuffix(specifier, filename),
        { kind: "module", fixed: null },
        specifier,
      );
    }
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
    assert.equal(findPlatformSuffix(specifier, inPackage("dual", "Foo.tsx")), null, specifier);
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

function call(callee, specifier) {
  return { type: "CallExpression", callee, arguments: [{ type: "Literal", value: specifier }] };
}

function identifier(name) {
  return { type: "Identifier", name };
}

function jestMember(name) {
  return { type: "MemberExpression", object: identifier("jest"), property: identifier(name) };
}

test("reports require() and the jest mocking helpers, but not other calls", () => {
  const reported = [];
  const visitors = plugin.rules["no-platform-suffix"].createOnce({
    filename: inPackage("dual", "Foo.test.ts"),
    report: descriptor => reported.push(descriptor.node.value),
  });

  visitors.CallExpression(call(identifier("require"), "./Foo.native"));
  visitors.CallExpression(call(jestMember("mock"), "./internals/digest.native"));
  visitors.CallExpression(call(jestMember("requireActual"), "./store.native"));
  visitors.CallExpression(call(jestMember("mock"), "@shared/lottie/native"));
  visitors.CallExpression(call(identifier("describe"), "cardSession.native"));
  visitors.CallExpression(call(jestMember("fn"), "./Foo.native"));

  assert.deepEqual(reported, [
    "./Foo.native",
    "./internals/digest.native",
    "./store.native",
    "@shared/lottie/native",
  ]);
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

test("omits the fix entirely for a web.ts or native.ts module and for a platform entry", () => {
  const descriptors = [];
  const visitors = plugin.rules["no-platform-suffix"].createOnce({
    filename: inPackage("dual", "index.ts"),
    report: descriptor => descriptors.push(descriptor),
  });

  visitors.ExportAllDeclaration({
    type: "ExportAllDeclaration",
    source: { type: "Literal", value: "./steps/Detail/native" },
  });
  visitors.ImportDeclaration({
    type: "ImportDeclaration",
    source: { type: "Literal", value: "@shared/lottie/web" },
  });

  assert.equal(descriptors.length, 2);
  assert.equal(descriptors[0].fix, undefined);
  assert.match(descriptors[0].message, /Rename it to index\.ts/);
  assert.equal(descriptors[1].fix, undefined);
  assert.match(descriptors[1].message, /only from web code/);
});

test("oxlint runs the rule end to end, with the file name of each importer", () => {
  const oxlint = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
  const imports = [
    'import a from "./a.native";',
    'import b from "@shared/lottie/native";',
    'import c from "@shared/lottie/web";',
    'import d from "styled-components/native";',
    'export * from "./steps/native";',
    'jest.mock("./c.web");',
    'void import("./d.web");',
    "",
  ].join("\n");
  const root = fixture({
    ".oxlintrc.json": JSON.stringify({
      plugins: [],
      jsPlugins: [fileURLToPath(new URL("./suffix-imports.js", import.meta.url))],
      rules: { "suffix-imports/no-platform-suffix": "error" },
    }),
    "pkg/package.json": "{}",
    "pkg/tsconfig.native.json": "{}",
    "pkg/tsconfig.web.json": "{}",
    "pkg/src/Foo.tsx": imports,
    "pkg/src/Foo.native.tsx": imports,
  });

  const { stdout } = spawnSync(oxlint, ["--format", "unix", "pkg"], {
    cwd: root,
    encoding: "utf8",
  });
  const reported = stdout
    .split("\n")
    .filter(line => line.includes("no-platform-suffix"))
    .map(line => line.split(":").slice(0, 2).join(":"))
    .sort();

  assert.deepEqual(reported, [
    "pkg/src/Foo.native.tsx:1",
    "pkg/src/Foo.native.tsx:3",
    "pkg/src/Foo.native.tsx:5",
    "pkg/src/Foo.native.tsx:6",
    "pkg/src/Foo.native.tsx:7",
    "pkg/src/Foo.tsx:1",
    "pkg/src/Foo.tsx:2",
    "pkg/src/Foo.tsx:3",
    "pkg/src/Foo.tsx:5",
    "pkg/src/Foo.tsx:6",
    "pkg/src/Foo.tsx:7",
  ]);
});
