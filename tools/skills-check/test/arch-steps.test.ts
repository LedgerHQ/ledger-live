import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { boundariesJobChecks, lintArchChecks } from "../arch-steps.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..", "..");

const scripts: Record<string, string> = {
  "lint:boundaries": "nx run enforce-boundaries:lint:boundaries",
  "lint:structure": "nx run-many -t lint:structure",
  "lint:tool-config": "nx run-many -t lint:tool-config",
  "lint:i18n-keys": "nx run enforce-i18n-keys:lint:i18n-keys",
  "skills:check": "node tools/skills-check/check.ts",
  "lint:arch":
    "pnpm run lint:boundaries && pnpm run lint:structure && pnpm run lint:tool-config && pnpm run lint:i18n-keys && pnpm run skills:check",
};

const workflow = `
  enforce-boundaries:
    steps:
      - name: Install dev dependencies for root workspace
        run: pnpm i --frozen-lockfile -D -F "ledger-live" --ignore-scripts
      - name: Enforce module boundaries
        run: pnpm exec nx run enforce-boundaries:lint:boundaries
      - name: Test the module-boundary rules
        run: pnpm exec nx run-many -t test -p enforce-boundaries
      - name: Enforce package structure
        run: pnpm exec nx run-many -t lint:structure
      - name: Check tool configs conform to the support/ presets
        run: pnpm exec nx run-many -t lint:tool-config
      - name: Check i18n keys exist in the Desktop and Mobile catalogs
        run: pnpm exec nx run-many -t lint:i18n-keys -p enforce-i18n-keys
      - name: Test the skills and docs check
        run: node --test "tools/skills-check/test/*.test.ts"
      - name: Check skills and docs
        run: pnpm skills:check
`;

describe("lint:arch and the CI boundaries job", () => {
  it("names the lint:arch checks by Nx target or script", () => {
    assert.deepEqual(lintArchChecks(scripts), [
      "lint:boundaries",
      "lint:structure",
      "lint:tool-config",
      "lint:i18n-keys",
      "skills:check",
    ]);
  });

  it("names the CI checks and leaves out install and test steps", () => {
    assert.deepEqual(boundariesJobChecks(workflow, scripts).checks, [
      "lint:boundaries",
      "lint:structure",
      "lint:tool-config",
      "lint:i18n-keys",
      "skills:check",
    ]);
  });

  it("tells a CI step missing from lint:arch", () => {
    const withExtraStep = `${workflow}        run: pnpm exec nx run-many -t lint:i18n-keys\n`;
    assert.notDeepEqual(
      [...boundariesJobChecks(withExtraStep, scripts).checks].sort(),
      [...lintArchChecks(scripts)].sort(),
    );
  });

  it("run the same checks in this repository", () => {
    const rootScripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
      .scripts as Record<string, string>;
    const job = readFileSync(join(root, ".github/workflows/test-boundaries-reusable.yml"), "utf8");
    const { checks, unclassified } = boundariesJobChecks(job, rootScripts);
    assert.deepEqual(unclassified, []);
    assert.deepEqual([...checks].sort(), [...lintArchChecks(rootScripts)].sort());
  });
});
