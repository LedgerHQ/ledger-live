import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { JSON_FRAGMENTS } from "../restricted-imports.mts";
import { FRAGMENTS_DIR, fragmentConfig } from "./restricted-imports-fragments.js";

test("each JSON fragment matches restricted-imports.mts", () => {
  for (const [file, options] of Object.entries(JSON_FRAGMENTS)) {
    const written = JSON.parse(fs.readFileSync(new URL(file, FRAGMENTS_DIR), "utf8"));
    assert.deepEqual(
      written,
      fragmentConfig(options),
      `${file} is stale: run \`pnpm --filter @support/lint generate:restricted-imports\``,
    );
  }
});

test("restricted-imports/ holds no fragment that JSON_FRAGMENTS does not define", () => {
  assert.deepEqual(fs.readdirSync(FRAGMENTS_DIR).sort(), Object.keys(JSON_FRAGMENTS).sort());
});
