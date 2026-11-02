import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadLockfile } from "../dependency-checks/check-lockfile.ts";
import { assertDependencyChecks, dependencyChains } from "../dependency-checks/validate.js";
import { lockfile } from "./fixtures.ts";

describe("dependency checks", () => {
  it("finds the shortest chain to each wanted version", () => {
    const lock = loadLockfile(
      lockfile(
        { app: "1.0.0", lib: "1.0.0" },
        {
          "app@1.0.0": { mid: "1.0.0" },
          "mid@1.0.0": { leaf: "2.0.0(peer@1.0.0)" },
          "lib@1.0.0": { leaf: "1.0.0" },
          "leaf@1.0.0": {},
          "leaf@2.0.0(peer@1.0.0)": {},
        },
      ),
    );

    assert.deepEqual(
      dependencyChains(lock, ["leaf@1.0.0", "leaf@2.0.0", "leaf@3.0.0"]),
      new Map([
        ["leaf@1.0.0", ". > lib > leaf"],
        ["leaf@2.0.0", ". > app > mid > leaf"],
      ]),
    );
  });

  it("follows pnpm aliases and keeps the alias name in the chain", () => {
    const lock = loadLockfile(
      lockfile(
        { typescript: "'@typescript/typescript6@6.0.2'", app: "1.0.0" },
        {
          "app@1.0.0": { "string-width-cjs": "'string-width@4.2.3'" },
          "@typescript/typescript6@6.0.2": { leaf: "1.0.0" },
          "string-width@4.2.3": { leaf: "2.0.0" },
          "leaf@1.0.0": {},
          "leaf@2.0.0": {},
        },
      ),
    );

    assert.deepEqual(
      dependencyChains(lock, [
        "@typescript/typescript6@6.0.2",
        "string-width@4.2.3",
        "leaf@1.0.0",
        "leaf@2.0.0",
      ]),
      new Map([
        ["@typescript/typescript6@6.0.2", ". > typescript"],
        ["string-width@4.2.3", ". > app > string-width-cjs"],
        ["leaf@1.0.0", ". > typescript > leaf"],
        ["leaf@2.0.0", ". > app > string-width-cjs > leaf"],
      ]),
    );
  });

  it("names the chain of a denied package", () => {
    const lock = loadLockfile(
      lockfile({ app: "1.0.0" }, { "app@1.0.0": { unimported: "1.0.0" }, "unimported@1.0.0": {} }),
    );

    assert.throws(
      () => assertDependencyChecks(lock),
      /unimported entered the tree: \. > app > unimported/,
    );
  });
});
