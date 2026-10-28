"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { barrelDepths, barrelReach, chainBreakers } = require("./barrel-graph");

/**
 * @param {Record<string, string[]>} edges each module to the modules its `export *` loads
 * @returns {(file: string) => string[]}
 */
function targetsIn(edges) {
  return file => edges[file] ?? [];
}

test("barrelDepths counts barrels below the nearest entry, plain modules adding none", () => {
  const edges = {
    "index.ts": ["a/index.ts", "api.ts"],
    "a/index.ts": ["a/b/index.ts", "entry/index.ts"],
    "api.ts": ["c/index.ts"],
    "c/index.ts": ["a/b/index.ts"],
    "entry/index.ts": ["entry/d/index.ts"],
  };
  const depths = barrelDepths(new Set(["index.ts", "entry/index.ts"]), targetsIn(edges), file =>
    file.endsWith("index.ts"),
  );
  assert.deepEqual(Object.fromEntries(depths), {
    "index.ts": 0,
    "entry/index.ts": 0,
    "a/index.ts": 1,
    "api.ts": 0,
    "a/b/index.ts": 2,
    "c/index.ts": 1,
    "entry/d/index.ts": 1,
  });
});

test("chainBreakers passes the first breaker down, and an entry breaks nothing", () => {
  const edges = {
    "index.ts": ["a/index.ts", "pure/index.ts"],
    "a/index.ts": ["a/b/index.ts"],
    "a/b/index.ts": ["a/b/c/index.ts"],
    "pure/index.ts": ["pure/x/index.ts", "a/b/index.ts"],
  };
  const breakers = chainBreakers(
    new Set(["index.ts"]),
    targetsIn(edges),
    file => file === "index.ts" || file === "a/index.ts" || file === "a/b/index.ts",
  );
  assert.deepEqual(Object.fromEntries(breakers), {
    "a/b/index.ts": "a/index.ts",
    "a/b/c/index.ts": "a/index.ts",
  });
});

test("chainBreakers taints a module first walked clean, and stops on a cycle", () => {
  const edges = {
    "index.ts": ["pure/index.ts", "bad.ts"],
    "pure/index.ts": ["pure/x/index.ts"],
    "pure/x/index.ts": ["pure/index.ts"],
    "bad.ts": ["pure/x/index.ts"],
  };
  const breakers = chainBreakers(
    new Set(["index.ts"]),
    targetsIn(edges),
    file => file === "bad.ts",
  );
  assert.deepEqual(Object.fromEntries(breakers), {
    "pure/x/index.ts": "bad.ts",
    "pure/index.ts": "bad.ts",
  });
});

test("barrelReach names a breaking barrel below the first level, and skips plain modules", () => {
  const root = "/no/such/package/src";
  const edges = {
    [`${root}/index.ts`]: [`${root}/api.ts`, `${root}/broken/index.ts`],
    [`${root}/api.ts`]: [`${root}/client/index.ts`],
    [`${root}/client/index.ts`]: [`${root}/client/http/index.ts`],
    [`${root}/broken/index.ts`]: [`${root}/broken/deep/index.ts`],
  };
  const breaks = {
    [`${root}/api.ts`]: { line: 2, reason: "holds code" },
    [`${root}/broken/index.ts`]: { line: 1, reason: "has a named export" },
  };
  const reach = barrelReach([`${root}/index.ts`], {
    sourceOf: () => undefined,
    targetsOf: targetsIn(edges),
    breakOf: file => breaks[file],
  });
  assert.deepEqual(reach.get(`${root}/client/http/index.ts`), { depth: 2, breaker: undefined });
  assert.deepEqual(reach.get(`${root}/broken/index.ts`), { depth: 1, breaker: undefined });
  assert.deepEqual(reach.get(`${root}/broken/deep/index.ts`), {
    depth: 2,
    breaker: { file: `${root}/broken/index.ts`, line: 1, reason: "has a named export" },
  });
});
