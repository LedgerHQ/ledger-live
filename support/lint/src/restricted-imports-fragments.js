// Writes the JSON fragments of `restricted-imports/` from `JSON_FRAGMENTS`, for the oxlint configs
// that stay JSON. Run it with `pnpm --filter @support/lint generate:restricted-imports`.

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { JSON_FRAGMENTS } from "../restricted-imports.mts";

export const FRAGMENTS_DIR = new URL("../restricted-imports/", import.meta.url);

/**
 * @param {object} options the options of `eslint/no-restricted-imports`
 * @returns {object} an oxlint config that sets the rule, and only it
 */
export function fragmentConfig(options) {
  return { rules: { "eslint/no-restricted-imports": ["error", options] } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.mkdirSync(FRAGMENTS_DIR, { recursive: true });
  for (const [file, options] of Object.entries(JSON_FRAGMENTS)) {
    const content = `${JSON.stringify(fragmentConfig(options), null, 2)}\n`;
    fs.writeFileSync(new URL(file, FRAGMENTS_DIR), content);
  }
}
