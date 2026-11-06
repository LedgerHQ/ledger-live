import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

test("ESM and CJS importers share one bignumber.js module (patches/bignumber.js@*.patch)", async () => {
  const esm = await import("bignumber.js");
  const cjs = createRequire(import.meta.url)("bignumber.js");
  assert.equal(esm.default, cjs);
  assert.equal(esm.BigNumber, cjs);
});
