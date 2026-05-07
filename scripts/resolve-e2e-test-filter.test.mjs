import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { test } from "node:test";

import {
  applySmokeFilter,
  resolveBaseFilter,
  resolveTestFilter,
} from "./resolve-e2e-test-filter.mjs";

const ENABLED_FAMILIES = ["evm", "xrp", "stellar", "tezos"];

test("expands generic Alpaca aliases from enabled families", () => {
  assert.equal(
    resolveBaseFilter("@generic-alpaca", ENABLED_FAMILIES).filter,
    "@family-evm|@family-xrp|@family-stellar|@family-tezos",
  );
  assert.equal(
    resolveBaseFilter("generic-family", ENABLED_FAMILIES).filter,
    "@family-evm|@family-xrp|@family-stellar|@family-tezos",
  );
});

test("preserves explicit extra filters", () => {
  assert.equal(
    resolveBaseFilter("@generic-alpaca,@solana", ENABLED_FAMILIES).filter,
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
    resolveBaseFilter("@generic-alpaca,@family-evm", ENABLED_FAMILIES).filter,
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
        input: "@generic-alpaca",
        checkDir: relativeTempDir,
      }),
      "@family-evm|@family-xrp|@family-stellar|@family-tezos",
    );
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 3);
});
