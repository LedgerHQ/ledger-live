import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applySmokeFilter,
  resolveBaseFilter,
  resolveTestFilter,
} from "./resolve-e2e-test-filter.mjs";

const ENABLED_FAMILIES = ["evm", "xrp", "stellar", "tezos"];

test("expands generic coin framework aliases from enabled families", () => {
  assert.equal(
    resolveBaseFilter("@generic-coin-framework", ENABLED_FAMILIES).filter,
    "@family-evm|@family-xrp|@family-stellar|@family-tezos",
  );
  assert.equal(
    resolveBaseFilter("generic-family", ENABLED_FAMILIES).filter,
    "@family-evm|@family-xrp|@family-stellar|@family-tezos",
  );
});

test("preserves explicit extra filters", () => {
  assert.equal(
    resolveBaseFilter("@generic-coin-framework,@solana", ENABLED_FAMILIES).filter,
    "@family-evm|@family-xrp|@family-stellar|@family-tezos|@solana",
  );
});

test("normalizes comma and pipe separated filters", () => {
  assert.equal(
    resolveBaseFilter("@bitcoin,@family-evm|Accounts", ENABLED_FAMILIES).filter,
    ["@bitcoin", "@family-evm", "Accounts"].join("|"),
  );
});

test("deduplicates expanded and explicit filters", () => {
  assert.equal(
    resolveBaseFilter("@generic-coin-framework,@family-evm", ENABLED_FAMILIES).filter,
    "@family-evm|@family-xrp|@family-stellar|@family-tezos",
  );
});

test("applies smoke filter after alias expansion", () => {
  assert.equal(applySmokeFilter("@family-evm|@family-xrp", true), "@smoke @family-evm|@family-xrp");
});

test("emits warnings but preserves resolved filter when a tag has no matches", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-filter-"));
  const relativeTempDir = path.relative(process.cwd(), tempDir);
  const warnings = [];
  const originalWarn = console.warn;

  fs.writeFileSync(path.join(tempDir, "evm.spec.ts"), 'test("evm", { tag: ["@family-evm"] });');

  console.warn = message => warnings.push(message);
  try {
    assert.equal(
      resolveTestFilter({
        input: "@generic-coin-framework",
        checkDir: relativeTempDir,
      }),
      "@family-evm|@family-xrp|@family-stellar|@family-tezos",
    );
  } finally {
    console.warn = originalWarn;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  assert.equal(warnings.length, 3);
});
