import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { findDisables } from "./check-coin-families-disables.js";

const SCRIPT = fileURLToPath(new URL("./check-coin-families-disables.js", import.meta.url));

/** @param {Record<string, string>} files */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coin-families-disables-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

const relative = (root, found) => found.map(entry => path.relative(root, entry));

test("finds every form of inline disable that names a coin-families rule", () => {
  const root = fixture({
    "src/a.ts":
      "// oxlint-disable-next-line coin-families/no-coin-specific-import\nimport a from 'x';\n",
    "src/b.tsx": "const b = 1;\n/* eslint-disable coin-families/no-family-branch */\n",
    "src/deep/c.js": "// oxlint-disable-line coin-families/no-currency-id-branch\n",
  });

  assert.deepEqual(relative(root, findDisables(root)).sort(), [
    "src/a.ts:1",
    "src/b.tsx:2",
    "src/deep/c.js:1",
  ]);
});

test("ignores a disable of another rule, a mention of the folder and node_modules", () => {
  const root = fixture({
    "src/a.ts": "// oxlint-disable-next-line eslint/no-console\n",
    "src/b.ts": "// the coin-families/ folder holds the families\n",
    "src/c.ts": "// coin-families/no-coin-specific-import is the rule\n",
    "node_modules/pkg/index.js": "// eslint-disable coin-families/no-coin-specific-import\n",
    "src/notes.md": "oxlint-disable coin-families/no-coin-specific-import\n",
  });

  assert.deepEqual(findDisables(root), []);
});

test("the command exits 1 and lists the disables, and exits 0 when there is none", () => {
  const dirty = fixture({ "src/a.ts": "/* oxlint-disable coin-families/x */\n" });
  const clean = fixture({ "src/a.ts": "export {};\n" });

  const failing = spawnSync("node", [SCRIPT, dirty], { encoding: "utf8" });
  assert.equal(failing.status, 1);
  assert.match(failing.stderr, /src\/a\.ts:1/);

  assert.equal(spawnSync("node", [SCRIPT, clean], { encoding: "utf8" }).status, 0);
});

test("finds a directive that spans several lines, at the line where its comment starts", () => {
  const root = fixture({
    "src/a.ts":
      "const x = 1;\n/* eslint-disable\n   coin-families/no-coin-specific-import */\nimport a from 'x';\n",
  });

  assert.deepEqual(relative(root, findDisables(root)), ["src/a.ts:2"]);
});

test("ignores the directive text inside a string, a template and JSX text", () => {
  const root = fixture({
    "src/a.ts": 'export const s = "eslint-disable coin-families/no-coin-specific-import";\n',
    "src/b.ts": "export const t = `oxlint-disable coin-families/no-coin-specific-import ${1}`;\n",
    "src/c.tsx": "export const c = <p>eslint-disable coin-families/no-coin-specific-import</p>;\n",
    "src/d.tsx": "export const d = <a>// eslint-disable coin-families/no-family-branch</a>;\n",
  });

  assert.deepEqual(findDisables(root), []);
});

test("still finds a directive that follows such text, and one inside a JSX expression", () => {
  const root = fixture({
    "src/a.tsx":
      'const s = "eslint-disable coin-families/x";\n// eslint-disable-next-line coin-families/no-family-branch\nconst y = 1;\n',
    "src/b.tsx": "export const b = <p>{/* eslint-disable coin-families/no-family-branch */}</p>;\n",
  });

  assert.deepEqual(relative(root, findDisables(root)).sort(), ["src/a.tsx:2", "src/b.tsx:1"]);
});

test("finds a directive that trails code on the same line", () => {
  const root = fixture({
    "src/a.ts":
      "const a = 1;\nconst b = 2; // eslint-disable-line coin-families/no-coin-specific-import\n",
    "src/b.ts":
      "const c = 3; /* oxlint-disable coin-families/no-coin-specific-import */ const d = 4;\n",
  });

  assert.deepEqual(relative(root, findDisables(root)).sort(), ["src/a.ts:2", "src/b.ts:1"]);
});

test("ignores prose that mentions a directive, and a directive that names another rule first", () => {
  const rule = "coin-families/no-coin-specific-import";
  const root = fixture({
    "src/a.ts": `// Never use oxlint-disable for ${rule}\n`,
    "src/b.ts": "// eslint-disable-next-line no-console -- report coin-families/ violations\n",
    "src/c.ts": `// note eslint-disable-next-line ${rule}\n`,
  });

  assert.deepEqual(findDisables(root), []);
});

test("finds the forms oxlint honours: a description, a comma list, a leading newline", () => {
  const rule = "coin-families/no-coin-specific-import";
  const root = fixture({
    "src/a.ts": `// eslint-disable-next-line ${rule} -- a reason\n`,
    "src/b.ts": `// eslint-disable-next-line no-console, ${rule}\n`,
    "src/c.ts": `/*\n eslint-disable\n ${rule} */\n`,
  });

  assert.deepEqual(relative(root, findDisables(root)).sort(), [
    "src/a.ts:1",
    "src/b.ts:1",
    "src/c.ts:1",
  ]);
});
