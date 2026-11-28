"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { toPathPrefixes } = require("./get-affected-packages-and-paths");

test("a lane name inside a package name is not a prefix", () => {
  const prefixes = toPathPrefixes(["libs/live-e2e-shared", "libs/ui/packages/shared"]);
  assert.ok(!prefixes.includes("shared"));
  assert.ok(!prefixes.includes("e2e"));
});

test("every leading segment run of each path is a prefix", () => {
  assert.deepStrictEqual(toPathPrefixes(["libs/ui/packages/react", "shared/auth"]), [
    "libs",
    "libs/ui",
    "libs/ui/packages",
    "libs/ui/packages/react",
    "shared",
    "shared/auth",
  ]);
});

test("paths sharing a parent give the parent once", () => {
  assert.deepStrictEqual(toPathPrefixes(["e2e/desktop", "e2e/mobile"]), [
    "e2e",
    "e2e/desktop",
    "e2e/mobile",
  ]);
});

test("no affected paths give no prefixes", () => {
  assert.deepStrictEqual(toPathPrefixes([]), []);
});
