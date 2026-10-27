// Pins the override rule of the devtools presets: setup files add to the preset's.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { createWebJestConfig, createNativeJestConfig } = require(".");

for (const [name, create] of [
  ["createWebJestConfig", createWebJestConfig],
  ["createNativeJestConfig", createNativeJestConfig],
]) {
  test(`${name}: setup files add to the preset's`, () => {
    const preset = create().setupFilesAfterEnv;
    assert.ok(preset.length > 0);
    assert.deepEqual(create({ setupFilesAfterEnv: ["./a.ts"] }).setupFilesAfterEnv, [
      ...preset,
      "./a.ts",
    ]);
  });
}
