import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { boundariesJobChecks, lintArchChecks } from "./arch-steps.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const scripts = {
  "lint:boundaries": "nx run enforce-boundaries:lint:boundaries",
  "lint:structure": "nx run-many -t lint:structure",
  "skills:check": "node tools/skills-check/check.mjs",
  "lint:arch": "pnpm run lint:boundaries && pnpm run lint:structure && pnpm run skills:check",
};

const workflow = `
    steps:
      - name: Install dev dependencies for root workspace
        run: pnpm i --frozen-lockfile -D -F "ledger-live" --ignore-scripts
      - name: Enforce module boundaries
        run: pnpm exec nx run enforce-boundaries:lint:boundaries
      - name: Test the module-boundary rules
        run: pnpm exec nx run-many -t test -p enforce-boundaries
      - name: Enforce package structure
        run: pnpm exec nx run-many -t lint:structure
      - name: Test the skills and docs check
        run: node --test "tools/skills-check/*.test.mjs"
      - name: Check skills and docs
        run: pnpm skills:check
`;

describe("lint:arch and the CI boundaries job", () => {
  it("names the lint:arch checks by Nx target or script", () => {
    assert.deepEqual(lintArchChecks(scripts), [
      "lint:boundaries",
      "lint:structure",
      "skills:check",
    ]);
  });

  it("names the CI checks and leaves out install and test steps", () => {
    assert.deepEqual(boundariesJobChecks(workflow, scripts), [
      "lint:boundaries",
      "lint:structure",
      "skills:check",
    ]);
  });

  it("tells a CI step missing from lint:arch", () => {
    const withExtraStep = `${workflow}        run: pnpm exec nx run-many -t lint:i18n-keys\n`;
    assert.notDeepEqual(
      [...boundariesJobChecks(withExtraStep, scripts)].sort(),
      [...lintArchChecks(scripts)].sort(),
    );
  });

  it("run the same checks in this repository", () => {
    const rootScripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;
    const job = readFileSync(join(root, ".github/workflows/test-boundaries-reusable.yml"), "utf8");
    assert.deepEqual(
      [...boundariesJobChecks(job, rootScripts)].sort(),
      [...lintArchChecks(rootScripts)].sort(),
    );
  });
});
