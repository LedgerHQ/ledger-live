"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { checkPackage, findPackageRoots } = require("./validate");
const { PACKAGE_EXCEPTIONS } = require("./exceptions");

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
