"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { auditFileExceptions, checkPackage, findPackageRoots } = require("./validate");
const { COMPONENT_EXCEPTIONS, FILE_EXCEPTIONS, PACKAGE_EXCEPTIONS } = require("./exceptions");

const REPO_ROOT = path.resolve(__dirname, "../../..");

/**
 * @param {Record<string, string>} files paths relative to the workspace root
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "package-structure-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

test("a clean package reports nothing", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("nested barrels are checked, at any depth", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./deep";\n',
    "shared/thing/src/deep/nested/index.ts": 'export { a } from "./a";\n',
  });
  const found = checkPackage(root, "shared/thing");
  assert.equal(found.length, 1);
  assert.equal(found[0].file, "shared/thing/src/deep/nested/index.ts");
  assert.equal(found[0].code, "not-a-barrel");
});

test("tests and non-index files are left alone", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/index.test.ts": 'import { a } from "./schema";\n',
    "shared/thing/src/schema.ts": 'import { z } from "zod";\nexport const a = z;\n',
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("a package marked `skip` is not checked at all", () => {
  const root = workspace({
    "shared/env/src/index.ts": 'import { z } from "zod";\nexport const broken = z;\n',
  });
  // shared/env carries a skip entry, so even a blatantly non-barrel index passes.
  assert.ok(PACKAGE_EXCEPTIONS["shared/env"]?.skip === true);
  assert.deepEqual(checkPackage(root, "shared/env"), []);
  // The same content anywhere else is still a violation.
  const other = workspace({
    "shared/thing/src/index.ts": 'import { z } from "zod";\nexport const broken = z;\n',
  });
  assert.equal(checkPackage(other, "shared/thing").length, 2);
});

test("every exception carries a reason and an exit condition", () => {
  for (const [root, exception] of Object.entries(PACKAGE_EXCEPTIONS)) {
    assert.ok(
      typeof exception.reason === "string" && exception.reason.length > 0,
      `${root} must document why it is excepted`,
    );
    assert.match(
      exception.reason,
      /exit condition/i,
      `${root} must state how the exception gets removed — entries are temporary`,
    );
  }
});

const ONE_PLATFORM_PACKAGE = {
  "shared/thing/package.json": JSON.stringify({
    exports: { ".": { "react-native": "./src/index.native.ts", default: "./src/index.ts" } },
  }),
  "shared/thing/src/index.ts": "export {};\n",
  "shared/thing/src/index.native.ts": 'export * from "./Sheet";\n',
  "shared/thing/src/Sheet.native.tsx": "export function Sheet() { return null; }\n",
};

test("component violations are reported next to barrel violations", () => {
  const found = checkPackage(workspace(ONE_PLATFORM_PACKAGE), "shared/thing", {});
  assert.deepEqual(
    found.map(v => [v.file, v.rule, v.code]),
    [
      ["shared/thing/src/index.ts", undefined, "not-a-barrel"],
      ["shared/thing/src/Sheet.native.tsx", "R1", "universal-parity"],
    ],
  );
});

test("a component waiver silences its rules only, and a stale one is reported", () => {
  const root = workspace(ONE_PLATFORM_PACKAGE);
  function codes(waivers) {
    return checkPackage(root, "shared/thing", { "shared/thing": waivers })
      .filter(v => v.rule)
      .map(v => `${v.rule} ${v.code} ${v.subject}`);
  }

  assert.deepEqual(codes({ Sheet: { rules: ["R1"] } }), []);
  assert.deepEqual(codes({ Sheet: { rules: ["R5"] } }), [
    "R1 universal-parity Sheet",
    "R5 stale-waiver Sheet",
  ]);
  assert.deepEqual(codes({ Sheet: { rules: ["R1"] }, Gone: { rules: ["R1"] } }), [
    "R1 stale-waiver Gone",
  ]);
});

test("every component waiver names a package, its rules and an exit condition", () => {
  for (const [root, waivers] of Object.entries(COMPONENT_EXCEPTIONS)) {
    assert.ok(
      fs.existsSync(path.join(REPO_ROOT, root, "package.json")),
      `${root} is not a package`,
    );
    for (const [subject, waiver] of Object.entries(waivers)) {
      assert.ok(waiver.rules.length > 0, `${root} ${subject} must name the rules it waives`);
      for (const rule of waiver.rules) assert.match(rule, /^R[15]$/);
      assert.match(waiver.reason, /exit condition/i, `${root} ${subject} needs an exit condition`);
    }
  }
});

test("findPackageRoots picks up the new-architecture layers only", () => {
  const root = workspace({
    "domain/entity/thing/package.json": "{}",
    "shared/other/package.json": "{}",
    "features/flow/x/package.json": "{}",
    "libs/legacy/package.json": "{}",
    "apps/desktop/package.json": "{}",
  });
  assert.deepEqual(findPackageRoots(root), [
    "domain/entity/thing",
    "features/flow/x",
    "shared/other",
  ]);
});

test("`export *` from a barrel is followed into the module it names", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./exports";\n',
    "shared/thing/src/exports.ts": 'export { a } from "./a";\n',
  });
  const found = checkPackage(root, "shared/thing");
  assert.deepEqual(
    found.map(v => [v.file, v.code]),
    [["shared/thing/src/exports.ts", "hidden-barrel"]],
  );
});

test("`export *` is followed through several modules", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./exports";\n',
    "shared/thing/src/exports.ts": 'export * from "./deeper";\nexport const ok = 1;\n',
    "shared/thing/src/deeper.ts": 'export { a } from "./a";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => [v.file, v.code]),
    [["shared/thing/src/deeper.ts", "hidden-barrel"]],
  );
});

test("a reached module proxying another workspace package fails", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./hooks";\n',
    "shared/thing/src/hooks.ts": 'export { useOther } from "@features/platform-other";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.code),
    ["cross-package-reexport"],
  );
});

test("a reached module holding only declarations passes", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": [
      'import { z } from "zod";',
      "export const Schema = z.object({});",
      "export type Thing = z.infer<typeof Schema>;",
    ].join("\n"),
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("platform variants and folder indexes are all followed", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./theme";\nexport * from "./hooks";\n',
    "shared/thing/src/theme.web.ts": 'export { a } from "./a";\n',
    "shared/thing/src/theme.native.ts": 'export { a } from "./a";\n',
    "shared/thing/src/hooks/index.ts": 'export * from "./useThing";\n',
    "shared/thing/src/hooks/useThing.tsx": 'export { b } from "./b";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    [
      "shared/thing/src/hooks/useThing.tsx",
      "shared/thing/src/theme.native.ts",
      "shared/thing/src/theme.web.ts",
    ],
  );
});

test("an `export *` cycle terminates and reports each file once", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./a";\n',
    "shared/thing/src/a.ts": 'export * from "./b";\nexport { x } from "./x";\n',
    "shared/thing/src/b.ts": 'export * from "./a";\nexport * from "./index";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    ["shared/thing/src/a.ts"],
  );
});

test("every source file in package.json#exports is checked, under any condition", () => {
  const root = workspace({
    "shared/thing/package.json": JSON.stringify({
      exports: {
        ".": { "react-native": "./src/index.native.ts", default: "./src/index.ts" },
        "./server": { types: "./src/server.ts", default: "./src/server.ts" },
        "./native": { "react-native": ["./src/native.ts"] },
        "./*": "./src/*.ts",
        "./package.json": "./package.json",
      },
    }),
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/index.native.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/server.ts": 'export { a as b } from "./schema";\n',
    "shared/thing/src/native.ts": 'export * from "./nativeOnly";\n',
    "shared/thing/src/nativeOnly.ts": 'export { c } from "./c";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => [v.file, v.code]),
    [
      ["shared/thing/src/nativeOnly.ts", "hidden-barrel"],
      ["shared/thing/src/server.ts", "hidden-barrel"],
    ],
  );
});

test("a test support entry is not checked, as in components.js", () => {
  const root = workspace({
    "shared/thing/package.json": JSON.stringify({
      exports: {
        ".": "./src/index.ts",
        "./testing/module-mock": "./src/testing/moduleMock.ts",
        "./mocks": { default: "./src/mocks.ts" },
      },
    }),
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/testing/moduleMock.ts": 'export { a as b } from "../schema";\n',
    "shared/thing/src/mocks.ts": 'export { a as c } from "./schema";\n',
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("a file exception hides that file's violations only", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./a";\nexport * from "./b";\n',
    "shared/thing/src/a.ts": 'export * from "./c";\nexport { x } from "./x";\n',
    "shared/thing/src/b.ts": 'export { y } from "./y";\n',
    "shared/thing/src/c.ts": 'export { z } from "./z";\n',
  });
  const fileExceptions = { "shared/thing/src/a.ts": "Exit condition: none needed in a test." };
  // The excepted file is still followed, so what it reaches stays checked.
  assert.deepEqual(
    checkPackage(root, "shared/thing", {}, fileExceptions).map(v => v.file),
    ["shared/thing/src/b.ts", "shared/thing/src/c.ts"],
  );
});

test("the file exception audit flags a missing file, a clean file and a missing exit condition", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./dirty";\nexport * from "./clean";\n',
    "shared/thing/src/dirty.ts": 'export { a } from "./a";\n',
    "shared/thing/src/clean.ts": "export const a = 1;\n",
  });
  const reason = "TEMPORARY. Exit condition: fix it.";
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/dirty.ts": reason }), []);
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/gone.ts": reason }), [
    "shared/thing/src/gone.ts: no such file",
  ]);
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/clean.ts": reason }), [
    "shared/thing/src/clean.ts: no violation left to except, delete the entry",
  ]);
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/dirty.ts": "Because." }), [
    "shared/thing/src/dirty.ts: the reason states no exit condition",
  ]);
});

test("every file exception names a file that still has a violation, and its exit condition", () => {
  assert.deepEqual(auditFileExceptions(REPO_ROOT, FILE_EXCEPTIONS), []);
});

test("an indented or same-line `export *` in a barrel is followed too", () => {
  const root = workspace({
    "shared/thing/src/index.ts":
      '  export * from "./a";\nexport * from "./b"; export * from "./c";\n',
    "shared/thing/src/a.ts": 'export { x } from "./x";\n',
    "shared/thing/src/b.ts": "export const ok = 1;\n",
    "shared/thing/src/c.ts": 'export { y } from "./y";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    ["shared/thing/src/a.ts", "shared/thing/src/c.ts"],
  );
});

test("`export *` below JSX in a reached component is still followed", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./View";\n',
    "shared/thing/src/View.tsx": [
      "export const View = () => (<p>Hello</p>);",
      'export * from "./deeper";',
    ].join("\n"),
    "shared/thing/src/deeper.ts": 'export { a } from "./a";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => [v.file, v.code]),
    [["shared/thing/src/deeper.ts", "hidden-barrel"]],
  );
});

test("an `.ios` file does not hide its `.android` sibling", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./theme";\n',
    "shared/thing/src/theme.ts": "export const theme = {};\n",
    "shared/thing/src/theme.ios.ts": 'export { a } from "./a";\n',
    "shared/thing/src/theme.android.ts": 'export { b } from "./b";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    ["shared/thing/src/theme.android.ts", "shared/thing/src/theme.ios.ts"],
  );
});
