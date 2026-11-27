import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { findProblems } from "./check-legacy-ui-waivers.js";

/**
 * @param {Record<string, string>} files paths relative to the returned root
 * @returns {string} a temporary repo holding `files`
 */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-ui-waivers-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

const APPS = { "apps/mobile": ["@ledgerhq/native-ui", "styled-components"] };

const REPO = fixture({
  "apps/mobile/package.json": "{}",
  "apps/mobile/src/Legacy.tsx": 'import { Flex } from "@ledgerhq/native-ui";\n',
  "apps/mobile/src/Reexport.ts": 'export * from "styled-components/native";\n',
  "apps/mobile/src/Migrated.tsx": 'import { Box } from "@ledgerhq/lumen-ui-rnative";\n',
  "apps/mobile/src/Required.ts": 'export const ui = () => require("@ledgerhq/native-ui");\n',
  "apps/mobile/src/Dynamic.ts": 'export const ui = () => import("@ledgerhq/native-ui");\n',
  "apps/mobile/src/TypeOnly.ts": 'export type T = import("styled-components").DefaultTheme;\n',
  "apps/mobile/src/Mocked.test.ts": 'jest.mock("styled-components/native");\n',
  "apps/mobile/src/screens/Settings/General.tsx": 'import styled from "styled-components";\n',
  "apps/desktop/src/Other.tsx": 'import { Flex } from "@ledgerhq/react-ui";\n',
});

const REASON = "TEMPORARY.";

/**
 * @param {{ fileWaivers?: Record<string, string>, folderWaivers?: Record<string, string> }} waivers
 * @returns {string[]}
 */
function check(waivers) {
  return findProblems({
    repoRoot: REPO,
    fileWaivers: {},
    folderWaivers: {},
    apps: APPS,
    ...waivers,
  });
}

test("a clean list has no problem", () => {
  assert.deepEqual(
    check({
      fileWaivers: { "apps/mobile/src/Legacy.tsx": REASON, "apps/mobile/src/Reexport.ts": REASON },
      folderWaivers: { "apps/mobile/src/screens/Settings/**": REASON },
    }),
    [],
  );
});

test("a file that loads a legacy module through require, import(), an import type or a jest mock is not stale", () => {
  assert.deepEqual(
    check({
      fileWaivers: {
        "apps/mobile/src/Dynamic.ts": REASON,
        "apps/mobile/src/Mocked.test.ts": REASON,
        "apps/mobile/src/Required.ts": REASON,
        "apps/mobile/src/TypeOnly.ts": REASON,
      },
    }),
    [],
  );
});

test("a file that no longer imports a legacy module is stale", () => {
  assert.deepEqual(check({ fileWaivers: { "apps/mobile/src/Migrated.tsx": REASON } }), [
    "apps/mobile/src/Migrated.tsx: no longer imports a legacy UI module, delete its entry",
  ]);
});

test("a deleted file is stale", () => {
  assert.deepEqual(check({ fileWaivers: { "apps/mobile/src/Gone.tsx": REASON } }), [
    "apps/mobile/src/Gone.tsx: the file does not exist, delete its entry",
  ]);
});

test("a folder glob that matches no file is stale", () => {
  assert.deepEqual(
    check({
      folderWaivers: {
        "apps/mobile/src/screens/Discover/**": REASON,
        "apps/mobile/src/Gone.tsx": REASON,
      },
    }),
    [
      "apps/mobile/src/screens/Discover/**: the folder waiver matches no file, delete its entry",
      "apps/mobile/src/Gone.tsx: the folder waiver matches no file, delete its entry",
    ],
  );
});

test("a file under a folder waiver, outside the checked apps or out of order is reported", () => {
  assert.deepEqual(
    check({
      fileWaivers: {
        "apps/mobile/src/screens/Settings/General.tsx": REASON,
        "apps/desktop/src/Other.tsx": REASON,
      },
      folderWaivers: { "apps/mobile/src/screens/Settings/**": REASON },
    }),
    [
      "apps/desktop/src/Other.tsx: out of order, keep the file waivers sorted",
      "apps/mobile/src/screens/Settings/General.tsx: a folder waiver already covers it, delete its entry",
      "apps/desktop/src/Other.tsx: not in a checked app",
    ],
  );
});

test("a legacy-ui rule in the app's suppressions file is reported", () => {
  const repoRoot = fixture({
    "apps/mobile/oxlint-suppressions.json": JSON.stringify({
      "src/New.tsx": { "legacy-ui/no-legacy-import": { count: 1 } },
      "src/Coin.tsx": { "coin-families/no-family-branch": { count: 1 } },
    }),
  });
  assert.deepEqual(findProblems({ repoRoot, fileWaivers: {}, folderWaivers: {}, apps: APPS }), [
    "apps/mobile/src/New.tsx: apps/mobile/oxlint-suppressions.json suppresses a legacy-ui rule, remove it and use Lumen",
  ]);
});
