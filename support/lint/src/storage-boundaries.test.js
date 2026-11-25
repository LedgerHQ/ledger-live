import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  isAdapterFile,
  isEnginePackage,
  isPortPackage,
  isPortUserFile,
} from "./storage-boundaries.js";

/**
 * @param {Record<string, string>} files paths relative to the returned root
 * @returns {string} a temporary directory holding `files`
 */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storage-boundaries-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

test("matches the storage engine packages and their subpaths", () => {
  assert.equal(isEnginePackage("react-native-mmkv"), true);
  assert.equal(isEnginePackage("@react-native-async-storage/async-storage"), true);
  assert.equal(isEnginePackage("@react-native-async-storage/async-storage/jest"), true);
  assert.equal(isEnginePackage("electron-store"), true);
  assert.equal(isEnginePackage("react-native-mmkv-storage"), false);
  assert.equal(isEnginePackage("@shared/storage-mmkv"), false);
});

test("matches the storage port, its adapters and their subpaths only", () => {
  assert.equal(isPortPackage("@shared/storage"), true);
  assert.equal(isPortPackage("@shared/storage/testing"), true);
  assert.equal(isPortPackage("@shared/storage-mmkv"), true);
  assert.equal(isPortPackage("@shared/storage-electron/src/index"), true);
  assert.equal(isPortPackage("@shared/storage-"), false);
  assert.equal(isPortPackage("@shared/storagex"), false);
  assert.equal(isPortPackage("@shared/persistence"), false);
});

test("allows the engines only in a storage adapter", () => {
  assert.equal(isAdapterFile("/repo/shared/storage-mmkv/src/createMmkvStorage.ts"), true);
  assert.equal(isAdapterFile("/repo/shared/storage/src/StoragePort.ts"), false);
  assert.equal(isAdapterFile("/repo/apps/ledger-live-mobile/src/db.ts"), false);
});

test("allows the port in persistence, the adapters and the app composition roots", () => {
  assert.equal(isPortUserFile("/repo/shared/storage/src/index.ts"), true);
  assert.equal(isPortUserFile("/repo/shared/storage-electron/src/index.ts"), true);
  assert.equal(isPortUserFile("/repo/features/platform/persistence/src/hydrate.ts"), true);
  assert.equal(
    isPortUserFile("/repo/apps/ledger-live-desktop/src/persistence/composition.ts"),
    true,
  );
  assert.equal(isPortUserFile("/repo/libs/live-e2e-shared/src/userdataAccounts.ts"), true);
  assert.equal(isPortUserFile("/repo/libs/live-e2e-shared/src/cliCommandsUtils.ts"), false);
  assert.equal(isPortUserFile("/repo/apps/ledger-live-desktop/src/renderer/init.tsx"), false);
  assert.equal(isPortUserFile("/repo/features/platform/contacts/src/index.ts"), false);
  assert.equal(isPortUserFile("/repo/shared/persistence/src/defineRecord.ts"), false);
});

test("oxlint runs both rules end to end", () => {
  const oxlint = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
  const source = [
    'import { createMMKV } from "react-native-mmkv";',
    'import AsyncStorage from "@react-native-async-storage/async-storage";',
    'import Store from "electron-store";',
    'import type { StoragePort } from "@shared/storage";',
    'import { describeStorageContract } from "@shared/storage/testing";',
    'jest.mock("react-native-mmkv");',
    'localStorage.getItem("a");',
    'window.sessionStorage.setItem("a", "b");',
    "const notStorage = { localStorage: 1 }.localStorage;",
    'import { createMmkvStorage } from "@shared/storage-mmkv";',
    "",
  ].join("\n");
  const root = fixture({
    ".oxlintrc.json": JSON.stringify({
      plugins: [],
      jsPlugins: [fileURLToPath(new URL("./storage-boundaries.js", import.meta.url))],
      rules: { "storage/no-engine-import": "error", "storage/no-port-import": "error" },
    }),
    "features/platform/contacts/src/a.ts": source,
    "shared/storage-mmkv/src/a.ts": source,
    "features/platform/persistence/src/a.ts": source,
    "apps/ledger-live-mobile/src/persistence/a.ts": source,
  });

  const { stdout } = spawnSync(oxlint, ["--format", "unix", "."], { cwd: root, encoding: "utf8" });
  const reported = stdout
    .split("\n")
    .filter(line => line.includes("storage(no-"))
    .map(line => {
      const [file, lineNumber] = line.split(":");
      const rule = line.includes("no-engine-import") ? "engine" : "port";
      return `${file}:${lineNumber} ${rule}`;
    })
    .sort();

  assert.deepEqual(reported, [
    "apps/ledger-live-mobile/src/persistence/a.ts:1 engine",
    "apps/ledger-live-mobile/src/persistence/a.ts:2 engine",
    "apps/ledger-live-mobile/src/persistence/a.ts:3 engine",
    "apps/ledger-live-mobile/src/persistence/a.ts:6 engine",
    "apps/ledger-live-mobile/src/persistence/a.ts:7 engine",
    "apps/ledger-live-mobile/src/persistence/a.ts:8 engine",
    "features/platform/contacts/src/a.ts:1 engine",
    "features/platform/contacts/src/a.ts:10 port",
    "features/platform/contacts/src/a.ts:2 engine",
    "features/platform/contacts/src/a.ts:3 engine",
    "features/platform/contacts/src/a.ts:4 port",
    "features/platform/contacts/src/a.ts:5 port",
    "features/platform/contacts/src/a.ts:6 engine",
    "features/platform/contacts/src/a.ts:7 engine",
    "features/platform/contacts/src/a.ts:8 engine",
    "features/platform/persistence/src/a.ts:1 engine",
    "features/platform/persistence/src/a.ts:2 engine",
    "features/platform/persistence/src/a.ts:3 engine",
    "features/platform/persistence/src/a.ts:6 engine",
    "features/platform/persistence/src/a.ts:7 engine",
    "features/platform/persistence/src/a.ts:8 engine",
  ]);
});
